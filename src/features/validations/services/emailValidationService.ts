import { validateEmail as validateEmailPrimary } from './emailValidationServicePrimary';
import { validateEmail as validateEmailSecondary } from './emailValidationServiceSecondary';

export async function verifyEmail(email: string) {
    let result;
    try {
        result = await validateEmailPrimary(email);
    } catch (e) {
        try {
            result = await validateEmailSecondary(email);
        } catch (e2) {
            return null;
        }
    }

    // Check for validity, disposability, and do_exist if present
    if (!result.is_valid || result.is_disposable || (typeof result.do_exist !== "undefined" && !result.do_exist)) {
        return false;
    }

    return true;
}