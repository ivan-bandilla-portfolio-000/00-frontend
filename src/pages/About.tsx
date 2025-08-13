import type { TechStack } from "@/clientDB/@types/TechStack";
import { useClientDB } from "@/clientDB/context";
import CTA2 from "@/components/mvpblocks/cta-2";
import ExperienceCard from "@/components/ui/custom/ExperienceCard";
import ProjectsCard, { type ProjectCardProps } from "@/components/ui/custom/ProjectsCard";
import { InfiniteMovingBadges } from "@/components/ui/infinite-moving-badge";
import { SectionWrapper } from "@/hoc";
import { ExperienceService } from "@/services/ExperienceService";
import { ProjectService } from "@/services/ProjectService";
import { TechStackService } from "@/services/TechStackService";
import { useEffect, useState } from "react";
import type { ExperienceRow } from "@/services/ExperienceService";
import type { Project } from "@/clientDB/@types/Project";

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

const SkillsStack = () => {
    const clientDb = useClientDB();
    const [techStack, setTechStack] = useState<TechStack[]>([]);

    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        TechStackService.ensureAndGetTechStack(clientDb)
            .then((rows) => {
                if (!cancelled) setTechStack(rows);
            })
            .catch(console.error);
        return () => { cancelled = true; };
    }, [clientDb]);

    return (
        <div className="my-6 pointer-events-auto">
            <h2 className="text-center">
                Tech Stacks
            </h2>
            <InfiniteMovingBadges
                items={techStack.map(item => ({
                    content: item.content,
                    icon: <img src={item.icon} alt={item.content} className="w-4 h-4" />,
                }))}
                direction="left"
                speed="normal"
                badgeVariant="outline"
                badgeClassName="rounded-full "
            />
        </div>
    );
}

const Experience = () => {
    const clientDb = useClientDB();
    const [items, setItems] = useState<ExperienceRow[]>([]);

    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        ExperienceService.ensureAndGetExperiences(clientDb)
            .then((rows) => {
                if (!cancelled) setItems(rows.filter(i => !i.hidden));
            })
            .catch(console.error);
        return () => { cancelled = true; };
    }, [clientDb]);

    return (
        <>
            <h2>Experience</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
                {items.map((item, idx) => (
                    <ExperienceCard key={`${item.company}-${idx}`} item={item} />
                ))}
            </div>
        </>
    );
};

const Projects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
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
                {projects.map((project, idx) => {
                    const normalized: ProjectCardProps["project"] = {
                        name: project.name,
                        description: project.description,
                        image: project.image,
                        avp: project.avp,
                        source_code_link: project.source_code_link,
                        // Ensure Tags[] for the card; fallback to [] if numbers/undefined
                        tags:
                            Array.isArray(project.tags) &&
                                (project.tags.length === 0 || typeof (project.tags[0] as any)?.id === "number")
                                ? (project.tags as any)
                                : [],
                    };
                    return (
                        <ProjectsCard key={project.name + idx} project={normalized} />
                    );
                })}
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