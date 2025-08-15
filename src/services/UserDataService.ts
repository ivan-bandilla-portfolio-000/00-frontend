import { userDb } from '@/indexedDB/PortfolioUserDB';
import type { UserData } from '@/indexedDB/models/UserData';

export class UserDataService {
    static USER_DATA_ID = 'current';

    static async saveIsITField(isITField: boolean): Promise<UserData> {
        const now = Date.now();
        await userDb.transaction('rw', userDb.user_data, async () => {
            const existing = await userDb.user_data.get(UserDataService.USER_DATA_ID);
            if (existing) {
                await userDb.user_data.update(UserDataService.USER_DATA_ID, {
                    isITField,
                    updatedAt: now
                });
            } else {
                await userDb.user_data.add({
                    id: UserDataService.USER_DATA_ID,
                    isITField,
                    createdAt: now,
                    updatedAt: now
                });
            }
        });
        const saved = await userDb.user_data.get(UserDataService.USER_DATA_ID);
        if (!saved) throw new Error('Failed to persist user data');
        return saved;
    }

    static async getUserData(): Promise<UserData | undefined> {
        return userDb.user_data.get(UserDataService.USER_DATA_ID);
    }

    static async clearUserData(): Promise<void> {
        await userDb.user_data.clear();
    }
}