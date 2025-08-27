/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { environment } from '../../src/app/helpers/config';

declare let self: ServiceWorkerGlobalScope;

(self as any).__WB_DISABLE_DEV_LOGS = environment('local');

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // Claim now (optional); do NOT skipWaiting earlier.
        clientsClaim();
        await ensureCreatedAt();
        await checkAndExpire();
    })());
});

// clientsClaim();
// self.skipWaiting();

const RUNTIME_VERSION = 'v1';

// Injected by VitePWA (injectManifest)
precacheAndRoute(self.__WB_MANIFEST || []);

// SPA navigation fallback so offline entry serves index.html
try {
    const handler = createHandlerBoundToURL('/index.html');

    registerRoute(
        ({ request }) => request.mode === 'navigate',
        async (args) => {
            try {
                // network-first so user gets updates when online
                const navResp = await new NetworkFirst({
                    cacheName: 'pages',
                    networkTimeoutSeconds: 3,
                }).handle(args);
                return navResp || (await handler(args));
            } catch {
                // fallback to precached shell
                return handler(args);
            }
        }
    );
} catch (err) {
    console.warn('Navigation route registration failed in SW:', err);
}

registerRoute(
    ({ request, url }) =>
        request.destination === 'script' &&
        url.origin === self.location.origin &&
        (/LLM\.webworker-|vendor-webllm-/.test(url.pathname)),
    new CacheFirst({
        cacheName: 'llm-assets-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 7 * 24 * 3600 })
        ]
    })
);

// Image cache
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images-v1',
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 3600 })]
    })
);

// Cache JS/CSS/fonts (runtime): CacheFirst so once fetched they become available offline
registerRoute(
    ({ request, url }) =>
        (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') &&
        url.origin === self.location.origin,
    new CacheFirst({
        cacheName: 'static-resources-v1',
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 3600 })]
    })
);

// Cache dynamic /assets JS chunks (CacheFirst so once fetched they serve offline)
registerRoute(
    ({ request, url }) =>
        request.destination === 'script' &&
        url.origin === self.location.origin &&
        url.pathname.startsWith('/assets/'),
    new CacheFirst({
        cacheName: 'js-chunks-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 30 * 24 * 3600 }) // 30 days
        ]
    })
);

// Cache Google Fonts stylesheets & font files (cross-origin)
registerRoute(
    ({ url }) => url.hostname === 'fonts.googleapis.com',
    new StaleWhileRevalidate({
        cacheName: `google-fonts-styles-${RUNTIME_VERSION}`,
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 24 * 3600 })
        ]
    })
);

// Cache Google Fonts webfont files
registerRoute(
    ({ url, request }) =>
        url.hostname === 'fonts.gstatic.com' && request.destination === 'font',
    new CacheFirst({
        cacheName: `google-fonts-webfonts-${RUNTIME_VERSION}`,
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 365 * 24 * 3600 })
        ]
    })
);

// Image cache (exclude manifest icons & screenshots already precached)
const PRECACHED_ICON_REGEX = /\/assets\/icons\/manifest-icon-|\/assets\/screenshot_/i;
registerRoute(
    ({ request, url }) =>
        request.destination === 'image' &&
        url.origin === self.location.origin &&
        !PRECACHED_ICON_REGEX.test(url.pathname),
    new CacheFirst({
        cacheName: 'images-v1',
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 3600 })]
    })
);

// API / data cache
registerRoute(
    /\/(api|graphql|projects|experiences|roles|tags).*$/i,
    new NetworkFirst({
        cacheName: 'api-v1',
        networkTimeoutSeconds: 5,
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 600 })]
    })
);

// IndexedDB ephemeral cleanup
const DB_NAME = 'portfolio_db';
const META_DB = 'portfolio_meta';
const META_STORE = 'kv';
const CREATED_KEY = 'dbCreatedAt';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function tryDeleteIfNoClients() {
    // small delay to allow the closing client to truly go away (reduce race)
    await new Promise((r) => setTimeout(r, 30_000));
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windowClients.length === 0) {
        await deleteDb(DB_NAME);
    }
}

self.addEventListener('message', (e) => {
    const type = e.data?.type;
    if (type === 'DELETE_DB_NOW') deleteDb(DB_NAME);
    if (type === 'TRY_DELETE_IF_NO_CLIENTS') tryDeleteIfNoClients();
    if (type === 'CHECK_EXPIRE') checkAndExpire();
    if (type === 'RESET_DB_TIMER') setCreatedAt(Date.now());

    // allow controlled activation from the app:
    if (type === 'SKIP_WAITING') {
        // when client sends this, the waiting SW will call skipWaiting()
        // and then the client can reload if desired
        self.skipWaiting();
    }
});

// Helpers
function openMetaDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const r = indexedDB.open(META_DB, 1);
        r.onupgradeneeded = () => {
            if (!r.result.objectStoreNames.contains(META_STORE))
                r.result.createObjectStore(META_STORE);
        };
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
    });
}
async function ensureCreatedAt() {
    const db = await openMetaDb();
    const tx = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);
    const existing = await req(store.get(CREATED_KEY));
    if (!existing) store.put(Date.now(), CREATED_KEY);
    await done(tx); db.close();
}
async function setCreatedAt(ts: number) {
    const db = await openMetaDb();
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put(ts, CREATED_KEY);
    await done(tx); db.close();
}
async function getCreatedAt() {
    const db = await openMetaDb();
    const tx = db.transaction(META_STORE, 'readonly');
    const val = await req(tx.objectStore(META_STORE).get(CREATED_KEY));
    await done(tx); db.close();
    return typeof val === 'number' ? val : null;
}
async function checkAndExpire() {
    try {
        const created = await getCreatedAt();
        if (!created) { await ensureCreatedAt(); return; }
        if (Date.now() - created > MAX_AGE_MS) {
            await deleteDb(DB_NAME);
            await setCreatedAt(Date.now());
        }
    } catch { }
}
function deleteDb(name: string) {
    return new Promise<void>((resolve) => {
        const r = indexedDB.deleteDatabase(name);
        r.onsuccess = r.onerror = r.onblocked = () => resolve();
    });
}
function req<T = any>(r: IDBRequest) {
    return new Promise<T>((res, rej) => {
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
}
function done(tx: IDBTransaction) {
    return new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        tx.onabort = tx.onerror = () => rej(tx.error);
    });
}