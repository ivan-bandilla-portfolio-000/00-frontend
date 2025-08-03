import { getRequestStatusById } from "@/constants/requestStatuses";
import { RateLimiter } from "@/features/rate-limiting/client/services/RateLimiter";
import { useCallback, type RefObject } from "react";

export interface MessageInputs {
    email: string;
    emailContent: string;
}

// Define the expected editor API (Tiptap)
interface TiptapEditor {
    getText?: () => string;
    getHTML?: () => string;
    commands?: {
        clearContent?: () => void;
    };
}

// Define the props for the hook
interface UseContactFormSubmissionProps {
    formService: {
        isProfane: (input: string) => boolean;
        cleanProfanity: (input: string) => string;
        useNonce: (nonce: string) => Promise<void>;
        showSuccessMessage: (msg: string) => void;
        clearForm: (form: HTMLFormElement) => void;
    };
    nonceManager: {
        create: () => Promise<string>;
    };
    setNonce: (nonce: string | null) => void;
    setStatus: (status: any) => void;
    callbacks?: {
        onSubmitting?: () => void;
        onStop?: () => void;
    };
    formRef: RefObject<HTMLFormElement>;
    editorRef: RefObject<TiptapEditor>;
    setError: (name: keyof MessageInputs, error: { type: string; message: string }) => void;
    clearErrors: (name: keyof MessageInputs) => void;
    CHARACTER_LIMIT: number;
    MIN_LENGTH: number;
}

export function useContactFormSubmission({
    formService,
    nonceManager,
    setNonce,
    setStatus,
    callbacks,
    formRef,
    editorRef,
    setError,
    clearErrors,
    CHARACTER_LIMIT,
    MIN_LENGTH,
}: UseContactFormSubmissionProps) {
    return useCallback(async (data, nonce: string | null) => {
        await RateLimiter.throwIfLimited('contact-form', 3, 60000);
        const editor = editorRef.current;
        const content = editor?.getText?.() || "";

        if (formService.isProfane(data.email)) {
            setError("email", { type: "manual", message: "Profanity detected in your email address." });
            return;
        }

        // const isValidEmail = await verifyEmail(data.email);
        // if (!isValidEmail) {
        //     setError("email", { type: "manual", message: "Invalid or disposable email address." });
        //     return;
        // }

        if (!content || content.trim().length < MIN_LENGTH) {
            setError("emailContent", { type: "manual", message: "Message is empty or too short" });
            return;
        }

        if (content.length > CHARACTER_LIMIT) {
            setError("emailContent", { type: "manual", message: `Message cannot exceed ${CHARACTER_LIMIT} characters` });
            return;
        }

        clearErrors("emailContent");

        setStatus(getRequestStatusById("filtering_profanity")!);
        let originalContent = editor?.getHTML();
        let censoredContent = formService.cleanProfanity(originalContent);

        // const { censored: checkedContent } = await formService.checkProfanityAsync(censoredContent);
        // censoredContent = checkedContent;

        callbacks?.onSubmitting();

        let formObj: any = {
            email: data.email,
            content: censoredContent,
            clientNonce: nonce,
        };

        if (originalContent !== censoredContent) {
            formObj.originalContent = originalContent;
        }

        if (nonce) {
            await formService.useNonce(nonce);
            setNonce(null);

            console.log("Form Data:", formObj);

            setStatus(getRequestStatusById("processing")!);

            // TODO: Insert the REST API call here
            const response = {
                status: true,
                // TODO: replace with message from server
                message: "Your message was sent successfully!"
            }

            setStatus(getRequestStatusById("ready")!);

            callbacks?.onStop();

            sessionStorage.setItem("contactFormEmail", data.email);

            formService.showSuccessMessage(response.message);

            formService.clearForm(formRef?.current as HTMLFormElement);

            editor?.commands?.clearContent();

            nonceManager.create().then(setNonce);
            console.log("Form submitted successfully:", response);
        }
    }, [formService, nonceManager, setNonce, setStatus, callbacks, formRef, editorRef, setError, clearErrors, CHARACTER_LIMIT, MIN_LENGTH]);
}