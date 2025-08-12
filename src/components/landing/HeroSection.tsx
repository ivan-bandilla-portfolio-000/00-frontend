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

const FeaturedTechStack = () => {
  const [techStack, setTechStack] = useState<
    { name: string; icon: string; alt: string; width?: number; height?: number, className?: string }[]
  >([]);

  const [imagesLoaded, setImagesLoaded] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setTechStack([
        {
          name: "Laravel",
          icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg",
          alt: "Laravel Icon",
        },
        {
          name: "PHP",
          icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
          alt: "PHP Icon",
          className: "ml-2 scale-150"
        },
      ]);
    }, 800);
  }, []);

  const handleImageLoad = () => {
    setImagesLoaded((count) => count + 1);
  };

  if (techStack.length === 0) {
    return null;
  }

  const isHidden = imagesLoaded < techStack.length ? "opacity-0 pointer-events-none aria-hidden" : "";

  return (
    <div className={`absolute [bottom:calc(var(--spacing)*27+4dvh)] w-full flex justify-end-safe items-center-safe text-xs z-20 transition-opacity duration-300 ${isHidden} `}>
      <hgroup className="px-28 min-w-sm text-center space-x-2 ">
        <span className="inline-block translate-y-[2px]">
          <i>Proficient in</i>
        </span>
        <div className="contents">
          {techStack.map((tech) => (
            <span key={tech.name} className="px-1 py-1 space-x-0.5">
              <img
                className={`inline-block ${tech.className ?? ""} transition-transform duration-300 hover:scale-110`}
                loading="lazy"
                decoding="async"
                src={tech.icon}
                draggable="false"
                width={tech.width ?? 28}
                height={tech.height ?? 28}
                alt={tech.alt}
                onLoad={handleImageLoad}
              />
              {/* <span>{tech.name}</span> */}
            </span>
          ))}
        </div>
      </hgroup>
    </div>
  );
};

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
      className='relative w-full overflow-hidden mx-auto bg-gray-100 dark:bg-gray-800 transition-colors select-none'
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

      <div className='absolute inset-0 -top-12 z-10 flex items-center justify-center text-base md:text-2xl lg:text-5xl 3xl:text-6xl'>
        <div>
          <h1 className=' text-[0.6em] font-bold text-gray-700 dark:text-gray-100 text-center '>
            Aspiring Junior Backend Developer
          </h1>
          <div className="text-balance font-black text-[1em] mx-auto my-1 lg:my-4 text-center  text-gray-900 dark:text-white">
            Crafting Code That Scales,
            <br />
            Building Solutions That Last
          </div>

          {showText ? (
            <TextGenerateEffect
              className="text-center md:text-[0.5em] text-[0.5em] text-gray-500 dark:text-gray-400 font-medium "
              words={"This is Ivan Bandilla"}
            />
          ) : (
            <div className="text-center md:text-[0.5em] text-[0.5em] text-gray-500 dark:text-gray-400 font-medium lg:mt-4" aria-hidden="true">
              <div className="mt-1 lg:mt-4">
                <div className="leading-snug tracking-wide opacity-0" >
                  This is Ivan Bandilla
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <FeaturedTechStack />
    </motion.section >
  )
}

export default HeroSection;