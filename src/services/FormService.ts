import { Filter } from "bad-words";
import filipinoBadwords from "filipino-badwords-list";
import { checkProfanity } from '@/features/validations/services/profanityService';
import { NonceManager } from '@/features/nonce/client/services/NonceManager';
import { toast } from 'sonner';
import type { ToastPositions } from '@/constants/toastPositions';

const filter = new Filter({ list: filipinoBadwords.array });

export const FormService = {
    isProfane: (text: string) => filter.isProfane(text),
    cleanProfanity: (html: string) => filter.clean(html),
    clearForm: (form: HTMLFormElement, callback?: () => void) => {
        form.reset();
        callback?.();
    },
    showSuccessMessage: (message: string, options?: { position?: ToastPositions }) => {
        setTimeout(() => {
            toast.success(message, {
                position: options?.position || 'bottom-right',
                duration: 5000,
            });
        }, 300);
    },
    async useNonce(nonce: string) {
        await NonceManager.use(nonce);
    },
    async checkProfanityAsync(html: string) {
        try {
            const { censored: result, isProfane } = await checkProfanity(html);
            return { censored: result, isProfane };
        } catch (e) {
            console.error("Error checking profanity:", e);
            return { censored: html, isProfane: false };
        }
    },
};