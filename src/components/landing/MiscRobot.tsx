import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RobotCanvas from "@/canvas/Robot";

const MiscRobot = () => {
    const [translateY, setTranslateY] = useState(0);

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

    return (
        <motion.section
            className='relative w-full h-[90vh] mx-auto z-1'
            id='hero'
            animate={{ y: translateY }}
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