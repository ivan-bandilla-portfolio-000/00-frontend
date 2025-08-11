import type { Tag } from "./Tag";

export interface Project {
    id?: number;
    name: string;
    description?: string;
    image?: string;
    avp?: string;
    source_code_link?: string;
    tags?: Tag[] | number[];
}