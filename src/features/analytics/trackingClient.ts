import { initTracking } from '@/features/analytics/index.ts';

// Small helper that reads env and initializes tracking. Kept small and non-invasive.
export async function initializeTrackingFromEnv(): Promise<void> {
    // Only run in production by default to avoid noise in dev
    if (!import.meta.env.PROD) return;

    const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
    const IPINFO_TOKEN = import.meta.env.VITE_IPINFO_TOKEN as string | undefined;
    const VENDOR_SCRIPT = import.meta.env.VITE_VENDOR_SCRIPT_URL as string | undefined;
    const ENABLE_FINGERPRINT = import.meta.env.VITE_ENABLE_FINGERPRINT === 'true';
    const SEND_IDENTIFY_TO_GA = import.meta.env.VITE_SEND_IDENTIFY_TO_GA === 'true';

    try {
        const { fingerprint, ipInfo } = await initTracking({
            gaId: GA_ID,
            ipinfoToken: IPINFO_TOKEN,
            vendorScriptUrl: VENDOR_SCRIPT,
            enableFingerprint: ENABLE_FINGERPRINT,
            sendIdentifyToGA: SEND_IDENTIFY_TO_GA,
        });

        // keep in memory for the session
        (window as any).__tracking = { fingerprint, ipInfo };

        const DISCORD_PROXY = import.meta.env.VITE_DISCORD_PROXY_URL as string | undefined;
        const DISCORD_PROXY_KEY = import.meta.env.VITE_DISCORD_PROXY_KEY as string | undefined;

        if (DISCORD_PROXY && fingerprint) {
            try {
                const ipObj = ipInfo || {};
                const fields = [
                    { name: 'Fingerprint', value: String(fingerprint), inline: false },
                    ...Object.entries(ipObj).map(([k, v]) => ({
                        name: k,
                        value: String(v ?? ''),
                        inline: true,
                    })),
                ];

                const discordPayload = {
                    embeds: [
                        {
                            title: 'New visitor',
                            fields,
                            timestamp: new Date().toISOString(),
                        },
                    ],
                };

                await fetch(DISCORD_PROXY, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(DISCORD_PROXY_KEY ? { 'X-API-KEY': DISCORD_PROXY_KEY } : {}),
                    },
                    body: JSON.stringify(discordPayload),
                });
            } catch (e) {
                // ignore network/errors from the proxy to avoid breaking the app
            }
        }
    } catch (err) {
        // Log but don't block app boot
        console.error('initializeTrackingFromEnv error', err);
    }
}
