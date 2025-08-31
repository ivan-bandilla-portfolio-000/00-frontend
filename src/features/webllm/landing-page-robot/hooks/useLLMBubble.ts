import { useEffect, useState, useRef } from 'react';
import { useLLM } from '@/contexts/LLMContext';
import { choosePortfolioContextInstruction } from '@/features/webllm/constants/webLLM';

const initialMessages = [
    "Waking up my circuits... \nFeel free to explore the portfolio while I get ready!",
    "Just a moment, getting ready... \nYou can start exploring the portfolio!"
];

const defaultMessage = "Are you working as an IT professional?";

const CACHE_KEY = 'webllm_bubble_message_v1';

// ---- Module-scope in-memory cache (survives component unmount within same tab) ----
let inMemoryBubbleMessage: string | null = null;
let generationPromise: Promise<string> | null = null;

// Try to hydrate in-memory cache from localStorage once (module evaluation time)
(function hydrateFromLocalStorageOnce() {
    if (typeof window === 'undefined') return;
    try {
        if (!inMemoryBubbleMessage) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) inMemoryBubbleMessage = cached;
        }
    } catch {
        /* ignore */
    }
})();

export const useLLMBubble = () => {
    const { llm, ensureLLM, status } = useLLM();

    const [bubbleText, setBubbleText] = useState<string>(() => inMemoryBubbleMessage || "");
    const [showButtons, setShowButtons] = useState<boolean>(() => !!inMemoryBubbleMessage);
    const responseArrived = useRef<boolean>(!!inMemoryBubbleMessage);
    const startedRef = useRef(false);
    const abortRef = useRef<(() => void) | null>(null);

    // Placeholder while loading (only if we DON'T already have a cached message)
    useEffect(() => {
        if (responseArrived.current || inMemoryBubbleMessage) return;
        const t = setTimeout(() => {
            setBubbleText(
                initialMessages[Math.floor(Math.random() * initialMessages.length)]
            );
        }, 400);
        return () => clearTimeout(t);
    }, []);

    // Listen for first-user-interaction (or idle fallback event) to kick off initialization & generation
    useEffect(() => {
        if (inMemoryBubbleMessage) return; // already have it
        function trigger() {
            if (startedRef.current) return;
            startedRef.current = true;
            // Start model init lazily
            if (status === 'idle') {
                ensureLLM().catch(console.error);
            } else if (status === 'error' || status === 'unsupported') {
                // No model => use default
                finalizeAndCache(defaultMessage);
            }
        }
        window.addEventListener('first-user-interaction', trigger);
        // Safety fallback after 12s if event never fires (optional)
        const fallback = setTimeout(trigger, 12000);
        return () => {
            window.removeEventListener('first-user-interaction', trigger);
            clearTimeout(fallback);
        };
    }, [ensureLLM, status]);

    // Once model actually ready, generate (only once globally)
    useEffect(() => {
        if (inMemoryBubbleMessage || responseArrived.current) return;
        if (!llm || !llm.requirementsMet) return;
        if (status !== 'ready') return;
        // Already generating elsewhere?
        if (generationPromise) {
            generationPromise.then(msg => {
                if (!responseArrived.current) {
                    responseArrived.current = true;
                    setBubbleText(msg);
                    setShowButtons(true);
                }
            });
            return;
        }

        generationPromise = (async () => {
            try {
                llm.setSystemPrompt(choosePortfolioContextInstruction);
                const { promise, abort } = llm.getResponseAbortable(
                    "",
                    false,
                    undefined,
                    { max_tokens: 40, temperature: 0.0, top_p: 1.0, stop: ["\n"] }
                );
                abortRef.current = abort;
                const result = await promise;
                const finalText = (result || "").trim() || defaultMessage;
                finalizeAndCache(finalText);
                return finalText;
            } catch (e: any) {
                if (e?.name === 'AbortError') {
                    // Keep silent; do not cache aborted attempt
                    throw e;
                }
                // Fallback
                finalizeAndCache(defaultMessage);
                return defaultMessage;
            } finally {
                // Allow GC after resolution
                setTimeout(() => { generationPromise = null; }, 0);
            }
        })();

        generationPromise.catch(() => { /* swallow; already handled */ });

    }, [llm, status]);

    // Abort generation if user opens full chat (keep original behavior)
    useEffect(() => {
        function onChatOpen() {
            abortRef.current?.();
        }
        window.addEventListener('llm-chat-open', onChatOpen);
        return () => window.removeEventListener('llm-chat-open', onChatOpen);
    }, []);

    function finalizeAndCache(text: string) {
        if (responseArrived.current) return;
        responseArrived.current = true;
        inMemoryBubbleMessage = text;
        setBubbleText(text);
        setShowButtons(true);
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(CACHE_KEY, text);
            }
        } catch {
            /* ignore storage write errors */
        }
    }

    return { bubbleText, showButtons };
};