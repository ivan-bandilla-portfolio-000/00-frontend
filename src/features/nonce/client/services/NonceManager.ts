import { db } from '@/indexedDB/db';

export class NonceManager {
    /**
     * Generate and store a new nonce.
     */
    static async create(): Promise<string> {
        const nonce = crypto.randomUUID();
        await db.nonces.put({ id: nonce, createdAt: Date.now() });
        return nonce;
    }

    /**
     * Check if a nonce exists (and optionally remove it).
     */
    static async use(nonce: string, remove = true): Promise<boolean> {
        const found = await db.nonces.get(nonce);
        if (found && remove) {
            await db.nonces.delete(nonce);
        }
        return !!found;
    }

    /**
     * Clean up expired nonces.
     */
    static async cleanup(expiryMs: number) {
        const now = Date.now();
        const expired = await db.nonces
            .where('createdAt')
            .below(now - expiryMs)
            .primaryKeys();
        await db.nonces.bulkDelete(expired);
    }
}