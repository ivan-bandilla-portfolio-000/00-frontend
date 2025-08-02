import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import RobotCanvas from "@/canvas/Robot/";

const MiscRobot = () => {
    const [translateY, setTranslateY] = useState(0);

    const [sectionHeight, setSectionHeight] = useState("110dvh");
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const minScroll = window.innerHeight * 0.25;
            const maxScroll = window.innerHeight * 0.75;
            const scrollY = window.scrollY;

            if (scrollY < minScroll) {
                setTranslateY(0);
            } else if (scrollY > maxScroll) {
                setTranslateY(-100);
            } else {
                const progress = (scrollY - minScroll) / (maxScroll - minScroll);
                setTranslateY(-100 * progress);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const projects = document.getElementById("projects");
        if (!projects) return;

        const observer = new window.IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setSectionHeight("80dvh");
                } else {
                    setSectionHeight("110dvh");
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(projects);

        return () => observer.disconnect();
    }, []);

    return (
        <motion.section
            ref={sectionRef}
            className='relative w-full mx-auto z-1'
            id='misc-robot'
            animate={{ y: translateY, height: sectionHeight }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{
                marginTop: '-5vh'
            }}
        >
            <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <RobotCanvas />
            </div>
        </motion.section>
    );
};

export default MiscRobot;