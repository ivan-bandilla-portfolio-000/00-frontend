import { schemaBuilder, lf, DB_NAME, DB_VERSION, deleteClientDB } from './schemaBuilder';

// Table definitions (must be before connect)
import './0SchemaRegistration';

const EXPECTED_TABLES = [
    'projects',
    'tags',
    'tag_types',
    'project_tags',
    'tech_stack',
    'experiences',
    'experience_tags',
    'project_statuses',
    'project_categories',
    'project_project_categories',
    'contact_info'
];

let dbPromise: Promise<lf.Database> | null = null;

function getExistingDbVersion(): Promise<number | null> {
    return new Promise(resolve => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = () => {
            try {
                const db = req.result;
                const v = db.version;
                db.close();
                resolve(v);
            } catch { resolve(null); }
        };
        req.onerror = () => resolve(null);
    });
}

function storesIntact(): Promise<boolean> {
    return new Promise(resolve => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = () => {
            try {
                const db = req.result;
                const names = new Set(Array.from(db.objectStoreNames));
                db.close();
                resolve(EXPECTED_TABLES.every(t => names.has(t)));
            } catch { resolve(false); }
        };
        req.onerror = () => resolve(false);
    });
}

export async function connectClientDB(): Promise<lf.Database> {
    if (!dbPromise) {
        dbPromise = (async () => {
            const existingVersion = await getExistingDbVersion();
            if (existingVersion !== null) {
                if (existingVersion !== DB_VERSION) {
                    await deleteClientDB();
                } else {
                    const ok = await storesIntact();
                    if (!ok) {
                        await deleteClientDB();
                    }
                }
            }
            // All tables already registered via static import above
            return schemaBuilder.connect();
        })();
    }
    return dbPromise;
}

export { schemaBuilder, lf };