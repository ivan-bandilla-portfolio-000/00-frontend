import { emailRule } from "@/features/validations/constants/emailRule";
import { useForm } from "react-hook-form";

const validationSchema = {
    email: emailRule
};

export function useContactFormValidation(defaultEmail: string) {
    return useForm({
        defaultValues: { email: defaultEmail }
    });
}