import Dexie, { type EntityTable } from 'dexie';
import type { RateLimitAction } from '@/indexedDB/models/RateLimitAction';
import type { NonceEntry } from '@/indexedDB/models/Nonce';

export class PortfolioDB extends Dexie {
    actions!: EntityTable<RateLimitAction, 'id'>;
    nonces!: EntityTable<NonceEntry, 'id'>;
    constructor() {
        super('rateLimiter_db');
        this.version(1).stores({
            actions: 'id',
            nonces: 'id, createdAt'
        });
    }
}

export const db = new PortfolioDB();