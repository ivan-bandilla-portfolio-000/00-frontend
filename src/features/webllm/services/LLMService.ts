import {
    CreateMLCEngine,
    CreateWebWorkerMLCEngine,
    type MLCEngineInterface,
    type MLCEngineConfig,
    // type AppConfig,
    prebuiltAppConfig
} from "@mlc-ai/web-llm";
import { toast } from "sonner";

type StreamCb = (chunk: string) => void;

export interface GenerateOptions {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop?: string[];
}

interface InternalTask {
    id: string;
    prompt: string;
    stream: boolean;
    onStream?: StreamCb;
    resolve: (v: string) => void;
    reject: (e: any) => void;
    controller: AbortController;
    opts?: GenerateOptions;
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
    private progressCbs = new Set<(p: ProgressEvent) => void>();
    private _statusMessage: string | null = null;
    public readonly requirementsMet: boolean;

    constructor(opts: LLMServiceOptions) {
        this.modelId = opts.modelId;
        this.smallModelId = opts.smallModelId;
        this.useWorker = opts.useWorker ?? true;
        this.systemPrompt = opts.systemPrompt || "You are a helpful assistant.";
        this.requirementsMet = LLMService.checkRequirements();
    }

    static checkRequirements(): boolean {
        // WebGPU presence
        const webgpu = 'gpu' in navigator;
        if (!webgpu) {
            console.warn("[LLM] WebGPU not available");
            // return false;
        }
        // Heuristics (adjust thresholds if needed)
        const mem = (navigator as any).deviceMemory;
        if (mem && mem < 4) {
            console.warn("[LLM] Insufficient memory");
            return false;
        }
        const cores = navigator.hardwareConcurrency;
        if (cores && cores < 4) {
            console.warn("[LLM] Insufficient CPU cores");
            return false;
        }
        return true;
    }

    public get initialized() {
        return this._initialized;
    }

    public get statusMessage() {
        return this._statusMessage;
    }

    onProgress(cb: (p: ProgressEvent) => void) {
        this.progressCbs.add(cb);
        return () => this.progressCbs.delete(cb);
    }

    isReady() { return this._initialized && !this.failed; }
    initFailed() { return this.failed; }
    isBusy() { return this.busy; }
    usingWorker() { return this.useWorker; }

    setSystemPrompt(p: string) { this.systemPrompt = p; }

    async init() {
        if (this._initialized || this.failed) return;
        await this.tryInitChain();

        if (this._initialized) {
            setTimeout(() => {
                toast.success("LLM initialized successfully", {
                    position: "bottom-center",
                });
            }, 600);
        }
    }

    private async tryInitChain() {
        try {
            await this.loadEngine(this.modelId, this.useWorker);
            this._initialized = true;
            return;
        } catch (e) {
            console.warn("[LLM] Primary init failed:", e);
        }
        if (!this.fallbackTried) {
            this.fallbackTried = true;
            try {
                console.warn("[LLM] Fallback: main-thread load of primary model");
                await this.loadEngine(this.modelId, false);
                this._initialized = true;
                return;
            } catch (e) {
                console.warn("[LLM] Main-thread primary failed:", e);
            }
        }
        if (this.smallModelId && !this.smallTried) {
            this.smallTried = true;
            try {
                console.warn("[LLM] Trying smaller model:", this.smallModelId);
                await this.loadEngine(this.smallModelId, false);
                this.modelId = this.smallModelId;
                this._initialized = true;
                return;
            } catch (e) {
                console.warn("[LLM] Smaller model failed:", e);
            }
        }


        this.failed = true;
    }

    private async loadEngine(modelId: string, worker: boolean) {
        const initProgressCallback: MLCEngineConfig["initProgressCallback"] = (p: any) => {
            const progress = typeof p === "number" ? p : p?.progress ?? 0;
            const text = typeof p === "object" ? p?.text : undefined;
            this.progressCbs.forEach(cb => cb({ progress, text }));

            const progressPercent = Math.round(progress * 100);
            this._statusMessage = `[LLM] Init progress: ${progressPercent}%${text ? ` - ${text}` : ""}`;
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

    private enqueue(prompt: string, stream: boolean, onStream?: StreamCb, opts?: GenerateOptions) {
        if (!this.engine || !this._initialized || this.failed) {
            return {
                promise: Promise.reject(new Error("LLM not ready")),
                abort: () => { },
                signal: new AbortController().signal
            };
        }
        const controller = new AbortController();
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const promise = new Promise<string>((resolve, reject) => {
            const task: InternalTask = { id, prompt, stream, onStream, resolve, reject, controller, opts };
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
            }
        } finally {
            this.busy = false;
            queueMicrotask(() => this.process());
        }
    }

    private async exec(t: InternalTask): Promise<string> {
        if (t.controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        const messages = [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: t.prompt }
        ];
        if (t.stream) {
            let reply = "";
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
                    reply += delta;
                    t.onStream?.(delta);
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
            return res.choices?.[0]?.message?.content ?? "";
        }
    }
}