import React from "react";
import { Link } from 'react-router';
import IconLink from "@/components/ui/custom/IconLink";

type LinkWithIconProps =
    | { href: string; content: React.ReactNode; icon: React.ReactNode; className?: string; type?: undefined | null }
    | { href: string; content: React.ReactNode; icon?: React.ReactNode; className?: string; type: "internal" | "external" | "anchor" };

const LinkWithIcon = ({ href, content, icon, className = "", type }: LinkWithIconProps) => (
    <i className={`flex relative -bottom-1 hover:underline group/link-icon ${className}`}>
        <Link className={`font-normal text-[1em]`} to={href} target={type === "external" ? "_blank" : "_self"} rel={type === "external" ? "noopener noreferrer" : undefined}>
            {content}
        </Link>
        <IconLink icon={icon} type={type} />
    </i>
);

export default LinkWithIcon;