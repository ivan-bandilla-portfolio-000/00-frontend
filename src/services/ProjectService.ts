import { BaseService } from '@/services/BaseService';
import type { Project } from "@/clientDB/@types/Project";
import { projects as mockProjects, tags as mockTags } from "@/clientDB/seeders/projects";
import type { lf } from '@/clientDB/schema';

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
    source_code_link: string | null;
};

type ProjectTagRow = {
    project_id: number;
    tag_id: number;
};

let seedInFlight: Promise<void> | null = null;

function isDupKeyError(e: unknown): boolean {
    const msg = (e as any)?.message ?? '';
    const code = (e as any)?.code;
    return code === 201 || /Duplicate keys are not allowed/i.test(String(msg));
}

export class ProjectService extends BaseService {
    static BASE_API = import.meta.env.VITE_DATA_SOURCE_URL;

    static async ensureAndGetProjects(db: lf.Database): Promise<Project[]> {
        const projectsTable = db.getSchema().table('projects');
        const existing = await db.select().from(projectsTable).limit(1).exec();

        if (existing.length === 0) {
            if (!seedInFlight) {
                seedInFlight = ProjectService.fetchProjects(db)
                    .catch((e) => {
                        // Ignore dup errors caused by StrictMode double-seed
                        if (!isDupKeyError(e)) throw e;
                        console.warn('Seeding duplicate avoided:', e);
                    })
                    .finally(() => { seedInFlight = null; });
            }
            await seedInFlight;
        }

        return ProjectService.getProjects(db);
    }

    // Always fetch from API (mocked here), then save to IndexedDB
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

            // Keep the oldest (smallest id) as canonical
            group.sort((a, b) => a.id - b.id);
            const keep = group[0];
            const dupes = group.slice(1);
            const dupeIds = dupes.map(d => d.id);

            if (dupeIds.length === 0) continue;

            // Repoint associations
            await db
                .update(projectTagsTable)
                .set(projectTagsTable['tag_id'], keep.id)
                .where(projectTagsTable['tag_id'].in(dupeIds))
                .exec();

            // Remove duplicate tag rows
            await db
                .delete()
                .from(tagsTable)
                .where(tagsTable['id'].in(dupeIds))
                .exec();
        }
    }

    static async getProjectsFromGraphQL(): Promise<{ tags: TagRow[]; projects: any[] }> {
        const query = `
        query {
            tags {
                id
                name
                color
                icon
                type_id
            }
            projects {
                name
                description
                image
                avp
                source_code_link
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
            tags: data.tags,
            projects: data.projects,
        };
    }

    // Always fetch from API (mocked here), then save to IndexedDB
    static async fetchProjects(db: lf.Database): Promise<void> {
        let tags: TagRow[] = [];
        let projects: any[] = [];

        // Try GraphQL first
        try {
            const gqlRes = await this.getProjectsFromGraphQL();
            tags = gqlRes.tags;
            projects = gqlRes.projects;
        } catch (e) {
            console.warn('GraphQL fetch failed, falling back to REST API:', e);
            const tagsRes = await this.get<{ data: TagRow[] }>(`${ProjectService.BASE_API}/tags`);
            const projectsRes = await this.get<{ data: any[] }>(`${ProjectService.BASE_API}/projects`);
            tags = tagsRes.data.data;
            projects = projectsRes.data.data;
        }

        await ProjectService.dedupeTags(db);
        await ProjectService.saveTags(db, tags);
        await ProjectService.saveProjects(db, projects);
        await ProjectService.saveProjectTags(db, tags, projects);
    }

    static async saveTags(db: lf.Database, tags: TagRow[]): Promise<void> {
        const tagsTable = db.getSchema().table('tags');
        const norm = (s: string | undefined | null) => String(s ?? '').trim().toLowerCase();

        const existingTags = await db.select().from(tagsTable).exec() as TagRow[];
        const tagByLowerName = new Map<string, TagRow>(
            existingTags.map((t) => [norm(t.name), t])
        );

        for (const tag of tags) {
            const lower = norm(tag.name);
            const existing = tagByLowerName.get(lower);

            if (existing) {
                await db
                    .update(tagsTable)
                    .set(tagsTable['color'], tag.color ?? null)
                    .set(tagsTable['icon'], tag.icon ?? null)
                    .set(tagsTable['type_id'], tag.type_id ?? null)
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
                            type_id: tag.type_id ?? null,
                        }),
                    ])
                    .exec();
                const row = (Array.isArray(inserted) ? inserted[0] : inserted) as TagRow;
                tagByLowerName.set(lower, row);
            }
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
                    .set(projectsTable['image'], project.image ?? null)
                    .set(projectsTable['avp'], project.avp ?? null)
                    .set(projectsTable['source_code_link'], project.source_code_link ?? null)
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
                            image: project.image ?? null,
                            avp: project.avp ?? null,
                            source_code_link: project.source_code_link ?? null,
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

    // Only query IndexedDB for projects (with tags)
    static async getProjects(db: lf.Database): Promise<Project[]> {
        const projectsTable = db.getSchema().table('projects');
        const tagsTable = db.getSchema().table('tags');
        const projectTagsTable = db.getSchema().table('project_tags');

        const projects = await db.select().from(projectsTable).exec() as ProjectRow[];

        const result: Project[] = [];
        for (const project of projects) {
            // Get tag_ids for this project
            const projectTagRows = await db
                .select()
                .from(projectTagsTable)
                .where(projectTagsTable.project_id.eq(project.id))
                .exec() as ProjectTagRow[];

            const tagIds = projectTagRows.map((pt) => pt.tag_id);
            let tagObjs: TagRow[] = [];
            if (tagIds.length > 0) {
                tagObjs = await db
                    .select()
                    .from(tagsTable)
                    .where(tagsTable.id.in(tagIds))
                    .exec() as TagRow[];
            }

            result.push({
                name: project.name,
                description: project.description ?? undefined,
                image: project.image ?? undefined,
                avp: project.avp ?? undefined,
                source_code_link: project.source_code_link ?? undefined,
                tags: tagObjs.map(tag => ({
                    id: tag.id,
                    name: tag.name ?? '',
                    color: tag.color ?? undefined,
                    icon: tag.icon ?? undefined,
                    type_id: tag.type_id ?? undefined,
                })),
            });
        }
        return result;
    }
}