import { BaseService } from "@/services/BaseService";
import type { lf } from "@/clientDB/schema";

export type ExperienceRow = {
    id: number;
    company: string;
    role: string;
    position: string;
    start: Date;
    end: Date;
    description?: string;
    type: string;
    hidden: boolean;
};

export class ExperienceService extends BaseService {
    static BASE_API = import.meta.env.VITE_DATA_SOURCE_URL;

    static async fetchExperiencesFromApi(): Promise<any[]> {
        const res = await this.rateLimited('experiences-endpoint', 5, 60_000, () =>
            this.get<any>(`${ExperienceService.BASE_API}/experiences`)
        );
        return Array.isArray(res?.data?.data) ? res.data.data : [];
    }

    static async saveExperiences(db: lf.Database, items: any[] = []): Promise<void> {
        const experiencesTable = db.getSchema().table("experiences");
        const rows = items.map(item =>
            experiencesTable.createRow({
                company: item.company,
                role: item.role,
                position: item.position,
                start: new Date(item.start),
                end: new Date(item.end),
                description: item.description ?? null,
                type: item.type,
                hidden: !!item.hidden,
            })
        );
        await db.delete().from(experiencesTable).exec();
        await db.insertOrReplace().into(experiencesTable).values(rows).exec();
    }

    static async getExperiences(db: lf.Database): Promise<ExperienceRow[]> {
        const experiencesTable = db.getSchema().table("experiences");
        return await db.select().from(experiencesTable).exec() as ExperienceRow[];
    }

    static async ensureAndGetExperiences(db: lf.Database): Promise<ExperienceRow[]> {
        const experiencesTable = db.getSchema().table("experiences");
        const existing = await db.select().from(experiencesTable).limit(1).exec();

        if (existing.length === 0) {
            const rows = await ExperienceService.fetchExperiencesFromApi();
            await ExperienceService.saveExperiences(db, rows);
        }

        return ExperienceService.getExperiences(db);
    }
}