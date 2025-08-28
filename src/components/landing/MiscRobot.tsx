import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import ThreeErrorBoundary from "../errors/ThreeErrorBoundary";
import SimpleLoader from "../SimpleLoader";

const RobotCanvas = lazy(() => import("@/canvas/Robot/"));

const MiscRobot = () => {
    const [sectionHeight, setSectionHeight] = useState("110dvh");
    const sectionRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

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
                <ThreeErrorBoundary>
                    <Suspense fallback={<SimpleLoader />}>
                        <RobotCanvas />
                    </Suspense>
                </ThreeErrorBoundary>
            </div>
        </motion.section>
    );
};

export default MiscRobot;