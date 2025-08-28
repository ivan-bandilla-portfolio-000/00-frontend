import { getRequestStatusById } from "@/constants/requestStatuses";
import { event as gaEvent } from "@/features/analytics";
import useRecaptcha from "@/features/captcha/hooks/Captcha";
import { RateLimiter } from "@/features/rate-limiting/client/services/RateLimiter";
import { ContactFormService } from "@/services/ContactFormService";
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
    // Add these new props
    isEditorReady: boolean;
    fallbackContent: string;
    setFallbackContent: (content: string) => void;
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
    isEditorReady,
    fallbackContent,
    setFallbackContent,
}: UseContactFormSubmissionProps) {
    const siteKey = (import.meta.env as any).VITE_RECAPTCHA_SITE_KEY || (import.meta.env as any).RECAPTCHA_SITE_KEY;
    const { execute, ready: _ready } = useRecaptcha(siteKey);

    return useCallback(async (data: MessageInputs, nonce: string | null) => {
        try {
            await RateLimiter.throwIfLimited('contact-form', 3, 60000);

            // Get content from either editor or fallback textarea
            const getMessageContent = () => {
                if (isEditorReady && editorRef.current?.getText) {
                    return editorRef.current.getText();
                }
                // Use fallback content if editor isn't ready
                return fallbackContent;
            };

            const content = getMessageContent() || "";

            if (formService.isProfane(data.email)) {
                setError("email", { type: "manual", message: "Profanity detected in your email address." });
                return;
            }

            if (!content || content.trim().length < MIN_LENGTH) {
                setError("emailContent", { type: "manual", message: `Message must be at least ${MIN_LENGTH} characters long.` });
                return;
            }

            if (content.length > CHARACTER_LIMIT) {
                setError("emailContent", { type: "manual", message: `Message cannot exceed ${CHARACTER_LIMIT} characters` });
                return;
            }

            clearErrors("emailContent");
            callbacks?.onSubmitting?.();

            setStatus(getRequestStatusById("filtering_profanity")!);

            // Get HTML content for submission
            let originalContent: string;
            if (isEditorReady && editorRef.current?.getHTML) {
                originalContent = editorRef.current.getHTML();
            } else {
                // Convert plain text to basic HTML for fallback
                originalContent = `<p>${fallbackContent.replace(/\n/g, '</p><p>')}</p>`;
            }

            let censoredContent = formService.cleanProfanity(originalContent);

            // Clear the appropriate input
            if (isEditorReady) {
                editorRef.current?.commands?.clearContent?.();
            } else {
                setFallbackContent("");
            }

            let formObj: any = {
                from: data.email,
                body: censoredContent,
                clientNonce: nonce,
            };

            if (originalContent !== censoredContent) {
                formObj.originalContent = originalContent;
            }

            if (siteKey && execute) {
                try {
                    const token = await execute('contact_submit');
                    if (!token) {
                        setError("emailContent", { type: "manual", message: "reCAPTCHA verification failed. Please try again." });
                        callbacks?.onStop?.();
                        setStatus(getRequestStatusById("ready")!);
                        return;
                    }
                    formObj.recaptchaToken = token;
                } catch (err) {
                    console.error("reCAPTCHA execute error:", err);
                    setError("emailContent", { type: "manual", message: "reCAPTCHA failed. Please try again." });
                    callbacks?.onStop?.();
                    setStatus(getRequestStatusById("ready")!);
                    return;
                }
            }

            if (nonce) {
                await formService.useNonce(nonce);
                setNonce(null);

                setStatus(getRequestStatusById("processing")!);

                const contactFormReq = new ContactFormService()
                const response = await contactFormReq.sendEmail(formObj);
                const resData = response.data as { message: string };

                setStatus(getRequestStatusById("ready")!);
                callbacks?.onStop?.();

                sessionStorage.setItem("contactFormEmail", data.email);
                formService.showSuccessMessage(resData.message);
                formService.clearForm(formRef?.current as HTMLFormElement);

                gaEvent('contact_form_submission', {
                    success: true,
                    content_length: censoredContent.length,
                    censored: originalContent !== censoredContent,
                    recaptcha: !!formObj.recaptchaToken,
                });

                // Clear content appropriately
                if (isEditorReady) {
                    editorRef.current?.commands?.clearContent?.();
                } else {
                    setFallbackContent("");
                }

                nonceManager.create().then(setNonce);
            }
        } catch (error) {
            console.error("Error submitting contact form:", error);
        } finally {
            setStatus(getRequestStatusById("ready")!);
            callbacks?.onStop?.();
        }
    }, [
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
        isEditorReady,
        fallbackContent,
        setFallbackContent,
        execute,
        siteKey
    ]);
}