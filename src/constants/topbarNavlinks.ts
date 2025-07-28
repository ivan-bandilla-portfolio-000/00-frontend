export type NavLink = {
    title: string;
    url: string;
    id: string;
};

const topbarNavLinks: NavLink[] = [
    { title: 'Hero', url: '/', id: 'hero' },
    { title: 'Projects', url: '/projects', id: 'projects' },
    { title: 'About', url: '/about', id: 'about' },
    { title: 'Contact', url: '/contact', id: 'contact' },
]

export default topbarNavLinks
