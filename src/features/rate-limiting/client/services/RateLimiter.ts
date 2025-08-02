import { db } from '@/indexedDB/db';
import type { RateLimitAction } from '@/indexedDB/models/RateLimitAction';
import { toast } from "sonner"
import type { ToastPositions } from "@/constants/toastPositions";

export class RateLimiter {

    static rateLimitedMessage = "Too many requests, please try again later.";

    /**
     * Checks if an action is allowed under the rate limit.
     * @param key Unique key for the action (e.g., 'contact-form')
     * @param limit Max allowed actions in the window
     * @param windowMs Time window in ms (e.g., 60000 for 1 minute)
     */
    static async isAllowed(key: string, limit: number, windowMs: number): Promise<boolean> {
        const now = Date.now();
        let record = await db.actions.get(key) as RateLimitAction | undefined;
        if (!record) {
            record = { id: key, timestamps: [] };
        }
        // Remove timestamps outside the window
        record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);
        if (record.timestamps.length < limit) {
            record.timestamps.push(now);
            await db.actions.put(record);
            return true;
        }
        return false;
    }

    /**
     * Throws an error simulating HTTP 429 if rate limit is exceeded.
     * @param key Unique key for the action
     * @param limit Max allowed actions in the window
     * @param windowMs Time window in ms
     */
    static async throwIfLimited(key: string, limit: number, windowMs: number, options?: { toastPosition?: ToastPositions } = {}): Promise<void> {
        const allowed = await this.isAllowed(key, limit, windowMs);
        if (!allowed) {
            const error = new Error(RateLimiter.rateLimitedMessage);
            // @ts-ignore
            error.status = 429;
            toast.error(RateLimiter.rateLimitedMessage, {
                position: options?.toastPosition || 'bottom-right',
            });
            throw error;
        }
    }

    /**
     * Clears the rate limit for a given key.
     */
    static async reset(key: string) {
        await db.actions.delete(key);
    }
}