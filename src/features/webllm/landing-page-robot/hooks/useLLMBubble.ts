import { useEffect, useState, useRef } from 'react';
import { useLLM } from '@/contexts/LLMContext';
import { choosePortfolioContextInstruction } from '@/features/webllm/constants/webLLM';

const initialMessages = [
    "Waking up my circuits... \nFeel free to explore the portfolio while I get ready!",
    "Just a moment, getting ready... \nYou can start exploring the portfolio!"
];

const defaultMessage = "Are you working as an IT professional?";

export const useLLMBubble = () => {
    const { llm, ensureLLM, status } = useLLM();
    const [bubbleText, setBubbleText] = useState("Hello");
    const [showButtons, setShowButtons] = useState(false);
    const isFetching = useRef(false);
    const responseArrived = useRef(false);

    // Kick off LLM loading if still idle (component became relevant)
    useEffect(() => {
        if (status === 'idle') {
            // slight delay lets first paint finish
            const t = setTimeout(() => { ensureLLM(); }, 200);
            return () => clearTimeout(t);
        }
    }, [status, ensureLLM]);

    // Show an initial rotating wake-up message only if device supports LLM
    useEffect(() => {
        if (llm && llm.requirementsMet && !responseArrived.current) {
            const timeout = setTimeout(() => {
                setBubbleText(
                    initialMessages[Math.floor(Math.random() * initialMessages.length)]
                );
            }, 400); // small delay so "Hello" flashes briefly
            return () => clearTimeout(timeout);
        }
    }, [llm?.requirementsMet]);

    // If requirements NOT met -> static fallback & buttons
    useEffect(() => {
        if (llm && llm.requirementsMet === false) {
            setBubbleText(defaultMessage);
            setShowButtons(true);
        }
    }, [llm]);

    // Fetch first LLM response once engine initialized
    useEffect(() => {
        let cancelled = false;

        const canQuery =
            llm &&
            llm.requirementsMet &&
            llm.initialized &&
            typeof llm.getEngine === 'function' &&
            llm.getEngine();

        if (!canQuery || responseArrived.current) return;

        const fetchLLM = async (attempt = 0) => {
            if (isFetching.current) return;
            isFetching.current = true;
            try {
                llm.setSystemPrompt(choosePortfolioContextInstruction);
                const result = await llm.getResponse("");
                if (!cancelled) {
                    responseArrived.current = true;
                    setBubbleText(result.trim() || defaultMessage);
                    setShowButtons(true);
                }
            } catch (e) {
                if (!cancelled) {
                    if (attempt < 2) {
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
        return () => { cancelled = true; };
    }, [llm?.initialized, llm?.requirementsMet]);

    return { bubbleText, showButtons };
};