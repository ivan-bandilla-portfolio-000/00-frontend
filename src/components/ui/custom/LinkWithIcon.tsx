import React from "react";
import IconLink from "@/components/ui/custom/IconLink";

type LinkWithIconProps =
    | { href: string; content: React.ReactNode; icon: React.ReactNode; className?: string; type?: undefined | null }
    | { href: string; content: React.ReactNode; icon?: React.ReactNode; className?: string; type: "internal" | "external" | "anchor" };

const LinkWithIcon = ({ href, content, icon, className = "", type }: LinkWithIconProps) => (
    <i className={`flex relative -bottom-1 hover:underline group/link-icon ${className}`}>
        <a className={`font-normal text-[1em]`} href={href} target={type === "external" ? "_blank" : "_self"} rel={type === "external" ? "noopener noreferrer" : undefined}>
            {content}
        </a>
        <IconLink icon={icon} type={type} />
    </i>
);

export default LinkWithIcon;