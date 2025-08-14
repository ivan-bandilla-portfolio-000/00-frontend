import { SectionWrapper } from "@/hoc";
import { Intro, SkillsStack, Experience, Projects } from "@/components/about-page";

const WrappedIntro = SectionWrapper(Intro, "about-intro");
const WrappedSkillsStack = SectionWrapper(SkillsStack, "about-skills", { className: "-mt-24" });
const WrappedExperience = SectionWrapper(Experience, "about-experience");
const WrappedProjects = SectionWrapper(Projects, "about-projects");

const About = () => {
    return (
        <div>
            <WrappedIntro />
            <WrappedSkillsStack />
            <WrappedExperience />
            <WrappedProjects />
        </div>
    );
};

export default About;