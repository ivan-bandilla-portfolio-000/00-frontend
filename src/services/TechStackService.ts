import { BaseService } from "@/services/BaseService";
import type { lf } from "@/clientDB/schema";

export type TechStackRow = {
    id: number;
    content: string;
    icon: string;
};

let seedInFlight: Promise<void> | null = null;

export class TechStackService extends BaseService {
    static BASE_API = import.meta.env.VITE_DATA_SOURCE_URL;

    static async fetchTechStackFromApi(): Promise<Omit<TechStackRow, "id">[]> {
        const res = await this.get<any>(`${TechStackService.BASE_API}/tech-stacks`);

        const rawBody = res && typeof res === "object" && "data" in res ? (res as any).data : res;

        let body: any = rawBody;
        if (typeof rawBody === "string") {
            try {
                body = JSON.parse(rawBody);
            } catch (e) {
                console.warn("TechStack: response is not valid JSON:", e);
                return [];
            }
        }

        const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        const mapped: Omit<TechStackRow, "id">[] = list.map((item: any) => ({
            content: String(item?.content ?? ""),
            icon: String(item?.icon ?? ""),
        }));
        return mapped.filter((i: Omit<TechStackRow, "id">) => i.content.length > 0 && i.icon.length > 0);
    }

    static async saveTechStack(db: lf.Database, items: Omit<TechStackRow, "id">[] = []): Promise<void> {
        const techStackTable = db.getSchema().table("tech_stack");

        const safeItems = Array.isArray(items) ? items : [];
        const rows = safeItems.map(item =>
            techStackTable.createRow({
                content: item.content,
                icon: item.icon,
            })
        );

        if (!rows.length) {
            console.warn("TechStack: API returned no items; skipping local overwrite.");
            return;
        }

        await db.delete().from(techStackTable).exec();
        await db.insertOrReplace().into(techStackTable).values(rows).exec();
    }

    static async getTechStack(db: lf.Database): Promise<TechStackRow[]> {
        const techStackTable = db.getSchema().table("tech_stack");
        return await db.select().from(techStackTable).exec() as TechStackRow[];
    }

    static async ensureAndGetTechStack(db: lf.Database): Promise<TechStackRow[]> {
        const techStackTable = db.getSchema().table("tech_stack");
        const existing = await db.select().from(techStackTable).limit(1).exec();

        if (existing.length === 0) {
            if (!seedInFlight) {
                seedInFlight = TechStackService.fetchTechStackFromApi()
                    .then(rows => TechStackService.saveTechStack(db, rows))
                    .catch(e => {
                        console.warn("TechStack API fetch failed:", e);
                    })
                    .finally(() => { seedInFlight = null; });
            }
            await seedInFlight;
        }

        return TechStackService.getTechStack(db);
    }
}