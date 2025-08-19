import React from "react";
export { default as Intro } from "./Intro";
export { default as SkillsStack } from "./SkillsStack";
export { default as Experience } from "./Experience";
export { default as Projects } from "./Projects";

export const AboutSectionHeading: React.FC<{ text: string }> = ({ text }) => (
    <h2 className="text-center poppins-text text-xl lg:text-4xl font-bold mb-14">{text}</h2>
);
