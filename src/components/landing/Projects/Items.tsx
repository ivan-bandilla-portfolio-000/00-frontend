import { motion } from "motion/react";

// import projects from "@/constants/projects";
import { fadeIn } from "@/utils/motion";
import {
    CarouselItem,
} from "@/components/ui/carousel"
import type { Project } from "@/clientDB/@types/Project";
import { getImageUrl, handleImageError } from "@/app/helpers/image";
import { ExternalLink } from "lucide-react";

interface ProjectCardProps extends Project {
    index: number;
}

const ProjectCard = ({ index, image, name, project_link }: ProjectCardProps) => {
    const isGitHub = (url?: string) => {
        if (!url) return false;
        try {
            const u = new URL(url);
            return /(^|\.)github\.com$/i.test(u.hostname) || /github\.com/i.test(url);
        } catch {
            return /github\.com/i.test(url);
        }
    };

    return (
        <motion.div
            className=" p-5 rounded-2xl lg:w-[480px] w-full h-[20svh] lg:h-auto select-none"
            variants={fadeIn('up', 'spring', Math.log(index + 1) * 0.5, 0.75)}
            initial={false}
        >
            <div className="relative w-full lg:min-h-[12dvw]">
                <img src={image}
                    alt={`${name} thumbnail`}
                    width={440} height={230}
                    className="object-cover w-full h-full rounded-2xl"
                    loading="lazy"
                    onError={(e) => {
                        void handleImageError(e.currentTarget as HTMLImageElement, {
                            fallbackOnFetchError: true,
                        });
                    }}
                />
                {project_link ? (
                    <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
                        <div
                            onClick={() => window.open(project_link, "_blank")}
                            className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
                            role="button"
                            aria-label={isGitHub(project_link) ? "Open GitHub" : "Open external link"}
                        >
                            {isGitHub(project_link) ? (
                                <img
                                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg"
                                    alt="github"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-1/2 h-1/2 object-contain"
                                />
                            ) : (
                                <ExternalLink className="w-1/2 h-1/2 text-white" />
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
};

interface ItemsProps {
    projects: Project[];
}

const Items = ({ projects }: ItemsProps) => {

    return (
        <>
            {projects.map((project, index) => (
                <CarouselItem key={`carousel-item-${index}`}>
                    <div className="flex flex-wrap gap-7">
                        <ProjectCard
                            index={index}
                            name={project.name}
                            description={project.description}
                            tags={project.tags}
                            image={getImageUrl(project.image)}
                            project_link={project.project_link}
                        />
                    </div>
                </CarouselItem>
            ))}
        </>
    );
};

export default Items;