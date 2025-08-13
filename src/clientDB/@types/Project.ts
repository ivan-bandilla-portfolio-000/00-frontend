import type { ProjectCategory } from "./ProjectCategory";
import type { Status } from "./ProjectStatus";
import type { Tag } from "./Tag";

export interface Project {
    id?: number;
    name: string;
    description?: string;
    image?: string;
    avp?: string;
    source_code_link?: string;
    status_id?: number;
    project_category_ids?: number[];
    status?: Status;
    categories?: ProjectCategory[];
    tags?: Tag[] | number[];
}