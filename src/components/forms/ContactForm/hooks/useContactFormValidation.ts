import { useForm } from "react-hook-form";

export interface MessageInputs {
    email: string;
    emailContent: string;
}

export function useContactFormValidation(defaultEmail: string) {
    const form = useForm<{ email: string }>({
        defaultValues: { email: defaultEmail }
    });

    // Override setError and clearErrors to accept "emailContent"
    const setError = (form.setError as unknown) as (
        name: keyof MessageInputs,
        error: { type: string; message: string }
    ) => void;

    const clearErrors = (form.clearErrors as unknown) as (
        name: keyof MessageInputs
    ) => void;

    return {
        ...form,
        setError,
        clearErrors,
    };
}