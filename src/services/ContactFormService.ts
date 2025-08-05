
import { BackendService } from "@/services/BackendService";

export class ContactFormService extends BackendService {

    async sendEmail(data: { from: string; body: string; subject?: string }) {
        data.subject = "Portfolio Contact Form";

        const response = await ContactFormService.post(`${this.API_BASE}/send-email`, data);

        return response;
    }
}