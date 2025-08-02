import React from 'react';
import { Anchor, ArrowUpRight, SquareArrowOutUpRight } from "lucide-react";

type IconProps =
    | { type?: undefined | null; icon: React.ReactNode }
    | { type: "internal" | "external" | "anchor"; icon?: React.ReactNode | null };

const IconLink = ({ icon, type }: IconProps) => {
    return (
        <span className={`w-4 absolute group-hover:scale-110 ${icon ? 'group-hover/link-icon:-top-2 group-hover/link-icon:-right-5 -top-1 -right-4' : 'top-0 right-2'}`}>
            {type === null || type === undefined ? icon : type === "anchor" ? <Anchor className="hidden group-hover/link-icon:inline-block" /> : type === "external" ? <SquareArrowOutUpRight className="hidden group-hover/link-icon:inline-block" /> : type === "internal" ? <ArrowUpRight className="hidden group-hover/link-icon:inline-block" /> : null}
        </span>
    )
}

export default IconLink