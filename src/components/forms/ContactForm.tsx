import React, { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TextEditor from '@/components/text-editor'
import { useForm } from "react-hook-form";
import { getRequestStatusById, REQUEST_STATUSES } from '@/constants/requestStatuses'

// @ts-ignore
import { Filter } from "bad-words";
import filipinoBadwords from "filipino-badwords-list";
import { checkProfanity } from '@/services/profanityService';
import { validateEmail as validateEmailPrimary } from '@/services/emailValidationServicePrimary';
import { validateEmail as validateEmailSecondary } from '@/services/emailValidationServiceSecondary';
import { verifyEmail } from '@/services/emailValidationService';


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

const filter = new Filter({ list: filipinoBadwords.array });

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



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
    const { register, handleSubmit, setError, clearErrors, formState: { errors: formErrors } } = useForm<MessageInputs>({
        defaultValues: {
            email: ""
        }
    });

    const editorRef = useRef<any>(null)

    const onValid = async (data: MessageInputs) => {
        const editor = editorRef.current;
        const content = editor?.getText?.() || "";

        if (filter.isProfane(data.email)) {
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
        let censoredContent = filter.clean(originalContent);

        try {
            const { censored: result, isProfane } = await checkProfanity(censoredContent);
            censoredContent = result;
        } catch (e) {
            console.error("Error checking profanity:", e);
        }

        if (callbacks?.onSubmitting) callbacks.onSubmitting();

        let formObj: any = {
            email: data.email,
            content: censoredContent,
        };

        if (originalContent !== censoredContent) {
            formObj.originalContent = originalContent;
        }

        console.log("Form Data:", formObj);

        setStatus(getRequestStatusById("processing")!);

        setStatus(getRequestStatusById("ready")!);
        if (callbacks?.onStop) callbacks.onStop();

    }

    return (
        <form ref={formRef} id='contact-form' className='space-y-8' onSubmit={(e) => {
            clearErrors("emailContent");
            handleSubmit(onValid)(e);
            setStatus(getRequestStatusById("ready")!);
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