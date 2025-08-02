const API_URL = import.meta.env.VITE_PORTFOLIO_PRIMARY_EMAIL_VERIFY_URL!;
const API_KEY = import.meta.env.VITE_PORTFOLIO_PRIMARY_EMAIL_VERIFY_KEY!;

export async function validateEmail(email: string): Promise<any> {
    const url = `${API_URL}?api_key=${API_KEY}&email_address=${encodeURIComponent(email)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const result = {
        is_valid: data.result.validation_details.format_valid,
        is_disposable: data.result.validation_details.disposable,
        do_exist: data.result.validation_details.smtp_check,
        mailbox_full: data.result.validation_details.mailbox_full,
        mailbox_disabled: data.result.validation_details.mailbox_disabled,
        status: data.result.status,
        score: data.result.score,
    };

    return result;
}