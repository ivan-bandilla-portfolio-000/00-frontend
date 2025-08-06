export interface TagSeed {
    name: string;
    color?: string;
    icon?: string;
    typeId?: number;
}

export interface ProjectSeed {
    name: string;
    description?: string;
    image?: string;
    avp?: string;
    sourceCodeLink?: string;
    tags: string[];
}

export const projects: ProjectSeed[] = [
    {
        name: 'Car Rent',
        description: 'Web-based platform for car rentals.',
        image: 'carrent',
        sourceCodeLink: 'https://github.com/',
        tags: ['react', 'mongodb', 'tailwind'],
    },
];

export const tags: TagSeed[] = [
    { name: 'react', color: 'blue-text-gradient' },
    { name: 'mongodb', color: 'green-text-gradient' },
    { name: 'tailwind', color: 'pink-text-gradient' },
];