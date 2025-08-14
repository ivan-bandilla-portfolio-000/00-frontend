import type { lf } from "@/clientDB/schema";

export type MetaTag = { id: number; name: string; color?: string | null; icon?: string | null; type_id?: number | null };
export type MetaStatus = { id: number; name: string };
export type MetaCategory = { id: number; name: string };

export class ProjectMetaService {
    static async getMeta(db: lf.Database): Promise<{
        tags: MetaTag[];
        statuses: MetaStatus[];
        categories: MetaCategory[];
    }> {
        const schema = db.getSchema();
        const tagsTable = schema.table("tags");
        const statusesTable = schema.table("project_statuses");
        const categoriesTable = schema.table("project_categories");

        const [tags, statuses, categories] = await Promise.all([
            db.select().from(tagsTable).exec() as Promise<MetaTag[]>,
            db.select().from(statusesTable).exec() as Promise<MetaStatus[]>,
            db.select().from(categoriesTable).exec() as Promise<MetaCategory[]>,
        ]);

        // Basic sorting
        tags.sort((a, b) => a.name.localeCompare(b.name));
        statuses.sort((a, b) => a.name.localeCompare(b.name));
        categories.sort((a, b) => a.name.localeCompare(b.name));

        return { tags, statuses, categories };
    }
}