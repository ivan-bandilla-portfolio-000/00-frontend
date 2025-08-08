import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "../../hooks/useIsMobile"; // adjust path if needed
import { TextGenerateEffect } from "../ui/text-generate-effect";
import { useTheme } from "@/features/theming/components/theme-provider";

const LightRays = lazy(() => import("@/components/blocks/backgrounds/LightRays/LightRays"));


const Background = () => {

  return (
    <Suspense fallback={null}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#00ffff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0}
        noiseAmount={0.1}
        distortion={0.05}
        className="custom-rays"
      />
    </Suspense>
  )
}

const HeroSection = () => {
  const isMobile = useIsMobile();
  const [height, setHeight] = useState(isMobile ? "50dvh" : "110dvh");
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 1200);
    return () => clearTimeout(timer);
  }, []);


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
      className='relative w-full overflow-hidden mx-auto bg-gray-100 dark:bg-gray-800 transition-colors'
      id='hero'
      animate={{ height }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{ height }}
    >
      {isDark && (<motion.div
        animate={{ height }}
        style={{ height }}
      >
        <Background />
      </motion.div>)}

      <div className='absolute inset-0 -top-12 z-10 flex items-center justify-center'>
        <div>
          <h1 className=' text-sm md:text-base lg:text-3xl 2xl:text-4xl font-bold text-gray-700 dark:text-gray-100 text-center '>
            Aspiring Junior Backend Developer
          </h1>
          <div className="text-balance font-black text-base md:text-2xl lg:text-5xl 3xl:text-6xl mx-auto my-4 text-center text-gray-900 dark:text-white">
            Crafting Code That Scales,
            <br />
            Building Solutions That Last
          </div>

          {showText ? (
            <TextGenerateEffect
              className="text-center text-xs md:text-sm lg:text-lg 2xl:text-xl text-gray-500 dark:text-gray-400 font-medium mt-4"
              words={"This is Ivan Bandilla"}
            />
          ) : (
            <div className="text-center text-xs md:text-sm lg:text-lg 2xl:text-xl text-gray-500 dark:text-gray-400 font-medium mt-4 " aria-hidden="true">
              <div className="mt-4">
                <div className="dark:text-white text-black text-2xl leading-snug tracking-wide opacity-0" >
                  This is Ivan Bandilla
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section >
  )
}

export default HeroSection;