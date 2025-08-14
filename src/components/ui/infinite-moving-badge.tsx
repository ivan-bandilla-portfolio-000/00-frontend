"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const InfiniteMovingBadges = ({
    items,
    direction = "left",
    speed = "fast",
    pauseOnHover = true,
    className,
    badgeVariant = "secondary",
    badgeClassName,
}: {
    items: {
        content: React.ReactNode;
        icon?: React.ReactNode;
        variant?: BadgeVariant;
    }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
    badgeVariant?: BadgeVariant;
    badgeClassName?: string;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);
    const [start, setStart] = useState(false);

    useEffect(() => {
        addAnimation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function addAnimation() {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                scrollerRef.current!.appendChild(duplicatedItem);
            });

            applyDirection();
            applySpeed();
            setStart(true);
        }
    }

    function applyDirection() {
        if (!containerRef.current) return;
        containerRef.current.style.setProperty(
            "--animation-direction",
            direction === "left" ? "forwards" : "reverse",
        );
    }

    function applySpeed() {
        if (!containerRef.current) return;
        const duration =
            speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";
        containerRef.current.style.setProperty("--animation-duration", duration);
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
                className,
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
                    start && "animate-scroll",
                    pauseOnHover && "hover:[animation-play-state:paused]",
                )}
            >
                {items.map((item, idx) => (
                    <li key={idx} className="shrink-0">
                        <Badge
                            variant={item.variant ?? badgeVariant}
                            className={cn("px-3 py-1 select-none cursor-text text-sm lg:text-base", badgeClassName)}
                        >
                            {item.icon ? <span className="ml-1 inline-flex">{item.icon}</span> : null}
                            {item.content}
                        </Badge>
                    </li>
                ))}
            </ul>
        </div>
    );
};