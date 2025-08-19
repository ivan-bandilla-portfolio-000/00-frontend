import { schemaBuilder, lf } from '@/clientDB/schema';
import '@/clientDB/schema/0SchemaRegistration';
import { projects, tags } from '@/clientDB/seeders/projects'
import { APP_ENV } from '@/app/config/app';


async function clearTables(db: lf.Database) {
    const projectsTable = db.getSchema().table('projects');
    const tagsTable = db.getSchema().table('tags');
    const projectTagsTable = db.getSchema().table('project_tags');
    await db.delete().from(projectTagsTable).exec();
    await db.delete().from(tagsTable).exec();
    await db.delete().from(projectsTable).exec();
}

async function seedTags(db: lf.Database) {
    const tagsTable = db.getSchema().table('tags');
    await Promise.all(
        tags.map(tag =>
            db.insertOrReplace().into(tagsTable).values([
                tagsTable.createRow({
                    name: tag.name,
                    color: tag.color ?? null,
                    icon: tag.icon ?? null,
                    type_id: tag.type_id ?? null,

                }),
            ]).exec()
        )
    );
    return await db.select().from(tagsTable).exec();
}

async function seedProjects(db: lf.Database) {
    const projectsTable = db.getSchema().table('projects');
    for (const project of projects) {
        await db.insertOrReplace().into(projectsTable).values([
            projectsTable.createRow({
                name: project.name,
                description: project.description ?? null,
                image: project.image ?? null,
                avp: project.avp ?? null,
                project_link: project.project_link ?? null,
            }),
        ]).exec();
    }
    return await db.select().from(projectsTable).exec();
}

async function seedProjectTags(db: lf.Database, allTags: any[], allProjects: any[]) {
    const projectTagsTable = db.getSchema().table('project_tags');
    for (const project of projects) {
        const dbProject = allProjects.find(p => p.name === project.name);
        if (!dbProject) continue;
        for (const tagName of project.tags ?? []) {
            const dbTag = allTags.find(t => t.name === tagName);
            if (dbTag) {
                await db.insertOrReplace().into(projectTagsTable).values([
                    projectTagsTable.createRow({
                        project_id: dbProject.id,
                        tag_id: dbTag.id,
                    }),
                ]).exec();
            }
        }
    }
}

async function seedAll(db: lf.Database) {
    await clearTables(db);
    const allTags = await seedTags(db);
    const allProjects = await seedProjects(db);
    await seedProjectTags(db, allTags, allProjects);
    if (APP_ENV === 'production') {
        setSeededCookie();
    }
}

function hasSeeded(): boolean {
    return document.cookie.includes('dbSeeded=true');
}

function setSeededCookie() {
    const oneDay = 60 * 60 * 24;
    document.cookie = `dbSeeded=true; path=/; max-age=${oneDay}`;
}

let dbInstance: lf.Database | null = null;
let dbPromise: Promise<lf.Database> | null = null;

// check if already seeded through cookies
export async function maybeSeed() {
    if (dbInstance) return dbInstance;
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
        const db = await schemaBuilder.connect();
        dbInstance = db;
        if (!hasSeeded()) {
            await seedAll(db);
        }
        return db;
    })();
    return dbPromise;
}