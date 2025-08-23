import * as lf from 'lovefield';

export const DB_NAME = 'portfolio_db';
export const DB_VERSION = 1;

export const schemaBuilder = lf.schema.create(DB_NAME, DB_VERSION);

export function deleteClientDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
    });
}

export { lf };