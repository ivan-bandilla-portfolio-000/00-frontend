declare global {
    interface Window {
        grecaptcha?: {
            render: (container: HTMLElement | null, parameters: { sitekey: string; callback: (token: string) => void }) => void;
            execute(siteKey: string, options: { action: string }): Promise<string>;
        };
        onRecaptchaLoad?: () => void;
    }
}

export { };