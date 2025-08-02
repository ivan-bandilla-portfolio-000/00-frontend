import { useContext, useState } from "react";
import { LLMContext } from "@/services/LLMService";

const AboutMeChatLLM = () => {
    const llm = useContext(LLMContext);
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [sending, setSending] = useState(false);

    if (!llm || !llm.initialized) {
        return <div className="p-4 text-gray-500 hidden">Large Language Model is loading...</div>;
    }

    const handleSend = async () => {
        if (sending) return;
        setSending(true);
        setResponse("...");
        let streamedResponse = "";
        await llm.getResponse(
            input,
            true, // stream enabled
            (chunk) => {
                streamedResponse += chunk;
                setResponse(streamedResponse);
            }
        );
        setSending(false);
    };

    return (
        <div>
            <textarea className="border p-2 rounded" value={input} onChange={e => setInput(e.target.value)} disabled={sending} />
            <button className="bg-blue-500 text-white p-2 rounded" onClick={handleSend} disabled={sending}>
                {sending ? "Sending..." : "Send"}
            </button>
            <div className="mt-4 p-2 border rounded">{response}</div>
        </div>
    );
};

export default AboutMeChatLLM;