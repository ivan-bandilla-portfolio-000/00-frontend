import { useState, useEffect, useRef } from 'react'
import Items from './Items'
import projects from "@/constants/projects";
import { SectionWrapper } from "@/hoc";
import type { CarouselApi } from "@/components/ui/carousel";
import { AnimatePresence, motion } from "motion/react";
import { textVariant } from "@/utils/motion";
import { styles } from "@/styles/js/styles";
import {
    Carousel,
    CarouselContent,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import LinkWithIcon from '@/components/ui/custom/LinkWithIcon';

const Projects = () => {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const itemsLeft = count - (current + 1);

    const [translateY, setTranslateY] = useState(0);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ref = sectionRef.current;
        if (!ref) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.intersectionRatio < 0.10) {
                    setTranslateY(-10);
                } else {
                    setTranslateY(0);
                }
            },
            { threshold: [0.10] }
        );

        observer.observe(ref);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])


    return (
        <>
            <motion.div
                ref={sectionRef}
                variants={textVariant(0)}
                animate={{ y: translateY }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-dvh justify-center pointer-events-auto"
            >
                <div className='flex items-center gap-2'>
                    <h2 className={styles.sectionHeadText}>Projects.</h2>
                    <LinkWithIcon
                        href="/projects"
                        content="View All"
                        icon={<ArrowUpRight className='w-4' />}
                    />
                </div>
                <div className="flex gap-18 mt-16">
                    <div className="flex flex-col gap-8">
                        <hgroup>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={current}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className='text-3xl font-bold'
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
                                    className='mt-2 text-lg text-pretty text-gray-600 dark:text-gray-300'
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
                                {projects[current]?.tags?.map((tag, index) => (
                                    <Badge className='bg-black dark:bg-white' key={index}>
                                        <span className="text-sm text-white dark:text-black">{tag.name}</span>
                                    </Badge>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <Carousel
                        setApi={setApi}
                        className=' max-w-[25svw]'
                    >
                        <CarouselContent className="">
                            <Items />
                        </CarouselContent>
                        <CarouselPrevious className="enabled:scale-125 transition-transform" />
                        <CarouselNext className="enabled:scale-125 transition-transform" />
                        <div className="flex justify-end mt-1 px-4">
                            {(
                                <span className="text-sm text-gray-500 dark:text-gray-300">
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

export default SectionWrapper(Projects, "projects", { className: "bg-gray-50 dark:bg-gray-950" })