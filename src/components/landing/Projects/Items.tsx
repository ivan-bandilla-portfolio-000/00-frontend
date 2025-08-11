import { motion } from "motion/react";

import { github } from "@/assets";
// import projects from "@/constants/projects";
import { fadeIn } from "@/utils/motion";
import {
    CarouselItem,
} from "@/components/ui/carousel"
import type { Project } from "@/clientDB/@types/Project";

interface ProjectCardProps extends Project {
    index: number;
}

const ProjectCard = ({ index, source_code_link }: ProjectCardProps) => (
    <motion.div
        className="bg-primary p-5 rounded-2xl lg:w-[480px] w-full h-[20svh] lg:h-auto shadow"
        variants={fadeIn('up', 'spring', Math.log(index + 1) * 0.5, 0.75)}
    >
        <div className="relative w-full h-[12dvw]">
            {/* <img src={image} alt={name} className="object-cover w-full h-full rounded-2xl" /> */}
            <div className="object-cover w-full h-full rounded-2xl" />
            {source_code_link ? (
                <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
                    <div
                        onClick={() => window.open(source_code_link, "_blank")}
                        className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
                    >
                        <img src={github} alt="github" loading="lazy" decoding="async" className="w-1/2 h-1/2 object-contain" />
                    </div>
                </div>
            ) : ""}
        </div>
    </motion.div>
);

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
                            image={project.image}
                            source_code_link={project.source_code_link}
                        />
                    </div>
                </CarouselItem>
            ))}
        </>
    );
};

export default Items;