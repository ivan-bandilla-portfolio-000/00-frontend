import React, { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLLM } from "@/contexts/LLMContext";
import { aboutMeInstruction } from "@/features/webllm/constants/webLLM";
import personalInfo from "@/constants/personalInfo";

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
    const { llm, llmReady, status, ensureLLM } = useLLM();

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [open, setOpen] = useState(false);
    const [panelSize, setPanelSize] = useState({ w: chatWidth, h: chatHeight });
    const initRef = useRef(false);

    // Chat state
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [streaming, setStreaming] = useState(false);
    const [hasStartedLLM, setHasStartedLLM] = useState(false);

    // Resize refs
    const resizeRef = useRef<{
        startX: number;
        startY: number;
        startW: number;
        startH: number;
        resizing: boolean;
    } | null>(null);

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
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated.slice(-200)));
            return updated;
        });
    }, []);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    };

    useEffect(scrollToBottom, [messages, streaming]);

    const buildPrompt = (userInput: string) => {
        // For small context: include last 4 turns (user+assistant)
        const recent = messages.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`).join('\n');
        return recent ? `${recent}\nUser: ${userInput}` : userInput;
    };

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

    // Send / stream handler
    const handleSend = async () => {
        if (streaming || !input.trim() || !llm) return;
        const userText = input.trim();
        const uid = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const aid = uid + '-a';

        persistHistory(prev => [...prev, { id: uid, role: 'user', content: userText }, { id: aid, role: 'assistant', content: '' }]);
        setInput("");
        setResponse(""); // legacy
        try {
            llm.setSystemPrompt(aboutMeInstruction);
            setStreaming(true);
            let accum = "";
            const prompt = buildPrompt(userText);
            await llm.getResponse(
                prompt,
                true,
                (chunk: string) => {
                    accum += chunk;
                    setResponse(accum); // legacy
                    setMessages(prev =>
                        prev.map(m => m.id === aid ? { ...m, content: accum } : m)
                    );
                }
            );
        } catch (e) {
            setMessages(prev =>
                prev.map(m => m.id === aid ? { ...m, content: "Error getting response." } : m)
            );
            // eslint-disable-next-line no-console
            console.warn(e);
        } finally {
            setStreaming(false);
            scrollToBottom();
            persistHistory(prev => prev); // re-save final
        }
    };

    // Decide whether to render bubble
    const canShowBubble = showBubbleWhenNotReady || llmReady || _externalReady;

    if (!canShowBubble) return null;

    return (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
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
                className="pointer-events-auto overflow-visible rounded-[50%] z-[10000]"
            >
                <Popover
                    open={open}
                    onOpenChange={(v) => {
                        setOpen(v);
                        if (!v) {
                            persist();
                        }
                    }}
                >
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label="Open chat"
                            className="chat-drag-anywhere w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-900/30 flex items-center justify-center text-white font-semibold text-sm active:scale-95 transition select-none cursor-grab"
                        >
                            {buttonLabel}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        align="end"
                        sideOffset={14}
                        className="p-0 z-[10001] rounded-xl shadow-2xl border border-border bg-background flex flex-col overflow-hidden"
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
                                    {hasStartedLLM ? "Loading model..." : "Open to start loading..."}
                                </div>
                            )}

                            {/* Chat area */}
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
                                                "max-w-[80%] rounded-lg px-3 py-2 shadow-sm whitespace-pre-wrap " +
                                                (m.role === 'user'
                                                    ? "bg-primary text-white"
                                                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50")
                                            }
                                        >
                                            {m.content || (m.role === 'assistant' && streaming ? "…" : "")}
                                        </div>
                                    </div>
                                ))}
                                {streaming && (
                                    <div className="flex justify-start">
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
                                    if (!input.trim() || streaming || !llmReady) return;
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
                                    disabled={!llmReady || streaming}
                                    placeholder="Ask me something about me... (Enter to send, Shift+Enter for newline)"
                                    className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                />
                                <div className="flex gap-2 items-center-safe">
                                    {streaming && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                // Optional: implement abort logic if llm.getResponse returns a cancel/abort.
                                                // abortRef.current?.();
                                            }}
                                            className="py-4 px-4"
                                        >
                                            Stop
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={!llmReady || streaming || !input.trim()}
                                        className="py-4 px-6"
                                    >
                                        {streaming ? "..." : "Send"}
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