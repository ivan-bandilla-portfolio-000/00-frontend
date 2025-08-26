/* Minimal GA wrapper for Measurement (gtag) with manual page_view control */

import ReactGA from 'react-ga4';

declare global {
    interface Window {
        dataLayer?: any[];
        gtag?: (...args: any[]) => void;
        gtagInitialized?: boolean;
    }
}

let initialized = false;

export function initGA(measurementId?: string) {
    if (!measurementId) return;
    if (initialized) return;
    try {
        ReactGA.initialize(measurementId);
        initialized = true;
    } catch (e) {
        console.warn('ReactGA init failed', e);
    }
}

export function pageview(path: string) {
    if (!initialized) return;
    try {
        // GA4: send a page_view
        // react-ga4 exposes gtag; prefer gtag for GA4 events
        if (typeof (ReactGA as any).gtag === 'function') {
            (ReactGA as any).gtag('event', 'page_view', { page_path: path });
        } else {
            // fallback to ReactGA.send
            (ReactGA as any).send({ hitType: 'pageview', page: path });
        }
    } catch (e) {
        console.warn('pageview failed', e);
    }
}

export function event(name: string, params?: Record<string, any>) {
    if (!initialized) return;
    try {
        if (typeof (ReactGA as any).gtag === 'function') {
            (ReactGA as any).gtag('event', name, params || {});
        } else {
            // fallback: map to category/action/label/value shape if needed
            const payload: any = {
                eventCategory: params?.category ?? 'event',
                eventAction: name,
                eventLabel: params?.label,
                value: params?.value,
            };
            (ReactGA as any).event?.(payload);
        }
    } catch (e) {
        console.warn('event failed', e);
    }
}

export async function getFingerprint(): Promise<string | null> {
    try {
        const mod = await import('@fingerprintjs/fingerprintjs');
        const FingerprintJS = (mod as any).default ?? mod;
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result?.visitorId ?? null;
    } catch (e) {
        console.warn('getFingerprint failed', e);
        return null;
    }
}

export async function getIPInfo(token?: string): Promise<Record<string, any> | null> {
    try {
        const url = token ? `https://ipinfo.io/json?token=${encodeURIComponent(token)}` : 'https://ipinfo.io/json';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.warn('getIPInfo failed', e);
        return null;
    }
}

export function loadExternalScript(src: string, id?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!src) return resolve();
        if (id && document.getElementById(id)) return resolve();
        const s = document.createElement('script');
        if (id) s.id = id;
        s.async = true;
        s.src = src;
        s.onload = () => resolve();
        s.onerror = (err) => reject(err);
        document.head.appendChild(s);
    });
}

export type InitOptions = {
    gaId?: string;
    ipinfoToken?: string;
    vendorScriptUrl?: string; // e.g. Leadfeeder snippet host
    enableFingerprint?: boolean;
    sendIdentifyToGA?: boolean; // send an anonymized identify event to GA
};

/**
 * initTracking:
 * - initializes GA (react-ga4)
 * - optionally loads a vendor script
 * - optionally computes a FingerprintJS visitorId and ipinfo
 * - optionally sends a non-PII identify event to GA
 */
export async function initTracking(opts: InitOptions = {}) {
    const { gaId, ipinfoToken, vendorScriptUrl, enableFingerprint, sendIdentifyToGA } = opts;

    if (gaId) initGA(gaId);

    if (vendorScriptUrl) {
        try {
            await loadExternalScript(vendorScriptUrl, 'vendor-script');
        } catch (e) {
            console.warn('vendor script load failed', e);
        }
    }

    // compute fingerprint and ip info in parallel if requested
    const [fingerprint, ipInfo] = await Promise.all([
        enableFingerprint ? getFingerprint() : Promise.resolve(null),
        ipinfoToken !== undefined ? getIPInfo(ipinfoToken) : Promise.resolve(null),
    ]);

    // send anonymized identify event to GA (no PII)
    if (sendIdentifyToGA && (fingerprint || ipInfo)) {
        const payload: Record<string, any> = {};
        if (fingerprint) payload.fingerprint = fingerprint;
        if (ipInfo) {
            const ipFields = [
                'ip',
                'asn',
                'as_name',
                'as_domain',
                'country_code',
                'country',
                'continent_code',
                'continent',
                'region',
                'city',
            ] as const;

            for (const key of ipFields) {
                const val = (ipInfo as any)[key];
                if (val != null) payload[key] = val;
            }
        }
        try {
            event('identify', payload);
        } catch (e) {
            console.warn('send identify event failed', e);
        }
    }

    return { fingerprint, ipInfo };
}
