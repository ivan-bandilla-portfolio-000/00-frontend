import { useContext, useEffect, useState, useRef } from 'react';
import { LLMContext } from '@/features/webllm/services/LLMService';
import { choosePortfolioContextInstruction } from '@/features/webllm/constants/webLLM';

const initialMessages = [
    "Waking up my circuits... \nFeel free to explore the portfolio while I get ready!",
    "Just a moment, getting ready... \nYou can start exploring the portfolio!"
];

const defaultMessage = "Are you working as an IT professional?";

export const useLLMBubble = () => {
    const llm = useContext(LLMContext);
    const [bubbleText, setBubbleText] = useState("Hello");
    const [showButtons, setShowButtons] = useState(false);
    const isFetching = useRef(false); // <-- add this

    useEffect(() => {
        if (llm && llm.requirementsMet) {
            const timeout = setTimeout(() => {
                setBubbleText(() => initialMessages[Math.floor(Math.random() * initialMessages.length)]);
            }, 4000);
            return () => clearTimeout(timeout);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        // If requirements are not met, show a static message and skip LLM fetch
        if (llm && llm.requirementsMet === false) {
            setBubbleText(defaultMessage);
            setShowButtons(true);
            return;
        }

        const fetchLLM = async (attempt = 0) => {
            if (isFetching.current) return;
            if (!llm || !llm.initialized || !llm.getEngine()) return;
            isFetching.current = true;
            try {
                llm.setSystemPrompt(choosePortfolioContextInstruction);
                const result = await llm.getResponse("");
                if (!cancelled) {
                    setBubbleText(result.trim());
                    setShowButtons(true);
                }
            } catch (e) {
                if (attempt < 2) {
                    setTimeout(() => fetchLLM(attempt + 1), 300);
                } else {
                    console.error("Error fetching LLM response:", e);
                    setBubbleText(defaultMessage);
                    setShowButtons(true);
                }
            } finally {
                isFetching.current = false;
            }
        };
        fetchLLM();
        return () => { cancelled = true; };
    }, [llm, llm?.initialized, llm?.getEngine?.()]);

    return { bubbleText, showButtons };
};