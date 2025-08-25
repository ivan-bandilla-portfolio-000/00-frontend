/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { environment } from '../../src/app/helpers/config';

declare let self: ServiceWorkerGlobalScope;

(self as any).__WB_DISABLE_DEV_LOGS = environment('local');

clientsClaim();
self.skipWaiting();

// Injected by VitePWA (injectManifest)
precacheAndRoute(self.__WB_MANIFEST || []);

// Image cache
registerRoute(
    ({ request }) => request.destination === 'image',
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

self.addEventListener('activate', (e) => {
    e.waitUntil((async () => {
        await ensureCreatedAt();
        await checkAndExpire();
    })());
});

async function tryDeleteIfNoClients() {
    // small delay to allow the closing client to truly go away (reduce race)
    await new Promise((r) => setTimeout(r, 500));
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
});

self.addEventListener('fetch', () => { checkAndExpire(); });

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