import { useClientDB } from "@/clientDB/context";
import CTA2 from "@/components/mvpblocks/cta-2";
import ExperienceCard from "@/components/ui/custom/ExperienceCard";
import ProjectsCard from "@/components/ui/custom/ProjectsCard";
import { InfiniteMovingBadges } from "@/components/ui/infinite-moving-badge";
import { SectionWrapper } from "@/hoc";
import { ProjectService } from "@/services/ProjectService";
import { useEffect, useState } from "react";

const Intro = () => {
    const description = () => {
        return (
            <>
                <p>I'm a junior backend developer specializing in web application development with a focus on performance optimization and data integrity.</p>
                <br />
                <p>As a self-taught junior developer, I bring expertise in content delivery optimization, database management, and performance tuning while eagerly exploring modern architectures for scalability and maintainability. I'm passionate about building secure systems and actively learning emerging technologies while continuously expanding my technical skill set particularly in automation and networking.</p>
            </>
        )
    }


    return (
        <>
            <CTA2
                title={{
                    level: 2, text: "About Ivan",
                    props: { className: "text-sm sm:text-sm md:text-sm" }
                }}
                description={description()}
            />
        </>
    )
};

const techStack = [
    {
        content: "PHP",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" alt="PHP" className="w-4 h-4" />,
    },
    {
        content: "Laravel",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg" alt="Laravel" className="w-4 h-4" />,
    },
    {
        content: "Javascript",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="Javascript" className="w-4 h-4" />
    },
    {
        content: "Vue.js",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" alt="Vue.js" className="w-4 h-4" />
    },
    {
        content: "Bootstrap",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" alt="Bootstrap" className="w-4 h-4" />
    },
    {
        content: "Tailwind CSS",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" className="w-4 h-4" />
    },
    {
        content: "MySQL",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt="MySQL" className="w-4 h-4" />
    },
    {
        content: "PostgreSQL",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" className="w-4 h-4" />
    },
    {
        content: "Docker",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" className="w-4 h-4" />
    },
    {
        content: "n8n",
        icon: <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/N8n-logo-new.svg" alt="n8n" className="w-4 h-4" />
    },
    {
        content: "Premiere Pro",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-original.svg" alt="Premiere Pro" className="w-4 h-4" />
    },
    {
        content: "After Effects",
        icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-original.svg" alt="After Effects" className="w-4 h-4" />
    },
];

const SkillsStack = () => (
    <div className="my-6 pointer-events-auto">
        <h2 className="text-center">
            Tech Stacks
        </h2>
        <InfiniteMovingBadges
            items={techStack}
            direction="left"
            speed="normal"
            badgeVariant="outline"
            badgeClassName="rounded-full "
        />
    </div>
);

const experienceData = {
    title: "Experience",
    items: [
        {
            company: "Company A",
            role: "Frontend Developer",
            position: "Intern",
            start: new Date("2020-01-01"),
            end: new Date("2021-12-31"),
            description: "Worked on various frontend projects using React and Tailwind CSS.",
            tags: [1, 2],
            type: "academic",
            hidden: true
        },
        {
            company: "Company B",
            role: "Backend Developer",
            position: "Intern",
            start: new Date("2019-01-01"),
            end: new Date("2019-12-31"),
            description: "Developed RESTful APIs using Laravel and PHP.",
            tags: [1, 2, 3],
            type: "academic",
            hidden: false
        },
        {
            company: "Company C",
            role: "Full Stack Developer",
            position: "Intern",
            start: new Date("2021-01-01"),
            end: new Date("2021-12-31"),
            description: "Worked on both frontend and backend development using MERN stack.",
            tags: [1, 2, 3],
            type: "academic",
            hidden: false
        }
    ]
}

const Experience = () => {
    const items = experienceData.items.filter((i) => !i.hidden);
    return (
        <>
            <h2>{experienceData.title}</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
                {items.map((item, idx) => (
                    <ExperienceCard key={`${item.company}-${idx}`} item={item} />
                ))}
            </div>
        </>
    );
};

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const clientDb = useClientDB();

    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        ProjectService.ensureAndGetProjects(clientDb)
            .then((data) => { if (!cancelled) setProjects(data); })
            .catch(console.error);
        return () => { cancelled = true; };
    }, [clientDb]);

    return (
        <>
            <h2>Projects</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
                {projects.map((project, idx) => (
                    <ProjectsCard key={project.name + idx} project={project} />
                ))}
            </div>
        </>
    );
};

// Wrap Intro with SectionWrapper
const WrappedIntro = SectionWrapper(Intro, "about-intro");
const WrappedSkillsStack = SectionWrapper(SkillsStack, "about-skills", { className: "-mt-24" });
const WrappedExperience = SectionWrapper(Experience, "about-experience");
const WrappedProjects = SectionWrapper(Projects, "about-projects");

const About = () => {
    return (
        <div>
            <WrappedIntro />
            <WrappedSkillsStack />
            <WrappedExperience />
            <WrappedProjects />
        </div>
    )
}

export default About;