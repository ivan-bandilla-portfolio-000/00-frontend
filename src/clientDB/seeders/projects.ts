export interface TagSeed {
    name: string;
    color?: string;
    icon?: string;
    type_id?: number;
}

export interface ProjectSeed {
    name: string;
    description?: string;
    image?: string;
    avp?: string;
    source_code_link?: string;
    tags: number[];
}

export const projects: ProjectSeed[] = [
    {
        name: 'Car Rent',
        description: 'Web-based platform for car rentals.',
        image: 'carrent',
        source_code_link: 'https://github.com/',
        tags: [1, 2, 3],
    },
    {
        name: 'Car Rental',
        description: 'Web-based platform for car rentals.',
        image: 'carrent',
        source_code_link: 'https://github.com/',
        tags: [1, 2, 3],
    },
];

export const tags: TagSeed[] = [
    { name: 'react', color: 'blue-text-gradient' },
    { name: 'mongodb', color: 'green-text-gradient' },
    { name: 'tailwind', color: 'pink-text-gradient' },
];