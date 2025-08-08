import { lazy } from 'react';

const HeroSection = lazy(() => import('./HeroSection'));
const FeaturedInfo = lazy(() => import('./featured-info'));
const MiscRobot = lazy(() => import('./MiscRobot'));
const Projects = lazy(() => import('./Projects/Projects'));
const AboutMeChatLLM = lazy(() => import('./Chat'));

export { HeroSection, FeaturedInfo, MiscRobot, Projects, AboutMeChatLLM };