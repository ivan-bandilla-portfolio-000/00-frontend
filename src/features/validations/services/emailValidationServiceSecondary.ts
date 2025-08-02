const API_URL = import.meta.env.VITE_PORTFOLIO_SECONDARY_EMAIL_VERIFY_URL!;
const API_KEY = import.meta.env.VITE_PORTFOLIO_SECONDARY_EMAIL_VERIFY_KEY!;

export async function validateEmail(email: string): Promise<any> {
    const url = `${API_URL}?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
        headers: {
            'X-Api-Key': API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const result = {
        is_valid: data.result.is_valid,
        is_disposable: data.result.is_disposable,
    };

    return result;
}