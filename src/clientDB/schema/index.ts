import { schemaBuilder, lf } from './schemaBuilder';

import './0SchemaRegistration';

let dbPromise: Promise<lf.Database> | null = null;

export function connectClientDB(): Promise<lf.Database> {
    if (!dbPromise) {
        dbPromise = schemaBuilder.connect();
    }
    return dbPromise;
}

export { schemaBuilder, lf };