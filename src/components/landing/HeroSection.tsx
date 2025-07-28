import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [height, setHeight] = useState("100vh");

  useEffect(() => {
    const handleScroll = () => {
      const minScroll = window.innerHeight * 0.1;
      const maxScroll = window.innerHeight * 0.5;
      const scrollY = window.scrollY;

      if (scrollY < minScroll) {
        setHeight("100vh");
      } else if (scrollY > maxScroll) {
        setHeight("70vh");
      } else {
        const progress = (scrollY - minScroll) / (maxScroll - minScroll);
        const newHeight = 100 - 30 * progress;
        setHeight(`${newHeight}vh`);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.section
      className='relative w-full mx-auto bg-gray-100'
      id='hero'
      animate={{ height }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{ height }}
    >
      <div className='absolute inset-0 z-10 flex items-center justify-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-700 text-center '>
            Aspiring Junior Backend Developer
          </h1>
          <div className="text-balance font-black text-5xl max-w-3xl mx-auto my-4 text-center">
            Crafting Code That Scales, Building Solutions That Last
          </div>
          <p
            className="text-center text-lg text-gray-500 font-medium mt-4"
          >
            This is Ivan Bandilla</p>
        </div>
      </div>
    </motion.section>
  )
}

export default HeroSection;