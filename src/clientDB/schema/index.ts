import { schemaBuilder, lf, DB_NAME, DB_VERSION, deleteClientDB } from './schemaBuilder';

import './0SchemaRegistration';

let dbPromise: Promise<lf.Database> | null = null;

function getExistingDbVersion(): Promise<number | null> {
    return new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = () => {
            try {
                const db = req.result;
                const v = db.version;
                db.close();
                resolve(v);
            } catch {
                resolve(null);
            }
        };
        req.onerror = () => resolve(null);
    });
}

export async function connectClientDB(): Promise<lf.Database> {
    if (!dbPromise) {
        dbPromise = (async () => {
            const existingVersion = await getExistingDbVersion();
            if (existingVersion !== null && existingVersion !== DB_VERSION) {
                // delete DB to avoid upgrade/mismatch (you said that's acceptable)
                await deleteClientDB();
            }
            return schemaBuilder.connect();
        })();
    }
    return dbPromise;
}

export { schemaBuilder, lf };