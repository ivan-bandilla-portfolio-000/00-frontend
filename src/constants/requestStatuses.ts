export interface RequestStatus {
    id: string; // Use string for better readability
    label: string;
    weight: number; // Progress weight (0-100)
}

export const REQUEST_STATUSES: RequestStatus[] = [
    {
        id: "initializing",
        label: "Initializing",
        weight: 10,
    },
    {
        id: "validating",
        label: "Validating",
        weight: 10,
    },
    {
        id: "filtering_profanity",
        label: "Filtering Profanity",
        weight: 30,
    },
    {
        id: "processing",
        label: "Processing",
        weight: 60,
    },
    {
        id: "cancelled",
        label: "Cancelled",
        weight: 0,
    },
    {
        id: "ready",
        label: "Ready",
        weight: 100,
    },
    {
        id: "error",
        label: "Error",
        weight: 0,
    },
];

export function getRequestStatusById(id: string): RequestStatus | undefined {
    return REQUEST_STATUSES.find(status => status.id === id);
}