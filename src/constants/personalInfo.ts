type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> &
    { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

interface PersonalInfo {
    name: string;
    title: string;
    email?: string;
    phone?: string;
    location: {
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    github?: {
        username: string;
        url: string;
    };
    linkedin?: {
        username: string;
        url: string;
    };
    resume: RequireAtLeastOne<{
        driveLink?: string;
        pdfLink?: string;
        cloudPdfDocID?: string;
    }, 'driveLink' | 'pdfLink' | 'cloudPdfDocID'>;
}

const personalInfo: PersonalInfo = {
    name: "Ivan Bandilla",
    title: "Junior Backend Developer",
    location: {
        city: "Calamba",
        state: "Laguna",
        zip: "4027",
        country: "Philippines"
    },
    resume: {
        driveLink: 'https://drive.google.com/file/d/1rDkJ21vCOCThI5HO6A-2kpyX1gzXr1v3/preview',
        cloudPdfDocID: 'eee2079d-b0b6-4267-9812-b6b9eadb9c60',
    }
} as const;

export default personalInfo;
export type { PersonalInfo };