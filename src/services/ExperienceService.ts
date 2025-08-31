import { BaseService } from "@/services/BaseService";
import type { lf } from "@/clientDB/schema";
import { RoleService } from "@/services/RoleService";

export type ExperienceRow = {
    id: number;
    company: string;
    role_id: number | null;
    position: string;
    start: Date;
    end: Date;
    description?: string | null;
    type: string;
    hidden: boolean;
    role?: { id: number; name: string } | null;
    thumbnails?: { thumbnail: string; alt?: string }[] | null;
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

        // Gather role names from items
        const roleNames = items.map(i => i.role || i.role_name).filter(Boolean);
        const roleIdMap = await RoleService.ensureRoles(db, roleNames);

        const rows = items.map(item => {
            const roleName: string | undefined = item.role || item.role_name;
            const role_id = roleName ? (roleIdMap.get(roleName.toLowerCase()) ?? null) : null;
            console.log("Mapping experience item:", item, "to role_id:", role_id);
            return experiencesTable.createRow({
                company: item.company,
                role_id,
                position: item.position,
                start: new Date(item.start),
                end: new Date(item.end),
                description: item.description ?? null,
                thumbnails: item.thumbnails ? JSON.stringify(item.thumbnails) : null,
                type: item.type,
                hidden: !!item.hidden,
            });
        });

        await db.delete().from(experiencesTable).exec();
        if (rows.length) {
            await db.insertOrReplace().into(experiencesTable).values(rows).exec();
        }
    }

    static async getExperiences(db: lf.Database): Promise<ExperienceRow[]> {
        const experiencesTable = db.getSchema().table("experiences");
        const rolesTable = db.getSchema().table("roles");

        const experiences = await db.select().from(experiencesTable).exec() as any[];
        if (!experiences.length) return [];

        const roleIds = Array.from(new Set(experiences.map(e => e.role_id).filter((v: any) => v != null)));
        let rolesById = new Map<number, { id: number; name: string }>();
        if (roleIds.length) {
            const roleRows = await db.select().from(rolesTable).where(rolesTable['id'].in(roleIds)).exec() as { id: number; name: string }[];
            rolesById = new Map(roleRows.map(r => [r.id, r]));
        }

        return experiences.map(e => ({
            id: e.id,
            company: e.company,
            role_id: e.role_id ?? null,
            position: e.position,
            start: e.start,
            end: e.end,
            description: e.description,
            type: e.type,
            hidden: e.hidden,
            thumbnails: e.thumbnails ? JSON.parse(e.thumbnails) : null,
            role: e.role_id != null ? rolesById.get(e.role_id) ?? null : null
        }));
    }

    static async ensureAndGetExperiences(db: lf.Database): Promise<ExperienceRow[]> {
        const experiencesTable = db.getSchema().table("experiences");
        const existing = await db.select().from(experiencesTable).limit(1).exec();

        if (existing.length === 0) {
            const rows = await ExperienceService.fetchExperiencesFromApi();
            console.log("Fetched experiences from API:", rows);
            await ExperienceService.saveExperiences(db, rows);
        }

        return ExperienceService.getExperiences(db);
    }
}