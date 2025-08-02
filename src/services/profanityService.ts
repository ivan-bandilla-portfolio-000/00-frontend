const API_URL = 'https://api.api-ninjas.com/v1/profanityfilter';
const API_KEY = 'ySQKjSRwP63b2/ge3FNxiA==5jT4EGtskE47ABz9';

export async function checkProfanity(text: string): Promise<{ censored: string, isProfane: boolean }> {
    const url = `${API_URL}?text=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        headers: {
            'X-Api-Key': API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
        censored: data.censored,
        isProfane: data.is_profane
    };
}