type AnchorNavLink = {
    title: string;
    baseUrl: string;
    id?: string;
    type: 'anchor';
    url?: never;
};

type InternalOrExternalNavLink = {
    title: string;
    url: string;
    type: 'internal' | 'external';
    baseUrl?: never;
    id?: string;
};

export type NavLink = AnchorNavLink | InternalOrExternalNavLink;

const topbarNavLinks: NavLink[] = [
    { title: 'Hero', baseUrl: '/', id: 'hero', type: 'anchor' },
    { title: 'Projects', baseUrl: '/', id: 'projects', type: 'anchor' },
    { title: 'About', url: '/about', type: 'internal' },
    { title: 'Contact', url: '/contact', type: 'internal' },
];

export default topbarNavLinks;