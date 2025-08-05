import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import RobotCanvas from "@/canvas/Robot/";
import { useIsMobile } from "@/hooks/useIsMobile"; // <-- import the hook

const MiscRobot = () => {
    const [translateY, setTranslateY] = useState(0);
    const [sectionHeight, setSectionHeight] = useState("110dvh");
    const sectionRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile(); // <-- use the hook

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
                    setSectionHeight(isMobile ? "70dvh" : "80dvh");
                } else {
                    setSectionHeight(isMobile ? "70dvh" : "110dvh");
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(projects);

        return () => observer.disconnect();
    }, [isMobile]); // <-- depend on isMobile

    // Set initial height on mount and when isMobile changes
    useEffect(() => {
        setSectionHeight(isMobile ? "70dvh" : "110dvh");
    }, [isMobile]);

    return (
        <motion.section
            ref={sectionRef}
            className='relative w-full mx-auto z-1 bg-gray-200 dark:bg-gray-900'
            id='misc-robot'
            animate={{ height: sectionHeight }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{
                marginTop: '-5vh'
            }}
        >
            <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <RobotCanvas translateY={translateY} />
            </div>
        </motion.section>
    );
};

export default MiscRobot;