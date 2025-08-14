import { useEffect, useState } from "react";
import { useLLM } from "@/contexts/LLMContext";
import { aboutMeInstruction } from "@/features/webllm/constants/webLLM";

const AboutMeChatLLM = () => {
    const { llm, llmReady, status, ensureLLM } = useLLM();
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        ensureLLM();
    }, [ensureLLM]);

    if (status === 'unsupported') {
        return <div className="p-4 text-red-500">This device cannot run the local model.</div>;
    }

    if (status === 'error') {
        return <div className="p-4 text-red-500">Failed to load the model.</div>;
    }

    if (!llmReady || !llm) {
        return <div className="p-4 text-gray-500">Large Language Model is loading...</div>;
    }

    const handleSend = async () => {
        if (sending || !llmReady || !llm || !input.trim()) return;
        llm.setSystemPrompt(aboutMeInstruction);
        setSending(true);
        setResponse("...");
        let streamedResponse = "";
        try {
            await llm.getResponse(
                input,
                true,
                (chunk: string) => {
                    streamedResponse += chunk;
                    setResponse(streamedResponse);
                }
            );
        } catch (e) {
            setResponse("Error getting response.");
            console.warn(e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-2">
            <textarea
                className="border p-2 rounded w-full"
                rows={4}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                placeholder="Ask me something about me..."
            />
            <button
                className="bg-blue-500 disabled:bg-blue-300 text-white px-4 py-2 rounded"
                onClick={handleSend}
                disabled={sending || !input.trim()}
            >
                {sending ? "Sending..." : "Send"}
            </button>
            <div className="mt-2 p-2 border rounded whitespace-pre-wrap min-h-12">
                {response}
            </div>
        </div>
    );
};

export default AboutMeChatLLM;