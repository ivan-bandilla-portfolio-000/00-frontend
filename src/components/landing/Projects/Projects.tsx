import { useState, useEffect, useRef } from 'react'
import Items from './Items'
import projects from "@/constants/projects";
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

const Projects = () => {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const itemsLeft = count - (current + 1);

    const sectionRef = useRef<HTMLDivElement>(null);

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
                className="flex flex-col h-dvh justify-center pointer-events-auto"
            >
                <div className='flex items-center gap-2'>
                    <h2 className="font-black text-2xl lg:text-5xl">Projects.</h2>
                    <LinkWithIcon
                        href="/projects"
                        content="View All"
                        className='text-[0.75em]'
                        icon={<ArrowUpRight className='w-4' />}
                    />
                </div>
                <div className="flex flex-wrap lg:flex-nowrap justify-center-safe lg:justify-start gap-18 mt-16">
                    <div className="flex flex-col order-2 lg:order-1 gap-8">
                        <hgroup>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={current}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className='text-xl lg:text-3xl font-bold'
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
                                    className='mt-2 text-base lg:text-lg text-pretty text-gray-600 dark:text-gray-300'
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
                                        <span className="text-sm lg:text-base text-white dark:text-black">{tag.name}</span>
                                    </Badge>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <Carousel
                        setApi={setApi}
                        className='order-1 lg:order-2 max-w-[60svw] md:max-w-[25svw]'
                    >
                        <CarouselContent className="">
                            <Items />
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

export default SectionWrapper(Projects, "projects", { className: "bg-gray-50 dark:bg-gray-950" })