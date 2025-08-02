import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TextEditor from '@/features/text-editor/components'
import { useForm } from "react-hook-form";
import { getRequestStatusById } from '@/constants/requestStatuses'

// @ts-ignore
import { Filter } from "bad-words";
import { RateLimiter } from '@/features/rate-limiting/client/services/RateLimiter';
import { NonceManager } from '@/features/nonce/client/services/NonceManager';
import { FormService } from '@/services/FormService';


type MessageInputs = {
    email: string,
    emailContent: string,
};

const validationSchema = {
    email: {
        required: "Email is required",
        pattern: {
            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: "Invalid email address"
        },
        maxLength: {
            value: 255,
            message: "Email cannot exceed 255 characters"
        }
    }
}

const CHARACTER_LIMIT = 1000;
const MIN_LENGTH = 5;

type ContactFormProps = {
    formRef?: React.RefObject<HTMLFormElement>;
    callbacks?: {
        onSubmitting?: () => void;
        onStop?: () => void;
    };
    status: RequestStatus;
    setStatus: React.Dispatch<React.SetStateAction<RequestStatus>>;
};

const ContactForm = ({
    formRef,
    callbacks,
    status,
    setStatus,
}: ContactFormProps) => {
    const [nonce, setNonce] = useState<string | null>(null);

    useEffect(() => {
        NonceManager.create().then(setNonce);
    }, []);

    const { register, handleSubmit, setError, clearErrors, formState: { errors: formErrors } } = useForm<MessageInputs>({
        defaultValues: {
            email: sessionStorage.getItem("contactFormEmail") || ""
        }
    });

    const editorRef = useRef<any>(null)

    const onValid = async (data: MessageInputs) => {
        await RateLimiter.throwIfLimited('contact-form', 3, 60000);
        const editor = editorRef.current;
        const content = editor?.getText?.() || "";

        if (FormService.isProfane(data.email)) {
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
        let censoredContent = FormService.cleanProfanity(originalContent);

        // const { censored: checkedContent } = await FormService.checkProfanityAsync(censoredContent);
        // censoredContent = checkedContent;

        if (callbacks?.onSubmitting) callbacks.onSubmitting();

        let formObj: any = {
            email: data.email,
            content: censoredContent,
            clientNonce: nonce,
        };

        if (originalContent !== censoredContent) {
            formObj.originalContent = originalContent;
        }

        if (nonce) {
            await FormService.useNonce(nonce);
            setNonce(null);

            console.log("Form Data:", formObj);

            setStatus(getRequestStatusById("processing")!);

            // Insert the REST API call here

            setStatus(getRequestStatusById("ready")!);
            if (callbacks?.onStop) callbacks.onStop();

            sessionStorage.setItem("contactFormEmail", data.email);

            FormService.clearForm(formRef?.current as HTMLFormElement, () => {
                editor?.setContent?.("");
                window.location.reload();
            });
        }

        // Termination of the form submission
        // Resets the form state

    }

    return (
        <form ref={formRef} id='contact-form' className='space-y-8' onSubmit={async (e) => {
            clearErrors("emailContent");
            handleSubmit(onValid)(e);
        }}>
            <div className='space-y-1'>
                <Label htmlFor="sender-email">Your email address</Label>
                <Input
                    type="text"
                    id='sender-email'
                    autoComplete='email'
                    autoCapitalize='off'
                    autoFocus={true}
                    placeholder="Email"
                    {...register("email", validationSchema.email)}
                />
                <span>{formErrors.email && <span>{formErrors.email.message}</span>}</span>
            </div>
            <TextEditor
                editorRef={editorRef}
                opt={{
                    characterLimit: CHARACTER_LIMIT,
                    content: "",
                    error: formErrors.emailContent,
                    classNames: "min-h-[16rem] max-h-[30cqh] 2xl:max-h-dvh",
                }}
            />
        </form>
    )
}

export default ContactForm