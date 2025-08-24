import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
    const updateSW = registerSW({
        onRegistered(reg: ServiceWorkerRegistration | undefined) {
            if (reg) {
                console.log('[PWA] Service worker registered:', reg);
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
        // ask the SW to delete only if there are no other open window clients
        navigator.serviceWorker.controller?.postMessage({ type: 'TRY_DELETE_IF_NO_CLIENTS' });
    };
    window.addEventListener('pagehide', sendDelete);
    window.addEventListener('beforeunload', sendDelete);

    return {
        updateSW,
        resetDbTimer() {
            navigator.serviceWorker.controller?.postMessage({ type: 'RESET_DB_TIMER' });
        }
    };
}