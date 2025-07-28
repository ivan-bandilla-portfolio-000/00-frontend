import { LLMService } from "./LLMService";

export class ChatLLMService extends LLMService {
    constructor(systemPrompt: string) {
        super(systemPrompt);
    }

    async getResponse(userInput: string): Promise<string> {
        if (!this.chat) return "";
        await this.chat.resetChat();
        let output = "";
        await this.chat.generate(
            `${this.systemPrompt}\n${userInput}`,
            (step) => {
                output = step.output;
            }
        );
        return output;
    }
}