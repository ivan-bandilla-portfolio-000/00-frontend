import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import RobotCanvas from "@/canvas/Robot/";
import { useIsMobile } from "@/hooks/useIsMobile"; // <-- import the hook

const MiscRobot = () => {
    const [sectionHeight, setSectionHeight] = useState("110dvh");
    const sectionRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile(); // <-- use the hook

    // Set initial height on mount and when isMobile changes
    useEffect(() => {
        setSectionHeight(isMobile ? "70dvh" : "100lvh");
    }, [isMobile]);

    return (
        <motion.section
            ref={sectionRef}
            className='relative w-full mx-auto z-1 bg-gray-200 dark:bg-gray-900'
            id='misc-robot'
            animate={{ height: sectionHeight }}
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