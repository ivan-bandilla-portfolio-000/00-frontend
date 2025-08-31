import {
    CreateMLCEngine,
    CreateWebWorkerMLCEngine,
    type MLCEngineInterface,
    type MLCEngineConfig,
    // type AppConfig,
    prebuiltAppConfig
} from "@mlc-ai/web-llm";
import { toast } from "sonner";

import { event as gaEvent } from "@/features/analytics";

type StreamCb = (chunk: string) => void;

export interface GenerateOptions {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop?: string[];
}

interface ChatMessageLike { role: "system" | "user" | "assistant"; content: string; }

interface InternalTask {
    id: string;
    prompt: string;
    stream: boolean;
    onStream?: StreamCb;
    resolve: (v: string) => void;
    reject: (e: any) => void;
    controller: AbortController;
    opts?: GenerateOptions;
    messages?: ChatMessageLike[];
}

export interface LLMServiceOptions {
    modelId: string;
    smallModelId?: string;      // fallback lighter model
    useWorker?: boolean;
    systemPrompt?: string;
}

export interface ProgressEvent {
    progress: number;   // 0..1
    text?: string;
}

export class LLMService {
    private engine: MLCEngineInterface | null = null;
    private queue: InternalTask[] = [];
    private busy = false;
    private systemPrompt: string;
    private modelId: string;
    private smallModelId?: string;
    private useWorker: boolean;
    private _initialized = false;
    private failed = false;
    private fallbackTried = false;
    private smallTried = false;
    private _statusMessage: string | null = null;
    public readonly requirementsMet: boolean;
    private progressListeners = new Set<(e: ProgressEvent) => void>();
    private preferSmallModel = false;
    private thinkModeEnabled = false;

    static lastRequirementsFailureReasons: string[] = [];

    constructor(opts: LLMServiceOptions) {
        this.modelId = opts.modelId;
        this.smallModelId = opts.smallModelId;
        this.useWorker = opts.useWorker ?? true;
        this.systemPrompt = opts.systemPrompt || "You are a helpful assistant.";
        this.requirementsMet = LLMService.checkRequirements();

        // If deviceMemory is available, prefer the smaller model on <= 8 GB
        const mem = (navigator as any).deviceMemory;
        if (typeof mem === "number") {
            this.preferSmallModel = mem <= 8;
            if (this.preferSmallModel) {
                console.info("[LLM] Low RAM detected (deviceMemory <= 8GB) - will try smaller model first if available");
            }
        }

        if (!this.requirementsMet) {
            try {
                gaEvent('llm_init_unsupported', {
                    reasons: LLMService.lastRequirementsFailureReasons,
                    timestamp: new Date().toISOString(),
                });
            } catch { /* ignore analytics errors */ }
        }
    }

    static checkRequirements(): boolean {
        const reasons: string[] = [];
        // WebGPU presence
        const webgpu = 'gpu' in navigator;
        if (!webgpu) {
            reasons.push('no_webgpu');
            console.warn("[LLM] WebGPU not available");
        }
        // Heuristics
        const mem = (navigator as any).deviceMemory;
        if (mem && mem < 4) {
            reasons.push(`low_memory_${mem}`);
            console.warn("[LLM] Insufficient memory");
        }
        const cores = navigator.hardwareConcurrency;
        if (cores && cores < 4) {
            reasons.push(`low_cpu_cores_${cores}`);
            console.warn("[LLM] Insufficient CPU cores");
        }

        this.lastRequirementsFailureReasons = reasons;
        return reasons.length === 0;
    }

    public get initialized() {
        return this._initialized;
    }

    public get statusMessage() {
        return this._statusMessage;
    }

    public onProgress(cb: (e: ProgressEvent) => void): () => void {
        this.progressListeners.add(cb);
        return () => { this.progressListeners.delete(cb); };
    }

    isReady() { return this._initialized && !this.failed; }
    initFailed() { return this.failed; }
    isBusy() { return this.busy; }
    usingWorker() { return this.useWorker; }

    setSystemPrompt(p: string) { this.systemPrompt = p; }

    async init() {
        if (this._initialized || this.failed) return;

        const start = performance.now();

        // Probe WebGPU adapter limits and adapt to avoid the "requested exceeds limit" failure
        try {
            const limits = await this.probeWebGPULimits();
            if (limits) {
                const wantStorageMB = 1024;          // what the runtime may request
                const wantWorkgroup = 32768;         // what the runtime may request
                if (limits.maxStorageBufferBindingSize < wantStorageMB * 1024 * 1024 ||
                    limits.maxComputeWorkgroupStorageSize < wantWorkgroup) {
                    console.warn("[LLM] GPU limits too low, disabling worker/GPU init", limits);
                    this._statusMessage = "[LLM] GPU limits low - forcing CPU/main-thread fallback";
                    // Force not using the worker/GPU path so tryInitChain will try main-thread / smaller model
                    this.useWorker = false;

                    try {
                        gaEvent('llm_probe_gpu_limits_low', {
                            limits,
                            forced_worker_disabled: true,
                            timestamp: new Date().toISOString()
                        });
                    } catch { /* ignore */ }
                } else {
                    try {
                        gaEvent('llm_probe_gpu_limits_ok', {
                            limits,
                            timestamp: new Date().toISOString()
                        });
                    } catch { /* ignore */ }
                }
            }
        } catch (err) {
            console.warn("[LLM] Failed to probe WebGPU limits:", err);
        }

        await this.tryInitChain();

        if (this._initialized) {
            const duration = Math.round(performance.now() - start);
            try {
                gaEvent('llm_init_success', {
                    model: this.modelId,
                    usedWorker: this.useWorker,
                    duration_ms: duration,
                    timestamp: new Date().toISOString(),
                });
            } catch { /* ignore */ }

            setTimeout(() => {
                toast.success("LLM initialized successfully", {
                    position: "bottom-center",
                });
            }, 600);
        }
    }

    private async tryInitChain() {
        // If RAM heuristic says prefer smaller model, try it first (on main thread)
        if (this.preferSmallModel && this.smallModelId && !this.smallTried) {
            this.smallTried = true;
            try {
                console.warn("[LLM] Preferring smaller model due to low RAM:", this.smallModelId);
                await this.loadEngine(this.smallModelId, false);
                this.modelId = this.smallModelId;
                this._initialized = true;
                try {
                    gaEvent('llm_init_model_load_succeeded', {
                        stage: 'prefer_small_model',
                        model: this.smallModelId,
                        worker: false,
                        timestamp: new Date().toISOString()
                    });
                } catch { /* ignore */ }
                return;
            } catch (e) {
                console.warn("[LLM] Preferred smaller model failed, falling back to normal init chain:", e);
                try {
                    gaEvent('llm_init_model_load_failed', {
                        stage: 'prefer_small_model',
                        model: this.smallModelId,
                        worker: false,
                        error: String(e),
                        timestamp: new Date().toISOString()
                    });
                } catch { /* ignore */ }
            }
        }

        try {
            await this.loadEngine(this.modelId, this.useWorker);
            this._initialized = true;
            return;
        } catch (e) {
            console.warn("[LLM] Primary init failed:", e);

            try {
                gaEvent('llm_init_model_load_failed', {
                    stage: 'primary',
                    model: this.modelId,
                    worker: this.useWorker,
                    error: String(e),
                    timestamp: new Date().toISOString()
                });
            } catch { /* ignore */ }
        }
        if (!this.fallbackTried) {
            this.fallbackTried = true;
            try {
                console.warn("[LLM] Fallback: main-thread load of primary model");
                await this.loadEngine(this.modelId, false);
                this._initialized = true;
                try {
                    gaEvent('llm_init_model_load_succeeded', {
                        stage: 'fallback_main_thread',
                        model: this.modelId,
                        worker: false,
                        timestamp: new Date().toISOString()
                    });
                } catch { /* ignore */ }
                return;
            } catch (e) {
                console.warn("[LLM] Main-thread primary failed:", e);
                try {
                    gaEvent('llm_init_model_load_failed', {
                        stage: 'fallback_main_thread',
                        model: this.modelId,
                        worker: false,
                        error: String(e),
                        timestamp: new Date().toISOString()
                    });
                } catch { /* ignore */ }
            }
        }
        if (this.smallModelId && !this.smallTried) {
            this.smallTried = true;
            try {
                console.warn("[LLM] Trying smaller model:", this.smallModelId);
                await this.loadEngine(this.smallModelId, false);
                this.modelId = this.smallModelId;
                this._initialized = true;
                try {
                    gaEvent('llm_init_model_load_succeeded', {
                        stage: 'small_model',
                        model: this.smallModelId,
                        worker: false,
                        timestamp: new Date().toISOString()
                    });
                } catch { /* ignore */ }
                return;
            } catch (e) {
                console.warn("[LLM] Smaller model failed:", e);
                try {
                    gaEvent('llm_init_model_load_failed', {
                        stage: 'small_model',
                        model: this.smallModelId,
                        worker: false,
                        error: String(e),
                        timestamp: new Date().toISOString()
                    });
                } catch { /* ignore */ }
            }
        }


        this.failed = true;

        try {
            gaEvent('llm_init_failed_final', {
                model_attempted: this.modelId,
                small_model_available: !!this.smallModelId,
                requirements_reasons: LLMService.lastRequirementsFailureReasons,
                timestamp: new Date().toISOString()
            });
        } catch { /* ignore */ }
    }

    private async probeWebGPULimits(): Promise<{ maxStorageBufferBindingSize: number; maxComputeWorkgroupStorageSize: number } | null> {
        if (!('gpu' in navigator)) return null;
        try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            if (!adapter) return null;
            const limits = (adapter as any).limits || {};
            return {
                maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize ?? 0,
                maxComputeWorkgroupStorageSize: limits.maxComputeWorkgroupStorageSize ?? 0
            };
        } catch (e) {
            return null;
        }
    }

    private async loadEngine(modelId: string, worker: boolean) {
        const initProgressCallback: MLCEngineConfig["initProgressCallback"] = (p: any) => {
            const progress = typeof p === "number" ? p : p?.progress ?? 0;
            const text = typeof p === "object" ? p?.text : undefined;

            const progressPercent = Math.round(progress * 100);
            this._statusMessage = `[LLM] Init progress: ${progressPercent}%${text ? ` - ${text}` : ""}`;
            this.progressListeners.forEach(cb => cb({ progress, text }));
        };

        const engineConfig: MLCEngineConfig = {
            initProgressCallback,
            appConfig: { ...prebuiltAppConfig, useIndexedDBCache: true }
        };

        if (worker) {
            const w = new Worker(new URL("./LLM.webworker.ts", import.meta.url), { type: "module" });
            this.engine = await CreateWebWorkerMLCEngine(w, modelId, engineConfig);
        } else {
            this.engine = await CreateMLCEngine(modelId, engineConfig);
        }
    }

    getResponse(prompt: string, stream = false, onStream?: StreamCb, opts?: GenerateOptions) {
        return this.enqueue(prompt, stream, onStream, opts).promise;
    }
    getResponseAbortable(prompt: string, stream = false, onStream?: StreamCb, opts?: GenerateOptions) {
        return this.enqueue(prompt, stream, onStream, opts);
    }

    abortAll() {
        this.queue.forEach(t => t.controller.abort());
    }

    getResponseAbortableFromMessages(
        messages: ChatMessageLike[],
        stream = false,
        onStream?: StreamCb,
        opts?: GenerateOptions,
    ) {
        return this.enqueue("", stream, onStream, opts, messages);
    }

    private enqueue(
        prompt: string,
        stream: boolean,
        onStream?: StreamCb,
        opts?: GenerateOptions,
        messages?: ChatMessageLike[],
    ) {
        if (!this.engine || !this._initialized || this.failed) {
            return {
                promise: Promise.reject(new Error("LLM not ready")),
                abort: () => { },
                signal: new AbortController().signal,
            };
        }
        const controller = new AbortController();
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const promise = new Promise<string>((resolve, reject) => {
            const task: InternalTask = {
                id,
                prompt,
                stream,
                onStream,
                resolve,
                reject,
                controller,
                opts,
                messages,
            };
            this.queue.push(task);
            this.process();
        });
        return { promise, abort: () => controller.abort(), signal: controller.signal };
    }

    private async process() {
        if (this.busy) return;
        const task = this.queue.shift();
        if (!task) return;
        this.busy = true;
        try {
            const out = await this.exec(task);
            task.resolve(out);
        } catch (e) {
            task.reject(e);
            // Detect device lost / hung to trigger fallback to smaller model (future enhancement)
            if (/device[_ ]lost|device[_ ]hung|dxgi_error_device_hung/i.test(String(e))) {
                console.warn("[LLM] Device lost detected");
                try { gaEvent('llm_runtime_device_lost', { error: String(e), timestamp: new Date().toISOString() }); } catch { }
            } else {
                try { gaEvent('llm_runtime_error', { error: String(e), timestamp: new Date().toISOString() }); } catch { }
            }
        } finally {
            this.busy = false;
            queueMicrotask(() => this.process());
        }
    }

    private async exec(t: InternalTask): Promise<string> {
        if (t.controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        // Use provided messages (prepend system), else fallback to single-turn
        let messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

        // helper to parse inline commands like "\think", "/think", "\no_think", "/nothink"
        const cmdRe = /^\s*[\\\/](no[_-]?think|nothink|think)\b\s*(.*)$/i;
        const modelSupportsThink = /qwen|deepseek/i.test(this.modelId || "");

        const stripThinkFromString = (s: string) =>
            (s || "").replace(/<think\b[^>]*>[\s\S]*?<\/think>/ig, "").replace(/<think\b[^>]*>/ig, "").replace(/<\/think>/ig, "");

        // If chat messages provided, find the last user message and check for a toggle command
        if (t.messages && t.messages.length) {
            // clone messages to avoid mutating caller array
            // If the model supports <think> and think-mode is disabled, add an explicit system instruction to forbid it
            const systemContent = (modelSupportsThink && !this.thinkModeEnabled)
                ? `${this.systemPrompt}\nDo NOT output or reveal internal chain-of-thought. Do not emit or display <think> or </think> tags; respond plainly to the user's message.`
                : this.systemPrompt;
            messages = [{ role: "system", content: systemContent }, ...t.messages.map(m => ({ ...m }))];
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === "user") {
                    const m = messages[i].content || "";
                    const match = m.match(cmdRe);
                    if (match) {
                        const cmd = match[1].toLowerCase();
                        const rest = match[2] ?? "";
                        if (cmd === "think") this.thinkModeEnabled = true;
                        else this.thinkModeEnabled = false;
                        // replace content with remainder after command
                        messages[i].content = rest.trim();
                    }
                    break;
                }
            }
            // if think-mode should be applied, prefix user messages that don't already include <think>
            if (modelSupportsThink && this.thinkModeEnabled) {
                for (let i = 0; i < messages.length; i++) {
                    if (messages[i].role === "user") {
                        const c = messages[i].content || "";
                        if (!c.trim().toLowerCase().startsWith("<think>")) {
                            messages[i].content = `<think> ${c}`.trim();
                        }
                    }
                }
            }
        } else {
            // single-turn prompt path
            let prompt = t.prompt || "";
            const match = prompt.match(cmdRe);
            if (match) {
                const cmd = match[1].toLowerCase();
                const rest = match[2] ?? "";
                if (cmd === "think") this.thinkModeEnabled = true;
                else this.thinkModeEnabled = false;
                prompt = rest.trim();
            }
            // If model supports think but think-mode disabled, add explicit system instruction to forbid <think>
            const systemContent = (modelSupportsThink && !this.thinkModeEnabled)
                ? `${this.systemPrompt}\nDo NOT output or reveal internal chain-of-thought. Do not emit or display <think> or </think> tags; respond plainly to the user's message.`
                : this.systemPrompt;
            if (modelSupportsThink && this.thinkModeEnabled && !prompt.trim().toLowerCase().startsWith("<think>")) {
                prompt = `<think> ${prompt}`.trim();
            }
            messages = [
                { role: "system", content: systemContent },
                { role: "user", content: prompt },
            ];
        }
        if (t.stream) {
            let reply = "";
            // stateful streaming filter to drop content inside <think> ... </think> across chunk boundaries
            let inThinkTag = false;
            const filterStreamChunk = (chunkStr: string) => {
                if (!chunkStr) return "";
                let out = "";
                let remaining = chunkStr;
                while (remaining) {
                    if (inThinkTag) {
                        const closeIdx = remaining.search(/<\/think>/i);
                        if (closeIdx === -1) {
                            // still inside think, drop whole remaining
                            remaining = "";
                            break;
                        } else {
                            // drop up to and including closing tag
                            remaining = remaining.slice(closeIdx + remaining.match(/<\/think>/i)![0].length);
                            inThinkTag = false;
                            continue;
                        }
                    } else {
                        const openMatch = remaining.match(/<think\b[^>]*>/i);
                        if (!openMatch) {
                            // no open tag, emit all
                            out += remaining;
                            remaining = "";
                            break;
                        } else {
                            const idx = openMatch.index!;
                            out += remaining.slice(0, idx);
                            // advance past opening tag
                            remaining = remaining.slice(idx + openMatch[0].length);
                            // check if closing exists in same chunk
                            const closeIdx = remaining.search(/<\/think>/i);
                            if (closeIdx === -1) {
                                // enter think mode, drop rest until we find closing in later chunks
                                inThinkTag = true;
                                remaining = "";
                                break;
                            } else {
                                // remove content up to closing tag, then continue after it
                                remaining = remaining.slice(closeIdx + remaining.match(/<\/think>/i)![0].length);
                                inThinkTag = false;
                                continue;
                            }
                        }
                    }
                }
                // also remove any stray standalone tags
                out = out.replace(/<\/?think\b[^>]*>/ig, "");
                return out;
            };

            const iterable = await this.engine!.chat.completions.create({
                messages,
                stream: true,
                max_tokens: t.opts?.max_tokens,
                temperature: t.opts?.temperature,
                top_p: t.opts?.top_p,
                stop: t.opts?.stop
            } as any);
            for await (const chunk of iterable as any) {
                if (t.controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
                const delta = chunk.choices?.[0]?.delta?.content || "";
                if (delta) {
                    // filter out think-tagged content for the stream if think-mode disabled
                    const toEmit = (modelSupportsThink && !this.thinkModeEnabled) ? filterStreamChunk(delta) : delta;
                    reply += toEmit;
                    if (toEmit) t.onStream?.(toEmit);
                }
            }
            return reply;
        } else {
            const res: any = await this.engine!.chat.completions.create({
                messages,
                stream: false,
                max_tokens: t.opts?.max_tokens,
                temperature: t.opts?.temperature,
                top_p: t.opts?.top_p,
                stop: t.opts?.stop
            } as any);
            if (t.controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
            let text = res.choices?.[0]?.message?.content ?? "";
            if (modelSupportsThink && !this.thinkModeEnabled) {
                text = stripThinkFromString(text);
            }
            return text;
        }
    }
}

let __sharedLLM: LLMService | null = null;
let __sharedInitPromise: Promise<void> | null = null;

/**
 * Get (or create) the single shared LLMService instance.
 * Subsequent calls return the same object so model stays in memory across route remounts.
 */
export function getOrCreateSharedLLM(opts: LLMServiceOptions) {
    if (!__sharedLLM) {
        __sharedLLM = new LLMService(opts);
    }
    return __sharedLLM;
}

/**
 * Ensure the shared LLM is initialized exactly once.
 * Multiple concurrent callers await the same promise.
 */
export function ensureSharedLLMInitialized(initFn: () => Promise<void>) {
    if (__sharedLLM?.isReady()) return Promise.resolve();
    if (__sharedInitPromise) return __sharedInitPromise;
    __sharedInitPromise = (async () => {
        try {
            await initFn();
        } finally {
            __sharedInitPromise = null;
        }
    })();
    return __sharedInitPromise;
}

