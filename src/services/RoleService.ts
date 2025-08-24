import { BaseService } from "@/services/BaseService";
import type { lf } from "@/clientDB/schema";

export type RoleRow = { id: number; name: string };

export class RoleService extends BaseService {
    static BASE_API = import.meta.env.VITE_DATA_SOURCE_URL;

    static async fetchRolesFromApi(): Promise<RoleRow[]> {
        const res = await this.rateLimited('roles-endpoint', 5, 60_000, () =>
            this.get<{ data: RoleRow[] }>(`${RoleService.BASE_API}/roles`)
        );
        return Array.isArray(res?.data?.data) ? res.data.data : [];
    }

    // Preserve server IDs (preferred when other entities reference role_id)
    static async saveRolesWithIds(db: lf.Database, roles: RoleRow[]): Promise<void> {
        if (!roles.length) return;
        const rolesTable = db.getSchema().table('roles');
        const existing = await db.select().from(rolesTable).exec() as RoleRow[];
        const byId = new Map(existing.map(r => [r.id, r]));

        const toInsert = [];
        for (const r of roles) {
            if (byId.has(r.id)) {
                // Update name if changed
                if (byId.get(r.id)!.name !== r.name) {
                    await db.update(rolesTable)
                        .set(rolesTable['name'], r.name)
                        .where(rolesTable['id'].eq(r.id))
                        .exec();
                }
            } else {
                toInsert.push(rolesTable.createRow({ id: r.id, name: r.name }));
            }
        }
        if (toInsert.length) {
            await db.insert().into(rolesTable).values(toInsert).exec();
        }
    }

    // Legacy (name-only) helpers kept if still used elsewhere
    static async ensureRoles(db: lf.Database, roleNames: (string | null | undefined)[]): Promise<Map<string, number>> {
        const rolesTable = db.getSchema().table('roles');
        const existing = await db.select().from(rolesTable).exec() as RoleRow[];
        const byLower = new Map(existing.map(r => [r.name.toLowerCase(), r]));

        const toAdd: string[] = [];
        for (const raw of roleNames) {
            if (!raw) continue;
            const name = raw.trim();
            if (!name) continue;
            const key = name.toLowerCase();
            if (!byLower.has(key)) toAdd.push(name);
        }
        if (toAdd.length) {
            const rows = toAdd.map(n => rolesTable.createRow({ name: n }));
            const inserted = await db.insert().into(rolesTable).values(rows).exec() as RoleRow[];
            for (const r of inserted) byLower.set(r.name.toLowerCase(), r);
        }
        const map = new Map<string, number>();
        for (const [k, r] of byLower) map.set(k, r.id);
        return map;
    }

    static async getRoleIdMap(db: lf.Database): Promise<Map<string, number>> {
        const rolesTable = db.getSchema().table('roles');
        const rows = await db.select().from(rolesTable).exec() as RoleRow[];
        return new Map(rows.map(r => [r.name.toLowerCase(), r.id]));
    }
}