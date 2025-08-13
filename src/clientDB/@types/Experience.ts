export interface Experience {
    id?: number;
    company: string;
    role: string;
    position: string;
    start: Date;
    end: Date;
    description?: string;
    type: string;
    hidden: boolean;
}