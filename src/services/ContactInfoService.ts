import type { lf } from '@/clientDB/schema';
import { BaseService } from './BaseService';

type ContactInfoRow = {
    id: number;
    first_name: string,
    last_name: string,
    prefix: string | null,
    title: string | null,
    email: string | null;
    phone: string | null;
    linkedin_username: string | null;
    linkedin_url: string | null;
    github_username: string | null;
    github_url: string | null;
};

export type ContactInfo = {
    first_name: string,
    last_name: string,
    prefix?: string | null,
    title?: string | null,
    email?: string;
    phone?: string;
    linkedin: { username?: string; url?: string };
    github: { username?: string; url?: string };
};

// Make fields optional to reflect reality of mocks/APIs
type GqlContactInfo = {
    first_name?: string | null;
    last_name?: string | null;
    prefix?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_username?: string | null;
    linkedin_url?: string | null;
    github_username?: string | null;
    github_url?: string | null;
};

type RestContactInfo = {
    first_name?: string | null;
    last_name?: string | null;
    prefix?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    // Some REST mocks use nested, others use flat "linkedin_username"
    linkedin?: { username?: string | null; url?: string | null } | null;
    github?: { username?: string | null; url?: string | null } | null;
    linkedin_username?: string | null;
    linkedin_url?: string | null;
    github_username?: string | null;
    github_url?: string | null;
};

let seedInFlight: Promise<void> | null = null;

export class ContactInfoService extends BaseService {
    static BASE_API = import.meta.env.VITE_DATA_SOURCE_URL;

    // Coerce both GraphQL and REST shapes, ensure required strings are never undefined
    private static normalize(item: GqlContactInfo | RestContactInfo | null | undefined): ContactInfo {
        const s = (v: any) => (v == null ? '' : String(v));
        const o = <T>(v: T | null | undefined) => (v == null ? undefined : v);

        const liUser =
            (item as any)?.linkedin_username ??
            (item as any)?.linkedin?.username;
        const liUrl =
            (item as any)?.linkedin_url ??
            (item as any)?.linkedin?.url;

        const ghUser =
            (item as any)?.github_username ??
            (item as any)?.github?.username;
        const ghUrl =
            (item as any)?.github_url ??
            (item as any)?.github?.url;

        return {
            first_name: s((item as any)?.first_name),
            last_name: s((item as any)?.last_name),
            prefix: o((item as any)?.prefix),
            title: o((item as any)?.title),
            email: o((item as any)?.email),
            phone: o((item as any)?.phone),
            linkedin: { username: o(liUser), url: o(liUrl) },
            github: { username: o(ghUser), url: o(ghUrl) },
        };
    }

    static async ensureAndGet(db: lf.Database): Promise<ContactInfo | null> {
        const table = db.getSchema().table('contact_info');
        const existing = await db.select().from(table).limit(1).exec() as ContactInfoRow[];
        if (existing.length === 0) {
            if (!seedInFlight) {
                seedInFlight = this.fetchAndSave(db).finally(() => { seedInFlight = null; });
            }
            await seedInFlight;
        }
        return this.getContactInfo(db);
    }

    static async getContactInfo(db: lf.Database): Promise<ContactInfo | null> {
        const table = db.getSchema().table('contact_info');
        const rows = await db.select().from(table).limit(1).exec() as ContactInfoRow[];
        if (!rows.length) return null;
        const r = rows[0];
        return {
            first_name: r.first_name,
            last_name: r.last_name,
            prefix: r.prefix ?? undefined,
            title: r.title ?? undefined,
            email: r.email ?? undefined,
            phone: r.phone ?? undefined,
            linkedin: { username: r.linkedin_username ?? undefined, url: r.linkedin_url ?? undefined },
            github: { username: r.github_username ?? undefined, url: r.github_url ?? undefined },
        };
    }

    static async fetchAndSave(db: lf.Database): Promise<void> {
        const info = await this.fetchFromApi();
        console.log('Fetched contact info:', info);
        await this.save(db, info);
    }

    static async fetchFromApi(): Promise<ContactInfo> {

        // try {
        //     const query = `query 
        //       contact_info {
        //         first_name
        //         last_name
        //         prefix
        //         title
        //         email
        //         phone
        //         linkedin_username
        //         linkedin_url
        //         github_username
        //         github_url
        //     }`;
        //     const res = await this.axiosInst.post<{ data?: { contact_info?: GqlContactInfo | null } }>(
        //         `${this.BASE_API}/graphql`,
        //         { operationName: 'ContactInfoOnly', query, variables: {} }
        //     );
        //     const item = res.data?.data?.contact_info ?? null;
        //     if (item) return this.normalize(item);
        // } catch {
        //     // fall through
        // }

        // REST fallback
        const res = await this.rateLimited('contact-info-endpoint', 5, 60_000, () =>
            this.get<{ data?: RestContactInfo | null }>(`${this.BASE_API}/contact-info`)
        );
        return this.normalize(res.data?.data ?? null);
    }

    static async save(db: lf.Database, info: ContactInfo): Promise<void> {
        const table = db.getSchema().table('contact_info');
        await db.delete().from(table).exec();
        await db.insert().into(table).values([
            table.createRow({
                first_name: info.first_name,
                last_name: info.last_name,
                prefix: info.prefix ?? null,
                title: info.title ?? null,
                email: info.email ?? null,
                phone: info.phone ?? null,
                linkedin_username: info.linkedin?.username ?? null,
                linkedin_url: info.linkedin?.url ?? null,
                github_username: info.github?.username ?? null,
                github_url: info.github?.url ?? null,
            })
        ]).exec();
    }
}