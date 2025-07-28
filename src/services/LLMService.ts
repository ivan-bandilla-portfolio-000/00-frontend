import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { defaultModel } from "@/constants/webLLM"

import { createContext } from "react";

export class LLMService {
    protected engine: any = null;
    protected systemPrompt: string;
    public initialized: boolean = false;

    constructor(systemPrompt: string) {
        this.systemPrompt = systemPrompt;
    }

    setSystemPrompt(prompt: string) {
        this.systemPrompt = prompt;
    }

    getSystemPrompt(): string {
        return this.systemPrompt;
    }

    checkAvailableMemory() {
        const minMemoryGB = 4;
        if (navigator.deviceMemory && navigator.deviceMemory < minMemoryGB) {
            console.warn(`Device has only ${navigator.deviceMemory}GB RAM. WebLLM may not work well.`);
        }
    }

    checkCpuAvailability() {
        const minCpuCores = 4;
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < minCpuCores) {
            console.warn(`Device has only ${navigator.hardwareConcurrency} CPU cores. WebLLM may not work well.`);
        }
    }

    checkRequirements() {
        this.checkAvailableMemory();
        this.checkCpuAvailability();
    }

    async init(model: string = defaultModel.model_id) {
        console.log("Initializing LLMService with model:", model);
        this.checkRequirements();
        try {
            this.engine = await CreateMLCEngine(model);
            this.initialized = true;
            console.log("Model loaded successfully");
        } catch (error) {
            console.warn("Failed to load the model: ", model, error);
        }
    }

    async getResponse(
        userPrompt: string,
        stream: boolean = false,
        onStreamChunk?: (chunk: string) => void
    ): Promise<string> {
        if (!this.engine) throw new Error("Engine not initialized");
        const messages = [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: userPrompt }
        ];

        if (stream) {
            let reply = "";
            const chunks = await this.engine.chat.completions.create({
                messages,
                stream: true,
                stream_options: { include_usage: true },
            });
            for await (const chunk of chunks) {
                const delta = chunk.choices[0]?.delta.content || "";
                reply += delta;
                if (onStreamChunk) onStreamChunk(delta); // callback for each chunk
            }
            return reply;
        } else {
            const reply = await this.engine.chat.completions.create({ messages });
            return reply.choices[0].message.content;
        }
    }
}

export const LLMContext = createContext<LLMService | null>(null);