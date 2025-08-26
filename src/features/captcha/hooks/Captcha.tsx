import { useCallback, useEffect, useState } from 'react';

declare global {
    interface Window {
        grecaptcha?: {
            ready: (cb: () => void) => void;
            execute: (siteKey: string, opts: { action: string }) => Promise<string>;
        };
    }
}

const useRecaptcha = (siteKey: string) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!siteKey) return;
        if (window.grecaptcha) {
            setReady(true);
            return;
        }

        const id = 'recaptcha-v3-script';
        if (document.getElementById(id)) return;

        const script = document.createElement('script');
        script.id = id;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.onload = () => {
            if (window.grecaptcha) setReady(true);
        };
        document.head.appendChild(script);
    }, [siteKey]);

    const execute = useCallback(async (action: string): Promise<string | null> => {
        if (!siteKey) throw new Error('reCAPTCHA site key required');
        if (!window.grecaptcha) return null;

        return new Promise((resolve) => {
            window.grecaptcha!.ready(() => {
                // grecaptcha.execute returns a Promise<string>
                try {
                    const promise = window.grecaptcha!.execute(siteKey, { action }) as Promise<string>;
                    promise.then(token => resolve(token)).catch(() => resolve(null));
                } catch {
                    resolve(null);
                }
            });
        });
    }, [siteKey]);

    return { execute, ready };
};

export default useRecaptcha;