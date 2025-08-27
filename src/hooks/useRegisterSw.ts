import { useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export default function useRegisterSW() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    // registerSW returns an update function: call it to trigger skipWaiting (and optionally reload)
    const updateServiceWorker = registerSW({
        onNeedRefresh() {
            // new SW installed and waiting -> show UI to prompt the user
            setNeedRefresh(true);
        },
        onOfflineReady() {
            setOfflineReady(true);
        },
    });

    // call updateServiceWorker(true) to skipWaiting + reload (or updateServiceWorker() then message client)
    return { needRefresh, setNeedRefresh, offlineReady, updateServiceWorker };
}