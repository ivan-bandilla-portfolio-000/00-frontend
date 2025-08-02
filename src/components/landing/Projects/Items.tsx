import { motion } from "motion/react";

import { styles } from "@/styles/js/styles";
import { github } from "@/assets";
import projects from "@/constants/projects";
import { fadeIn, textVariant } from "@/utils/motion";
import {
    CarouselItem,
} from "@/components/ui/carousel"

const ProjectCard = ({ index, name, source_code_link }) => {
    return (

        <motion.div
            className="bg-primary p-5 rounded-2xl sm:w-[480px] w-full shadow"
            variants={fadeIn('up', 'spring', Math.log(index + 1) * 0.5, 0.75)}

        >
            <div className="relative w-full h-[12dvw]">
                {/* <img src={image} alt={name} className="object-cover w-full h-full rounded-2xl" /> */}
                <div className="object-cover w-full h-full rounded-2xl" />
                <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
                    <div
                        onClick={() => window.open(source_code_link, "_blank")}
                        className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
                    >
                        <img src={github} alt="github" className="w-1/2 h-1/2 object-contain" />
                    </div>
                </div>
                {/* <h3 className="text-xl font-bold">{name}</h3> */}
            </div>
        </motion.div>

    )
}

const Items = () => {
    return (
        <>
            {projects.map((project, index) => (
                <CarouselItem key={`carousel-item-${index}`}>
                    <div className="flex flex-wrap gap-7">
                        <ProjectCard index={index} {...project} />
                    </div>
                </CarouselItem>
            ))}
        </>
    )
}

export default Items;