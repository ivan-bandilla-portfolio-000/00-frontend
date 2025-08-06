import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TextEditor from '@/features/text-editor/components'
import { getRequestStatusById, type RequestStatus } from '@/constants/requestStatuses'

// @ts-ignore
import { Filter } from "bad-words";
import { NonceManager } from '@/features/nonce/client/services/NonceManager';
import { FormService } from '@/services/FormService';
import { useContactFormValidation } from './hooks/useContactFormValidation'
import { useContactFormSubmission, type MessageInputs } from './hooks/useContactFormSubmission'
import { emailRule } from "@/features/validations/constants/emailRule";

const CHARACTER_LIMIT = 1000;
const MIN_LENGTH = 5;

type ContactFormProps = {
    formRef: React.RefObject<HTMLFormElement>;
    callbacks?: {
        onSubmitting?: () => void;
        onStop?: () => void;
    };
    status: RequestStatus;
    setStatus: React.Dispatch<React.SetStateAction<RequestStatus>>;
    formService?: typeof FormService;
    nonceManager?: typeof NonceManager;
};

const ContactForm = ({
    formRef,
    callbacks,
    status,
    setStatus,
    formService = FormService,
    nonceManager = NonceManager,
}: ContactFormProps) => {
    const [nonce, setNonce] = useState<string | null>(null);

    useEffect(() => {
        nonceManager.create().then(setNonce);
    }, []);

    const { register, handleSubmit, setError, clearErrors, formState: { errors: formErrors } } = useContactFormValidation(sessionStorage.getItem("contactFormEmail") || "");

    const editorRef = useRef<any>(null)

    const onValid = useContactFormSubmission({
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
    });

    return (
        <form ref={formRef} id='contact-form' className='space-y-8' onSubmit={async (e) => {
            // @ts-ignore // the error is set manually in onValid function
            clearErrors("emailContent");
            handleSubmit((data) => onValid(data as MessageInputs, nonce))(e);
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
                    {...register("email", emailRule)}
                    disabled={status.id !== getRequestStatusById("ready")!.id}
                />
                <span className='text-red-500'>{formErrors.email && <span>{formErrors.email.message}</span>}</span>
            </div>
            <TextEditor
                editorRef={editorRef}
                opt={{
                    characterLimit: CHARACTER_LIMIT,
                    content: "",
                    // @ts-ignore // the error is set manually in onValid function
                    error: formErrors.emailContent,
                    classNames: "min-h-[14rem] max-h-[30cqh] 2xl:max-h-dvh",
                }}
            />
        </form>
    )
}

export default ContactForm