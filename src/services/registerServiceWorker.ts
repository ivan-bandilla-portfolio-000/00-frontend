import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
    // don't try to register when SW unsupported
    if (!('serviceWorker' in navigator)) return;

    // async guard so callers can remain sync
    (async () => {
        // In dev, the dev server may not expose /sw.js (it may return index.html).
        // Probe the URL and only proceed if it looks like JS.
        try {
            const res = await fetch('/sw.js', { cache: 'no-store' });
            const ct = res.headers.get('content-type') ?? '';
            if (!res.ok || !ct.includes('javascript')) {
                console.warn('[PWA] /sw.js not available or not javascript; skipping SW registration', { ok: res.ok, contentType: ct });
                return;
            }
        } catch (err) {
            console.warn('[PWA] failed to fetch /sw.js; skipping SW registration', err);
            return;
        }

        // proceed with normal registerSW flow
        const updateSW = registerSW({
            onRegistered(reg: ServiceWorkerRegistration | undefined) {
                if (reg) {
                    if (reg.active) {
                        reg.active.postMessage({ type: 'CHECK_EXPIRE' });
                    } else {
                        // Wait for activation
                        reg.addEventListener('updatefound', () => {
                            const sw = reg.installing;
                            sw?.addEventListener('statechange', () => {
                                if (sw.state === 'activated') {
                                    sw.postMessage({ type: 'CHECK_EXPIRE' });
                                }
                            });
                        });
                    }
                } else {
                    console.warn('[PWA] Service worker registration undefined');
                }
            },
            onRegisterError(error) {
                console.error('[PWA] SW registration error', error);
            }
        });

        const sendDelete = () => {
            navigator.serviceWorker.controller?.postMessage({ type: 'TRY_DELETE_IF_NO_CLIENTS' });
        };
        window.addEventListener('pagehide', sendDelete);
        window.addEventListener('beforeunload', sendDelete);

        // expose helpers if needed
        return {
            updateSW,
            resetDbTimer() {
                navigator.serviceWorker.controller?.postMessage({ type: 'RESET_DB_TIMER' });
            }
        };
    })();
}