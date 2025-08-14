import { useState, useEffect, useRef } from 'react'
import Items from './Items'
// import projects from "@/constants/projects";
import { SectionWrapper } from "@/hoc";
import type { CarouselApi } from "@/components/ui/carousel";
import { AnimatePresence, motion } from "motion/react";
import { textVariant } from "@/utils/motion";
import {
    Carousel,
    CarouselContent,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import LinkWithIcon from '@/components/ui/custom/LinkWithIcon';
import { ProjectService } from "@/services/ProjectService";
import type { Project } from "@/clientDB/@types/Project";
import { useClientDB } from '@/clientDB/context';
import type { Tag } from "@/clientDB/@types/Tag";

const Projects = () => {
    const [carouselAPi, setCarouselAPi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const [projects, setProjects] = useState<Project[]>([]);
    const itemsLeft = count - (current + 1);

    const sectionRef = useRef<HTMLDivElement>(null);
    const clientDb = useClientDB();

    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        ProjectService.ensureAndGetProjects(clientDb)
            .then((data) => { if (!cancelled) setProjects(data); })
            .catch(console.error);
        return () => { cancelled = true; };
    }, [clientDb]);

    useEffect(() => {
        if (!carouselAPi) {
            return
        }

        setCount(carouselAPi.scrollSnapList().length)
        setCurrent(carouselAPi.selectedScrollSnap())

        carouselAPi.on("select", () => {
            setCurrent(carouselAPi.selectedScrollSnap())
        })
    }, [carouselAPi])


    return (
        <>
            <motion.div
                ref={sectionRef}
                variants={textVariant(0)}
                className="flex flex-col h-dvh justify-center pointer-events-auto"
            >
                <div className='flex items-center gap-2'>
                    <h2 className="font-black poppins-text text-2xl lg:text-5xl">Projects.</h2>
                    <LinkWithIcon
                        href="/projects"
                        content="View All"
                        className='text-[0.75em]'
                        icon={<ArrowUpRight className='w-4' />}
                    />
                </div>
                <div className="flex flex-wrap lg:flex-nowrap justify-center-safe lg:justify-start gap-18 mt-16 ">
                    <div className="flex flex-col order-2 lg:order-1 flex-1 gap-8">
                        <hgroup>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={current}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className='text-xl lg:text-3xl font-bold select-none'
                                >
                                    {projects[current]?.name}
                                </motion.h3>
                            </AnimatePresence>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={current + "-desc"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                    className='mt-2 text-base lg:text-lg text-pretty text-gray-600 dark:text-gray-300 select-none'
                                >
                                    {projects[current]?.description}
                                </motion.p>
                            </AnimatePresence>
                        </hgroup>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current + "-tags"}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="flex justify-self-end w-full gap-2"
                            >
                                {projects[current]?.tags
                                    ?.filter((t): t is Tag => typeof t !== 'number')
                                    .map((tag, index) => (
                                        <Badge className='bg-black dark:bg-white' key={index}>
                                            <span className="text-sm lg:text-base text-white dark:text-black select-none">
                                                {tag.name}
                                            </span>
                                        </Badge>
                                    ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <Carousel
                        setApi={setCarouselAPi}
                        className='order-1 lg:order-2 max-w-[60svw] md:max-w-[25svw]'
                    >
                        <CarouselContent className="">
                            <Items projects={projects} />
                        </CarouselContent>
                        <CarouselPrevious className="enabled:scale-105 lg:enabled:scale-125 disabled:pointer-events-none transition-transform touch-manipulation" />
                        <CarouselNext className="enabled:scale-105 lg:enabled:scale-125 disabled:pointer-events-none transition-transform touch-manipulation" />
                        <div className="flex justify-end mt-1 px-4">
                            {(
                                <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-300">
                                    {itemsLeft > 0 ? `${itemsLeft} more` : '\u00A0'}
                                </span>
                            )}
                        </div>
                    </Carousel>
                </div>
            </motion.div>
        </>

    )
}

export default SectionWrapper(Projects, "projects", {
    className: "bg-gray-50 dark:bg-gray-950",
    renderAnchor: false,
})