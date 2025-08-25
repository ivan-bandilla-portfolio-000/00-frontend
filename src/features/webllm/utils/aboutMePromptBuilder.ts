import type { ContactInfo } from '@/services/ContactInfoService';
import type { ExperienceRow } from '@/services/ExperienceService';
import type { TechStackRow } from '@/services/TechStackService';
import type { Project } from '@/clientDB/@types/Project';
import { aboutMeBaseTemplate } from '../constants/webLLM';

interface BuildArgs {
    contact?: ContactInfo | null;
    experiences?: ExperienceRow[] | null;
    techStack?: TechStackRow[] | null;
    projects?: Project[] | null;
    maxProjects?: number;
}

function listOrPlaceholder(items: string[] | undefined, placeholder = 'None provided'): string {
    if (!items || !items.length) return placeholder;
    return items.map(i => `- ${i}`).join('\n');
}

function getLocationString(contact?: ContactInfo | null): string {
    if (!contact) return 'Austin, Texas';
    // prefer nested location object
    const loc = (contact as any).location;
    if (loc && (loc.city || loc.state || loc.country)) {
        return [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
    }
    // fall back to flat fields if present
    const parts = [
        (contact as any).city,
        (contact as any).state,
        (contact as any).country
    ].filter(Boolean);
    if (parts.length) return parts.join(', ');
    return '';
}

export function buildAboutMeInstruction({
    contact,
    experiences,
    techStack,
    projects,
    maxProjects = 5
}: BuildArgs): string {

    const fullName = [contact?.prefix, contact?.first_name, contact?.last_name].filter(Boolean).join(' ').trim() || 'An unnamed professional';
    const titlePrefix = [contact?.prefix, contact?.title].filter(Boolean).join(' / ') || 'Not specified';

    // Derive location if any field hints (not provided in services; allow override via title field pattern)
    const location = getLocationString(contact);

    // Experiences summary
    const expLines: string[] = [];
    if (experiences?.length) {
        for (const e of experiences) {
            const range = formatDateRange(e.start, e.end);
            const roleName = e.role?.name || e.position;
            expLines.push(`- ${roleName} at ${e.company} (${range})${e.description ? `: ${truncate(e.description, 120)}` : ''}`);
        }
    }

    // Tech stack
    const techLines = techStack?.map(t => `- ${t.content}${t.icon ? ` (${t.icon})` : ''}`) ?? [];

    // Projects section
    const projLines: string[] = [];
    if (projects?.length) {
        for (const p of projects.slice(0, maxProjects)) {
            const tags = (p.tags ?? []).map(t => {
                if (t && typeof t === 'object' && 'name' in t) {
                    return String((t as any).name);
                }
                return String(t);
            }).filter(Boolean);
            projLines.push(`- ${p.name}${tags.length ? ` [${tags.join(', ')}]` : ''}${p.description ? `: ${truncate(p.description, 140)}` : ''}`);
        }
    }

    let prompt = aboutMeBaseTemplate
        .replace('{{FULL_NAME}}', fullName)
        .replace('{{LOCATION}}', location)
        .replace('{{TITLE_PREFIX}}', titlePrefix)
        .replace('{{TECH_STACK_LIST}}', listOrPlaceholder(techLines))
        .replace('{{EXPERIENCES_SECTION}}', listOrPlaceholder(expLines))
        .replace('{{PROJECTS_SECTION}}', listOrPlaceholder(projLines))

    console.log('Built About Me prompt:', prompt);
    return prompt;
}

function truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max - 1).trimEnd() + '…';
}

function formatDateRange(start: Date, end?: Date | null) {
    const s = fmt(start);
    const e = end ? fmt(end) : 'Present';
    return `${s} - ${e}`;
}

function fmt(d: Date) {
    try {
        return new Date(d).toISOString().slice(0, 10);
    } catch {
        return 'Unknown';
    }
}