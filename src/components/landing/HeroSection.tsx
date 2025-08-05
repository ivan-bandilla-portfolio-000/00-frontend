import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "../../hooks/useIsMobile"; // adjust path if needed

const HeroSection = () => {
  const isMobile = useIsMobile();
  const [height, setHeight] = useState(isMobile ? "50dvh" : "110dvh");

  useEffect(() => {
    setHeight(isMobile ? "50dvh" : "110dvh");
  }, [isMobile]);

  useEffect(() => {
    const handleScroll = () => {
      const minScroll = window.innerHeight * 0.1;
      const maxScroll = window.innerHeight * 0.5;
      const scrollY = window.scrollY;

      if (scrollY < minScroll) {
        setHeight(isMobile ? "50dvh" : "110dvh");
      } else if (scrollY > maxScroll) {
        setHeight(isMobile ? "35dvh" : "70dvh");
      } else {
        const progress = (scrollY - minScroll) / (maxScroll - minScroll);
        const start = isMobile ? 50 : 100;
        const end = isMobile ? 35 : 70;
        const newHeight = start - (start - end) * progress;
        setHeight(`${newHeight}dvh`);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  return (
    <motion.section
      className='relative w-full mx-auto bg-gray-100 dark:bg-gray-800 transition-colors'
      id='hero'
      animate={{ height }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{ height }}
    >
      <div className='absolute inset-0 z-10 flex items-center justify-center'>
        <div>
          <h1 className=' text-sm md:text-base lg:text-3xl 2xl:text-4xl font-bold text-gray-700 dark:text-gray-100 text-center '>
            Aspiring Junior Backend Developer
          </h1>
          <div className="text-balance font-black text-base md:text-2xl lg:text-5xl 3xl:text-6xl mx-auto my-4 text-center text-gray-900 dark:text-white">
            Crafting Code That Scales,
            <br />
            Building Solutions That Last
          </div>
          <p
            className="text-center text-xs md:text-sm lg:text-lg 2xl:text-xl text-gray-500 dark:text-gray-400 font-medium mt-4"
          >
            This is Ivan Bandilla
          </p>
        </div>
      </div>
    </motion.section >
  )
}

export default HeroSection;