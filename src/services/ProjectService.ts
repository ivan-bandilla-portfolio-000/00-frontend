import { BaseService } from '@/services/BaseService';
import type { Project } from "@/clientDB/@types/Project";
import { lf } from '@/clientDB/schema';
import { RateLimiter } from '@/features/rate-limiting/client/services/RateLimiter';

// Add concrete row types to avoid "object" property errors
type TagRow = {
    id: number;
    name: string | null;
    color: string | null;
    icon: string | null;
    type_id: number | null;
};

type ProjectRow = {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    avp: string | null;
    project_link: string | null;
    status_id?: number | null;
    project_category_ids?: number[];
    start_date: string;
    end_date: string | null;
};

type ProjectTagRow = {
    project_id: number;
    tag_id: number;
};

type StatusRow = {
    id: number;
    name: string;
};

type ProjectCategoryRow = {
    id: number;
    name: string;
};

// @ts-ignore
type TagTypeRow = {
    id: number;
    name: string;
};

let seedInFlight: Promise<void> | null = null;

function isDupKeyError(e: unknown): boolean {
    const msg = (e as any)?.message ?? '';
    const code = (e as any)?.code;
    return code === 201 || /Duplicate keys are not allowed/i.test(String(msg));
}

export class ProjectService extends BaseService {
    static BASE_API = import.meta.env.VITE_DATA_SOURCE_URL;
    static PROJECTS_FETCH_RATE_KEY = 'projects-fetch';

    static async ensureAndGetProjects(db: lf.Database): Promise<Project[]> {
        const projectsTable = db.getSchema().table('projects');
        const existing = await db.select().from(projectsTable).limit(1).exec();

        if (existing.length === 0) {
            if (!seedInFlight) {
                seedInFlight = ProjectService.fetchProjects(db)
                    .catch((e) => {
                        if (!isDupKeyError(e)) throw e;
                        console.warn('Seeding duplicate avoided:', e);
                    })
                    .finally(() => { seedInFlight = null; });
            }
            await seedInFlight;
        }

        return ProjectService.getProjects(db);
    }

    private static async dedupeTags(db: lf.Database): Promise<void> {
        const tagsTable = db.getSchema().table('tags');
        const projectTagsTable = db.getSchema().table('project_tags');

        const tags = await db.select().from(tagsTable).exec() as TagRow[];

        const groups = new Map<string, TagRow[]>();
        for (const t of tags) {
            const key = String(t.name ?? '').trim().toLowerCase();
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
        }

        for (const [, group] of groups) {
            if (group.length <= 1) continue;

            group.sort((a, b) => a.id - b.id);
            const keep = group[0];
            const dupes = group.slice(1);
            const dupeIds = dupes.map(d => d.id);

            if (dupeIds.length === 0) continue;

            await db
                .update(projectTagsTable)
                .set(projectTagsTable['tag_id'], keep.id)
                .where(projectTagsTable['tag_id'].in(dupeIds))
                .exec();

            await db
                .delete()
                .from(tagsTable)
                .where(tagsTable['id'].in(dupeIds))
                .exec();
        }
    }

    static async getProjectsFromGraphQL(): Promise<{
        tags: TagRow[];
        statuses: StatusRow[];
        categories: ProjectCategoryRow[];
        projects: any[];
    }> {
        const query = `
        query {
            tags {
                name
                color
                icon
                type_id
            }
            project_statuses {
                name
            }
            project_categories {
                name
            }
            projects {
                name
                description
                image
                avp
                project_link
                status_id
                project_category_id
                tags
            }
        }
    `;
        const response = await this.axiosInst.post(
            `${ProjectService.BASE_API}/graphql`,
            { query }
        );
        const data = response.data.data;
        return {
            tags: data.tags ?? [],
            statuses: data.project_statuses ?? [],
            categories: data.project_categories ?? [],
            projects: data.projects ?? [],
        };
    }

    static async fetchProjects(db: lf.Database): Promise<void> {
        await RateLimiter.throwIfLimited(ProjectService.PROJECTS_FETCH_RATE_KEY, 10, 60_000);

        let tags: TagRow[] = [];
        let projects: any[] = [];
        let statuses: StatusRow[] = [];
        let categories: ProjectCategoryRow[] = [];

        // try {
        //     const gqlRes = await this.getProjectsFromGraphQL();
        //     tags = gqlRes.tags;
        //     projects = gqlRes.projects;
        //     statuses = gqlRes.statuses;
        //     categories = gqlRes.categories;
        // } catch (e) {
        // console.warn('GraphQL fetch failed, falling back to REST API:', e);
        const [tagsRes, projectsRes] = await Promise.all([
            this.rateLimited('tags-endpoint', 5, 60_000, () =>
                this.get<{ data: TagRow[] }>(`${ProjectService.BASE_API}/tags`)
            ),
            this.rateLimited('projects-endpoint', 5, 60_000, () =>
                this.get<{ data: any[] }>(`${ProjectService.BASE_API}/projects`)
            ),
        ]);
        tags = tagsRes.data.data;
        projects = projectsRes.data.data;

        try {
            const statusesRes = await this.rateLimited('statuses-endpoint', 7, 60_000, () =>
                this.get<{ data: StatusRow[] }>(`${ProjectService.BASE_API}/project-statuses`)
            );
            statuses = statusesRes.data.data ?? [];
        } catch { statuses = []; }
        try {
            const categoriesRes = await this.rateLimited('categories-endpoint', 7, 60_000, () =>
                this.get<{ data: ProjectCategoryRow[] }>(`${ProjectService.BASE_API}/project-categories`)
            );
            categories = categoriesRes.data.data ?? [];
        } catch { categories = []; }
        // }

        await ProjectService.dedupeTags(db);

        await Promise.all([
            ProjectService.saveTags(db, tags),
            ProjectService.saveStatuses(db, statuses),
            ProjectService.saveCategories(db, categories),
            ProjectService.saveProjects(db, projects),
        ]);

        await Promise.all([
            ProjectService.saveProjectTags(db, tags, projects),
            ProjectService.saveProjectCategories(db, categories, projects),
        ]);
    }

    static async saveTags(db: lf.Database, tags: TagRow[]): Promise<void> {
        const tagsTable = db.getSchema().table('tags');
        const norm = (s: string | undefined | null) => String(s ?? '').trim().toLowerCase();

        // Resolve valid tag_type ids to satisfy FK constraint
        let existingTypeIds = new Set<number>();
        try {
            const tagTypesTable = db.getSchema().table('tag_types'); // adjust name if different
            const typeRows = await db.select(tagTypesTable['id'])
                .from(tagTypesTable)
                .exec() as { id: number }[];
            existingTypeIds = new Set(typeRows.map(r => r.id));
        } catch {
            // If tag_types table is not available, force null to avoid FK violation
            existingTypeIds = new Set<number>();
        }
        const resolveTypeId = (id: number | null | undefined) =>
            (id != null && existingTypeIds.has(id)) ? id : null;

        const existingTags = await db.select().from(tagsTable).exec() as TagRow[];
        const tagByLowerName = new Map<string, TagRow>(
            existingTags.map((t) => [norm(t.name), t])
        );

        for (const tag of tags) {
            const lower = norm(tag.name);
            const existing = tagByLowerName.get(lower);
            const safeTypeId = resolveTypeId(tag.type_id ?? null);

            if (existing) {
                await db
                    .update(tagsTable)
                    .set(tagsTable['color'], tag.color ?? null)
                    .set(tagsTable['icon'], tag.icon ?? null)
                    .set(tagsTable['type_id'], safeTypeId)
                    .where(tagsTable['id'].eq(existing.id))
                    .exec();
            } else {
                const inserted = await db
                    .insert()
                    .into(tagsTable)
                    .values([
                        tagsTable.createRow({
                            name: tag.name,
                            color: tag.color ?? null,
                            icon: tag.icon ?? null,
                            type_id: safeTypeId,
                        }),
                    ])
                    .exec();
                const row = (Array.isArray(inserted) ? inserted[0] : inserted) as TagRow;
                tagByLowerName.set(lower, row);
            }
        }
    }

    private static async saveStatuses(db: lf.Database, statuses: StatusRow[]): Promise<void> {
        const table = db.getSchema().table('project_statuses');
        if (!statuses?.length) return;

        const existing = await db.select().from(table).exec() as StatusRow[];
        const byName = new Map(existing.map(s => [s.name.toLowerCase(), s]));
        for (const s of statuses) {
            const key = s.name.toLowerCase();
            const has = byName.get(key);
            if (has) continue;
            await db.insert().into(table).values([
                table.createRow({ name: s.name })
            ]).exec();
        }
    }

    private static async saveCategories(db: lf.Database, categories: ProjectCategoryRow[]): Promise<void> {
        const table = db.getSchema().table('project_categories');
        if (!categories?.length) return;

        const existing = await db.select().from(table).exec() as ProjectCategoryRow[];
        const byName = new Map(existing.map(c => [c.name.toLowerCase(), c]));
        for (const c of categories) {
            const key = c.name.toLowerCase();
            const has = byName.get(key);
            if (has) continue;
            await db.insert().into(table).values([
                table.createRow({ name: c.name })
            ]).exec();
        }
    }

    static async saveProjects(db: lf.Database, projects: any[]): Promise<void> {
        const projectsTable = db.getSchema().table('projects');
        const existingProjects = await db.select().from(projectsTable).exec() as ProjectRow[];
        const projectByName = new Map<string, ProjectRow>(
            existingProjects.map((p) => [String(p.name), p])
        );

        for (const project of projects) {
            const existing = projectByName.get(project.name);
            if (existing) {
                await db
                    .update(projectsTable)
                    .set(projectsTable['description'], project.description ?? null)
                    .set(projectsTable['status_id'], project.status_id ?? null)
                    .set(projectsTable['image'], project.image ?? null)
                    .set(projectsTable['avp'], project.avp ?? null)
                    .set(projectsTable['project_link'], project.project_link ?? null)
                    .set(projectsTable['start_date'], project.start_date)
                    .set(projectsTable['end_date'], project.end_date ?? null)
                    .where(projectsTable['id'].eq(existing.id))
                    .exec();
            } else {
                await db
                    .insert()
                    .into(projectsTable)
                    .values([
                        projectsTable.createRow({
                            name: project.name,
                            description: project.description ?? null,
                            status_id: project.status_id ?? null,
                            image: project.image ?? null,
                            avp: project.avp ?? null,
                            project_link: project.project_link ?? null,
                            start_date: project.start_date,
                            end_date: project.end_date ?? null,
                        }),
                    ])
                    .exec();
            }
        }
    }

    static async saveProjectTags(db: lf.Database, tags: TagRow[], projects: any[]): Promise<void> {
        const tagsTable = db.getSchema().table('tags');
        const projectsTable = db.getSchema().table('projects');
        const projectTagsTable = db.getSchema().table('project_tags');
        const norm = (s: string | undefined | null) => String(s ?? '').trim().toLowerCase();

        await db.delete().from(projectTagsTable).exec();

        const dbTags = await db.select().from(tagsTable).exec() as TagRow[];
        const dbProjects = await db.select().from(projectsTable).exec() as ProjectRow[];

        const idxToLowerName = new Map<number, string>(
            tags.map((t, i) => [i + 1, norm(t.name)])
        );

        const assocRows: any[] = [];
        for (const project of projects) {
            const dbProject = dbProjects.find((p) => p.name === project.name);
            if (!dbProject) continue;

            for (const tagIdx of project.tags ?? []) {
                const lower = idxToLowerName.get(tagIdx);
                if (!lower) continue;

                const dbTag = dbTags.find((t) => norm(t.name) === lower);
                if (!dbTag) continue;

                assocRows.push(projectTagsTable.createRow({
                    project_id: dbProject.id,
                    tag_id: dbTag.id,
                }));
            }
        }

        if (assocRows.length) {
            await db
                .insertOrReplace()
                .into(projectTagsTable)
                .values(assocRows)
                .exec();
        }
    }

    private static async saveProjectCategories(db: lf.Database, _: ProjectCategoryRow[], projects: any[]): Promise<void> {
        const projectsTable = db.getSchema().table('projects');
        const categoriesTable = db.getSchema().table('project_categories');
        const joinTable = db.getSchema().table('project_project_categories');

        // Rebuild associations
        await db.delete().from(joinTable).exec();

        const dbProjects = await db.select().from(projectsTable).exec() as { id: number; name: string }[];
        const dbCategories = await db.select().from(categoriesTable).exec() as ProjectCategoryRow[];
        const catById = new Map(dbCategories.map(c => [c.id, c]));
        const catByName = new Map(dbCategories.map(c => [c.name.toLowerCase(), c]));

        const assocRows: any[] = [];
        for (const p of projects) {
            const dbProject = dbProjects.find(dp => dp.name === p.name);
            if (!dbProject) continue;

            const idSet = new Set<number>();

            // Prefer explicit ids if present
            if (Array.isArray(p.project_category_ids)) {
                for (const id of p.project_category_ids) if (catById.has(id)) idSet.add(id);
            }

            // Accept categories as strings or objects
            if (Array.isArray(p.categories)) {
                for (const c of p.categories) {
                    if (typeof c === 'number' && catById.has(c)) {
                        idSet.add(c);
                    } else if (typeof c === 'string') {
                        const hit = catByName.get(c.toLowerCase());
                        if (hit) idSet.add(hit.id);
                    } else if (c && typeof c === 'object' && 'id' in c && typeof c.id === 'number') {
                        if (catById.has(c.id)) idSet.add(c.id);
                    }
                }
            }

            for (const cid of idSet) {
                assocRows.push(joinTable.createRow({
                    project_id: dbProject.id,
                    category_id: cid,
                }));
            }
        }

        if (assocRows.length) {
            await db.insertOrReplace().into(joinTable).values(assocRows).exec();
        }
    }

    // Only query IndexedDB for projects (with tags)
    static async getProjects(db: lf.Database, opts?: { orderBy?: { column: string; desc?: boolean } }): Promise<Project[]> {
        const projectsTable = db.getSchema().table('projects');
        const tagsTable = db.getSchema().table('tags');
        const projectTagsTable = db.getSchema().table('project_tags');
        const statusesTable = db.getSchema().table('project_statuses');
        const categoriesTable = db.getSchema().table('project_categories');
        const projCatsTable = db.getSchema().table('project_project_categories');

        let baseQuery: any = db.select().from(projectsTable);
        if (opts?.orderBy?.column) {
            try {
                const col = (projectsTable as any)[opts.orderBy.column];
                if (col) {
                    baseQuery = baseQuery.orderBy(col, opts.orderBy.desc ? lf.Order.DESC : lf.Order.ASC);
                }
            } catch {
                // ignore invalid column names
            }
        }

        const [projects, allStatuses, allCategories] = await Promise.all([
            baseQuery.exec() as Promise<ProjectRow[]>,
            db.select().from(statusesTable).exec() as Promise<StatusRow[]>,
            db.select().from(categoriesTable).exec() as Promise<ProjectCategoryRow[]>,
        ]);
        const statusById = new Map(allStatuses.map(s => [s.id, s]));
        const categoryById = new Map(allCategories.map(c => [c.id, c]));

        const result: Project[] = [];
        for (const project of projects) {
            const projectTagRows = await db.select().from(projectTagsTable)
                .where(projectTagsTable.project_id.eq(project.id))
                .exec() as ProjectTagRow[];
            const tagIds = projectTagRows.map(pt => pt.tag_id);
            const tagObjs = tagIds.length
                ? await db.select().from(tagsTable).where(tagsTable.id.in(tagIds)).exec() as TagRow[]
                : [];

            const projCatRows = await db.select().from(projCatsTable)
                .where(projCatsTable.project_id.eq(project.id))
                .exec() as { category_id: number }[];
            const catIds = projCatRows.map(pc => pc.category_id);
            const cats = catIds.map(id => categoryById.get(id)).filter(Boolean) as ProjectCategoryRow[];

            result.push({
                id: project.id,
                name: project.name,
                description: project.description ?? undefined,
                image: project.image ?? undefined,
                avp: project.avp ?? undefined,
                project_link: project.project_link ?? undefined,
                status_id: project.status_id ?? undefined,
                project_category_ids: catIds,
                categories: cats,
                status: project.status_id != null ? statusById.get(project.status_id) : undefined,
                tags: tagObjs.map(tag => ({
                    id: tag.id,
                    name: tag.name ?? '',
                    color: tag.color ?? undefined,
                    icon: tag.icon ?? undefined,
                    type_id: tag.type_id ?? undefined,
                })),
                start_date: project.start_date ?? undefined,
                end_date: project.end_date ?? undefined,
            });
        }
        return result;
    }
}