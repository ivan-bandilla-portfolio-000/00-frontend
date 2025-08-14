import Dexie, { type EntityTable } from 'dexie';
import type { UserData } from './models/UserData';

export class PortfolioUserDB extends Dexie {
    user_data!: EntityTable<UserData, 'id'>;
    constructor() {
        super('portfolio_user');
        this.version(1).stores({
            user_data: 'id,isITField'
        });
    }
}

export const userDb = new PortfolioUserDB();