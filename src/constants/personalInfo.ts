interface PersonalInfo {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: {
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    github: {
        username: string;
        url: string;
    };
    linkedin: {
        username: string;
        url: string;
    };
}

const personalInfo: PersonalInfo = {
    name: "Ivan Bandilla",
    title: "Junior Backend Developer",
    email: "your.email@example.com",
    phone: "123-456-7890",
    location: {
        city: "Your City",
        state: "Your State",
        zip: "12345",
        country: "Your Country"
    },
    github: {
        username: "yourusername",
        url: "https://github.com/yourusername"
    },
    linkedin: {
        username: "yourlinkedinusername",
        url: "https://www.linkedin.com/in/yourlinkedinusername"
    },
} as const;

export default personalInfo;
export type { PersonalInfo };