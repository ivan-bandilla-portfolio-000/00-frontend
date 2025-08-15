import { useEffect, useState, useRef } from 'react';
import { useLLM } from '@/contexts/LLMContext';
import { choosePortfolioContextInstruction } from '@/features/webllm/constants/webLLM';

const initialMessages = [
    "Waking up my circuits... \nFeel free to explore the portfolio while I get ready!",
    "Just a moment, getting ready... \nYou can start exploring the portfolio!"
];

const defaultMessage = "Are you working as an IT professional?";

export const useLLMBubble = () => {
    const { llm, ensureLLM, status, progress } = useLLM();
    const [bubbleText, setBubbleText] = useState("Hello");
    const [showButtons, setShowButtons] = useState(false);
    const isFetching = useRef(false);
    const responseArrived = useRef(false);
    const abortRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // if (status === 'loading') {
        console.log(`Loading model ${(progress * 100).toFixed(0)}% ...`);
        // }
    }, [status, progress]);

    useEffect(() => {
        if (status === 'idle') {
            const t = setTimeout(() => { ensureLLM(); }, 200);
            return () => clearTimeout(t);
        }
    }, [status, ensureLLM]);

    useEffect(() => {
        if (llm && llm.requirementsMet && !responseArrived.current) {
            const timeout = setTimeout(() => {
                setBubbleText(
                    initialMessages[Math.floor(Math.random() * initialMessages.length)]
                );
            }, 400);
            return () => clearTimeout(timeout);
        }
    }, [llm?.requirementsMet]);

    useEffect(() => {
        if (llm && llm.requirementsMet === false) {
            setBubbleText(defaultMessage);
            setShowButtons(true);
        }
    }, [llm]);

    // IMPORTANT: remove getEngine() check (worker mode keeps engine in worker)
    useEffect(() => {
        let cancelled = false;

        const canQuery = llm && llm.requirementsMet && status === 'ready' && !responseArrived.current;

        if (!canQuery) return;

        const fetchLLM = async (attempt = 0) => {
            if (isFetching.current) return;
            isFetching.current = true;
            try {
                llm.setSystemPrompt(choosePortfolioContextInstruction);
                const { promise, abort } = llm.getResponseAbortable(
                    "",
                    false,
                    undefined,
                    { max_tokens: 40, temperature: 0.7 }
                );
                abortRef.current = abort;
                const result = await promise;
                if (!cancelled) {
                    responseArrived.current = true;
                    setBubbleText((result || "").trim() || defaultMessage);
                    setShowButtons(true);
                }
            } catch (e: any) {
                if (!cancelled) {
                    if (e?.name === 'AbortError') {
                        // silent on abort
                    } else if (attempt < 2) {
                        setTimeout(() => fetchLLM(attempt + 1), 500);
                    } else {
                        responseArrived.current = true;
                        setBubbleText(defaultMessage);
                        setShowButtons(true);
                        console.error("LLM response failed:", e);
                    }
                }
            } finally {
                isFetching.current = false;
            }
        };

        fetchLLM();
        return () => {
            cancelled = true;
            abortRef.current?.();
        };
    }, [llm?.initialized, llm?.requirementsMet]);

    useEffect(() => {
        function onChatOpen() {
            abortRef.current?.();
        }
        window.addEventListener('llm-chat-open', onChatOpen);
        return () => window.removeEventListener('llm-chat-open', onChatOpen);
    }, []);

    return { bubbleText, showButtons };
};