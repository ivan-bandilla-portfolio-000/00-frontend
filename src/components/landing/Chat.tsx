import React, { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLLM } from "@/contexts/LLMContext";
import personalInfo from "@/constants/personalInfo";
import { Sparkles as SparklesIcon } from "lucide-react";
import { useClientDB } from "@/clientDB/context";
import { event as gaEvent } from "@/features/analytics";
import { buildAboutMeInstruction } from "@/features/webllm/utils/aboutMePromptBuilder";
import { ProjectService } from "@/services/ProjectService";
import { ContactInfoService } from "@/services/ContactInfoService";
import { ExperienceService } from "@/services/ExperienceService";
import { TechStackService } from "@/services/TechStackService";

const LS_KEY = "chatWidgetBubbleState_v3";
const HISTORY_KEY = 'chatWidgetHistory_v1';

type StoredState = {
    x: number;
    y: number;
    cw?: number;
    ch?: number;
};

interface ChatFloatingWidgetProps {
    // Keep for compatibility; if provided AND false you can still show bubble by set showBubbleWhenNotReady
    llmReady?: boolean;
    buttonLabel?: string;
    chatWidth?: number;
    chatHeight?: number;
    minChatWidth?: number;
    minChatHeight?: number;
    maxChatWidth?: number;
    maxChatHeight?: number;
    preloadOnMount?: boolean;      // preload model immediately
    showBubbleWhenNotReady?: boolean; // default true
}

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

function estimateTokens(text: string) {
    let t = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        t += c < 128 ? (c >= 65 && c <= 122 ? 0.25 : 0.5) : 1.5;
    }
    return t;
}

const MAX_CONTEXT_TOKENS = 800;

const ChatFloatingWidget: React.FC<ChatFloatingWidgetProps> = ({
    llmReady: _externalReady,
    buttonLabel = "Chat",
    chatWidth = 360,
    chatHeight = 480,
    minChatWidth = 300,
    minChatHeight = 320,
    maxChatWidth = 640,
    maxChatHeight = 760,
    preloadOnMount = false,
    showBubbleWhenNotReady = true
}) => {
    // LLM context
    const { llm, llmReady, status, ensureLLM, progress, setSystemPrompt } = useLLM();
    const db = useClientDB(); // must provide a hook or instance
    const [systemPrompt, setSystemPromptState] = useState<string>('');
    const contextLoadedRef = useRef(false);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [open, setOpen] = useState(false);
    const [panelSize, setPanelSize] = useState({ w: chatWidth, h: chatHeight });
    const initRef = useRef(false);
    const abortRef = useRef<(() => void) | null>(null);

    // Chat state
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [streaming, setStreaming] = useState(false);
    const [hasStartedLLM, setHasStartedLLM] = useState(false);
    const modelBusy = llm?.isBusy() && !streaming;

    const touchStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
    const TOUCH_MOVE_THRESHOLD = 8;

    const [engineStatus, setEngineStatus] = useState<string | null>(() => llm?.statusMessage ?? null);

    // Resize refs
    const resizeRef = useRef<{
        startX: number;
        startY: number;
        startW: number;
        startH: number;
        resizing: boolean;
    } | null>(null);

    // Track first attempt once per session
    const trackFirstAttempt = (source: string) => {
        try {
            const KEY = 'chat_first_attempt_v1';
            if (!sessionStorage.getItem(KEY)) {
                sessionStorage.setItem(KEY, '1');
                gaEvent('chat_first_interaction', {
                    source,
                    timestamp: new Date().toISOString()
                });
            }
        } catch { /* ignore */ }
    };

    // Load saved position + size
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        const bubble = 56;
        const savedRaw = localStorage.getItem(LS_KEY);
        if (savedRaw) {
            try {
                const saved: StoredState = JSON.parse(savedRaw);
                setPosition({
                    x: Math.min(Math.max(saved.x, 8), vpW - bubble - 8),
                    y: Math.min(Math.max(saved.y, 8), vpH - bubble - 8)
                });
                if (saved.cw && saved.ch) {
                    setPanelSize({
                        w: Math.min(Math.max(saved.cw, minChatWidth), maxChatWidth),
                        h: Math.min(Math.max(saved.ch, minChatHeight), maxChatHeight)
                    });
                }
                return;
            } catch { /* ignore */ }
        }
        setPosition({
            x: vpW - bubble - 24,
            y: vpH - bubble - 24
        });
    }, [minChatWidth, minChatHeight, maxChatWidth, maxChatHeight]);


    // subscribe to engine init progress / status
    useEffect(() => {
        if (!llm) return;
        // Seed with current message
        setEngineStatus(llm.statusMessage ?? null);
        const unsub = llm.onProgress((p) => {
            const pct = Math.round((p.progress ?? 0) * 100);
            setEngineStatus(p.text ? `${pct}% — ${p.text}` : `${pct}%`);
        });
        return () => unsub();
    }, [llm]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (raw) {
                const parsed: ChatMessage[] = JSON.parse(raw);
                setMessages(parsed.slice(-100)); // cap
            }
        } catch { /* ignore */ }
    }, []);

    const persistHistory = useCallback((next: ChatMessage[] | ((p: ChatMessage[]) => ChatMessage[])) => {
        setMessages(prev => {
            const updated = typeof next === 'function' ? next(prev) : next;
            localStorage.setItem(HISTORY_KEY,
                JSON.stringify(updated.slice(-200).map(({ role, content, id }) => ({ id, role, content })))
            );
            return updated;
        });
    }, []);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    };

    useEffect(scrollToBottom, [messages, streaming]);

    // Optional preload
    useEffect(() => {
        if (preloadOnMount && !llmReady && !hasStartedLLM) {
            ensureLLM();
            setHasStartedLLM(true);
        }
    }, [preloadOnMount, llmReady, ensureLLM, hasStartedLLM]);

    // Lazy load model when user opens the popover
    useEffect(() => {
        if (open && !llmReady && !hasStartedLLM) {
            ensureLLM();
            setHasStartedLLM(true);
        }
    }, [open, llmReady, ensureLLM, hasStartedLLM]);

    const persist = useCallback((next?: Partial<StoredState>) => {
        const payload: StoredState = {
            x: position.x,
            y: position.y,
            cw: panelSize.w,
            ch: panelSize.h,
            ...next
        };
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
    }, [position, panelSize]);

    // Keep bubble on-screen after window resize
    useEffect(() => {
        function onResize() {
            const vpW = window.innerWidth;
            const vpH = window.innerHeight;
            const bubble = 56;
            setPosition(p => ({
                x: Math.min(p.x, vpW - bubble - 8),
                y: Math.min(p.y, vpH - bubble - 8)
            }));
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Pointer-based resize
    const onResizeStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: panelSize.w,
            startH: panelSize.h,
            resizing: true
        };
        window.addEventListener("pointermove", onResizing);
        window.addEventListener("pointerup", onResizeEnd, { once: true });
    };
    const onResizing = (e: PointerEvent) => {
        if (!resizeRef.current?.resizing) return;
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        let w = resizeRef.current.startW + dx;
        let h = resizeRef.current.startH + dy;
        w = Math.min(Math.max(w, minChatWidth), maxChatWidth);
        h = Math.min(Math.max(h, minChatHeight), maxChatHeight);
        setPanelSize({ w, h });
    };
    const onResizeEnd = () => {
        resizeRef.current = null;
        persist();
        window.removeEventListener("pointermove", onResizing);
    };

    useEffect(() => {
        if (!db || contextLoadedRef.current) return;
        (async () => {
            try {
                const [contact, experiences, techStack, projects] = await Promise.all([
                    ContactInfoService.ensureAndGet(db),
                    ExperienceService.ensureAndGetExperiences(db),
                    TechStackService.ensureAndGetTechStack(db),
                    ProjectService.ensureAndGetProjects(db)
                ]);
                const prompt = buildAboutMeInstruction({
                    contact,
                    experiences,
                    techStack,
                    projects
                });
                setSystemPromptState(prompt);
                // If model already initialized, update it immediately
                if (llmReady) {
                    setSystemPrompt(prompt);
                }
            } catch (e) {
                console.warn('Failed building system prompt:', e);
            } finally {
                contextLoadedRef.current = true;
            }
        })();
    }, [db, llmReady, setSystemPrompt]);

    // When starting LLM for first time, pass prompt if ready
    useEffect(() => {
        if (preloadOnMount && !llmReady && !hasStartedLLM) {
            ensureLLM(systemPrompt || undefined);
            setHasStartedLLM(true);
        }
    }, [preloadOnMount, llmReady, hasStartedLLM, ensureLLM, systemPrompt]);

    useEffect(() => {
        if (open && !llmReady && !hasStartedLLM) {
            ensureLLM(systemPrompt || undefined);
            setHasStartedLLM(true);
        }
    }, [open, llmReady, hasStartedLLM, ensureLLM, systemPrompt]);

    const buildMessages = (userInput: string): { role: "user" | "assistant"; content: string }[] => {
        const base: { role: "user" | "assistant"; content: string }[] = [];
        let acc = 0;
        for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            const cost = estimateTokens(m.content);
            if (acc + cost > MAX_CONTEXT_TOKENS) break;
            base.push(m);
            acc += cost;
        }
        base.reverse();
        return [...base, { role: "user", content: userInput }];
    };

    // Send / stream handler
    const handleSend = async () => {
        if (streaming || !input.trim() || !llm) return;
        const userText = input.trim();
        const uid = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const aid = uid + '-a';

        // Record usage event (no PII)
        try {
            gaEvent('chat_message_sent', {
                input_length: userText.length,
                input_tokens_estimate: estimateTokens(userText),
                conversation_messages: messages.length,
                has_system_prompt: !!systemPrompt,
                timestamp: new Date().toISOString()
            });
        } catch { /* ignore analytics errors */ }

        // Optimistic UI
        persistHistory(prev => [...prev,
        { id: uid, role: 'user', content: userText },
        { id: aid, role: 'assistant', content: '' }
        ]);
        setInput("");

        try {
            if (systemPrompt) llm.setSystemPrompt(systemPrompt);
            setStreaming(true);

            const convoMessages = buildMessages(userText);

            let accum = "";
            const { promise, abort } = llm.getResponseAbortableFromMessages(
                convoMessages,
                true,
                (chunk: string) => {
                    accum += chunk;
                    setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: accum } : m));
                }
            );
            abortRef.current = () => abort();
            await promise;
        } catch (e: any) {

            try {
                gaEvent('chat_message_failed', {
                    error: String(e),
                    input_length: userText.length,
                    conversation_messages: messages.length,
                    timestamp: new Date().toISOString()
                });
            } catch { /* ignore */ }

            setMessages(prev =>
                prev.map(m => m.id === aid ? {
                    ...m,
                    content: e?.name === 'AbortError' ? "(stopped)" : "Error getting response."
                } : m)
            );
        } finally {
            setStreaming(false);
            scrollToBottom();
            persistHistory(prev => prev);
        }
    };

    // Decide whether to render bubble
    const canShowBubble = showBubbleWhenNotReady || llmReady || _externalReady;

    if (!canShowBubble) return null;

    return (
        <div className="fixed inset-0 z-[20] pointer-events-none">
            <Rnd
                bounds="window"
                size={{ width: 56, height: 56 }}
                position={position}
                enableResizing={false}
                dragHandleClassName="chat-drag-anywhere"
                onDragStop={(_, data) => {
                    setPosition({ x: data.x, y: data.y });
                    persist({ x: data.x, y: data.y });
                }}
                className={` pointer-events-auto overflow-visible rounded-[50%] z-[20]`}
            >
                <Popover
                    open={open}
                    onOpenChange={(v) => {
                        setOpen(v);
                        if (v) {
                            // mark first attempt and open event
                            trackFirstAttempt('open');
                            try { gaEvent('chat_open', { timestamp: new Date().toISOString() }); } catch { }
                            window.dispatchEvent(new Event('llm-chat-open'));
                        }
                        if (!v) { persist(); }
                    }}
                >
                    <PopoverTrigger asChild>
                        <div className="relative w-14 h-14">
                            {/* Background ring (subtle) + optional pulsating ring while loading */}
                            {!llmReady && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 56 56" aria-hidden>
                                    <defs>
                                        {/* tiny blur to soften pulse (optional) */}
                                        <filter id="f-soft" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="0.4" result="b" />
                                            <feMerge><feMergeNode in="b" /></feMerge>
                                        </filter>
                                    </defs>
                                    <circle cx="28" cy="28" r="24" strokeWidth="4" stroke="rgba(0,0,0,0.06)" fill="none" />

                                    {/* pulsating ring while model is initializing */}
                                    {hasStartedLLM && !llmReady && (
                                        <circle
                                            cx="28"
                                            cy="28"
                                            r="24"
                                            strokeWidth="4"
                                            stroke={status === "unsupported" ? "rgba(244,63,94,0.45)" : "rgba(16,185,129,0.45)"}
                                            fill="none"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                            filter="url(#f-soft)"
                                        />
                                    )}

                                    {/* progress arc (ensures >=1% when started) */}
                                    <circle
                                        cx="28"
                                        cy="28"
                                        r="24"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        stroke={status === "unsupported" ? "#f43f5e" : "#10b981"}
                                        fill="none"
                                        strokeDasharray={Math.PI * 2 * 24}
                                        strokeDashoffset={String(
                                            Math.PI * 2 * 24 *
                                            (1 - (hasStartedLLM ? Math.max(0.01, (progress ?? 0)) : 0))
                                        )}
                                        transform="rotate(-90 28 28)"
                                        style={{ transition: "stroke-dashoffset 300ms linear, stroke 200ms" }}
                                    />
                                </svg>
                            )}

                            <Button
                                type="button"
                                aria-label="Open chat"
                                className={` ${status === "unsupported" ? "opacity-50 cursor-not-allowed border-2 border-red-400 from-gray-200 to-gray-500  shadow-red-900/30" : "from-emerald-500 to-green-500 shadow-emerald-900/30"} ${!llmReady ? "opacity-70" : ""} w-14 h-14 rounded-full bg-gradient-to-br  flex items-center justify-center text-white font-semibold text-sm active:scale-95 shadow-lg transition select-none cursor-grab chat-drag-anywhere`}
                                onClick={() => {
                                    // Track first attempt from click
                                    trackFirstAttempt('click');

                                    // If model hasn't started loading yet, kick it off on user interaction
                                    if (!llmReady && status !== "unsupported" && !hasStartedLLM) {
                                        ensureLLM();
                                        setHasStartedLLM(true);
                                    }
                                }}
                                onTouchStart={(e) => {
                                    const t = e.touches?.[0];
                                    if (!t) return;
                                    touchStartRef.current = { x: t.clientX, y: t.clientY, moved: false };
                                }}
                                onTouchMove={(e) => {
                                    const t = e.touches?.[0];
                                    const s = touchStartRef.current;
                                    if (!t || !s) return;
                                    const dx = Math.abs(t.clientX - s.x);
                                    const dy = Math.abs(t.clientY - s.y);
                                    if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
                                        s.moved = true;
                                    }
                                }}
                                onTouchEnd={(_e) => {
                                    const s = touchStartRef.current;
                                    touchStartRef.current = null;
                                    if (!s) return;
                                    // treat as a tap only if the finger didn't move much
                                    if (!s.moved && status !== "unsupported") {
                                        // Track first attempt from touch
                                        trackFirstAttempt('touch');

                                        if (!llmReady && !hasStartedLLM) {
                                            ensureLLM();
                                            setHasStartedLLM(true);
                                        }
                                        setOpen(true);
                                    }
                                }}
                                title={buttonLabel}
                            >
                                <SparklesIcon className="" />
                            </Button>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        align="end"
                        sideOffset={14}
                        className={`${!llmReady || streaming || modelBusy ? "cursor-progress" : ""} p-0 z-[21] rounded-xl shadow-2xl border border-border bg-background flex flex-col overflow-hidden`}
                        style={{ width: panelSize.w, height: panelSize.h }}
                    >
                        <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 text-neutral-100 text-sm font-medium">
                            <span>Ask about {personalInfo.name}</span>
                            <div className="flex gap-1">
                                <Button
                                    variant='ghost'
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-3 "
                                >
                                    Close
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Status / Loading */}
                            {status === "unsupported" && (
                                <div className="p-3 text-xs text-red-500">
                                    This device cannot run the local model.
                                </div>
                            )}
                            {status === "error" && (
                                <div className="p-3 text-xs text-red-500">
                                    Failed to load the model.
                                </div>
                            )}
                            {!llmReady && status !== "unsupported" && status !== "error" && (
                                <div className="p-3 text-xs text-neutral-500">
                                    {hasStartedLLM ? `Loading model... ${engineStatus ?? llm?.statusMessage ?? ""}` : "Open to start loading..."}
                                </div>
                            )}

                            {/* Chat area */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                                {messages.length === 0 && (
                                    <div className="text-neutral-500 text-xs">
                                        Start a conversation. Ask something about {personalInfo.name}.
                                    </div>
                                )}
                                {messages.map(m => (
                                    <div
                                        key={m.id}
                                        className={
                                            m.role === 'user'
                                                ? "flex justify-end"
                                                : "flex justify-start"
                                        }
                                    >
                                        <div
                                            className={
                                                `max-w-[80%] rounded-lg px-3 py-2 shadow-sm whitespace-pre-wrap ` +
                                                (m.role === 'user'
                                                    ? "bg-primary text-white select-all"
                                                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50")
                                                + (m.role === 'assistant' && streaming ? "select-none cursor-wait" : "")
                                            }
                                        >
                                            {m.content || (m.role === 'assistant' && streaming ? "…" : "")}
                                        </div>
                                    </div>
                                ))}
                                {streaming && (
                                    <div className="flex justify-start cursor-wait select-none">
                                        <div className="max-w-[80%] rounded-lg px-3 py-2 bg-neutral-200 dark:bg-neutral-700 animate-pulse text-neutral-400 text-xs">
                                            typing…
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!input.trim() || streaming || !llmReady || modelBusy) return;
                                    handleSend();
                                }}
                                className="flex gap-2 p-3 border-t border-border items-end"
                            >
                                <Textarea
                                    id="chat-input"
                                    name="message"
                                    rows={2}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (input.trim() && !streaming && llmReady) {
                                                handleSend();
                                            }
                                        }
                                    }}
                                    disabled={!llmReady || streaming || modelBusy}
                                    placeholder="Ask me something about me... (Enter to send, Shift+Enter for newline)"
                                    className={`flex-1 resize-none rounded-md bg-background px-3 py-2 text-sm ${!llmReady || streaming || modelBusy ? "cursor-wait pointer-events-none" : ""}`}
                                />
                                <div className="flex gap-2 items-center-safe">
                                    {streaming && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                // analytics: user stopped streaming response
                                                try { gaEvent('chat_message_aborted', { timestamp: new Date().toISOString() }); } catch { }

                                                abortRef.current?.();
                                            }}
                                            className="py-4 px-4"
                                        >
                                            Stop
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={!llmReady || streaming || !input.trim() || modelBusy}
                                        className={`py-4 px-6 ${!llmReady || streaming || modelBusy ? "cursor-wait pointer-events-none" : ""}`}
                                    >
                                        {streaming ? "..." : (modelBusy ? "Busy" : "Send")}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Resize handle */}
                        <div
                            onPointerDown={onResizeStart}
                            className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize group"
                        >
                            <div className="absolute inset-0 translate-x-[2px] translate-y-[2px] border-r-2 border-b-2 border-emerald-500/70 group-active:border-emerald-400" />
                        </div>
                    </PopoverContent>
                </Popover>
            </Rnd>
        </div >
    );
};

export default ChatFloatingWidget;