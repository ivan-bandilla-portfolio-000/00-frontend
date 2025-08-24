import type { ProjectCategory } from "./ProjectCategory";
import type { Status } from "./ProjectStatus";
import type { Tag } from "./Tag";

export interface Project {
    id?: number;
    name: string;
    role_id: number;
    role: { id: number; name: string } | null;
    description?: string;
    image?: string;
    avp?: string;
    project_link?: string;
    status_id?: number;
    project_category_ids?: number[];
    status?: Status;
    categories?: ProjectCategory[];
    tags?: Tag[] | number[];
    start_date?: string;
    end_date?: string | null;
}