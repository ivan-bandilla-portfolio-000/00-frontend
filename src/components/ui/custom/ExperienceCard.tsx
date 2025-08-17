"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

export type ExperienceItem = {
    company: string;
    role: string;
    position?: string;
    start: Date | string;
    end?: Date | string;
    description?: string;
    tags?: (number | string)[];
    type?: string;
    hidden?: boolean;
    thumbnail?: string[];
    alt?: string[];
};

type ExperienceCardProps = React.HTMLAttributes<HTMLDivElement> &
    MotionProps & {
        item: ExperienceItem;
        onSwap?: (isFirstVisible: boolean) => void;
    };

const DEFAULT_THUMBNAILS = [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=640&h=360&auto=format&fit=crop", // office teamwork
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=640&h=360&auto=format&fit=crop", // coding desk
];

const formatMonthYear = (date: Date | string) =>
    new Date(date).toLocaleString("en-US", { month: "short", year: "numeric" });

const formatRange = (start: Date | string, end?: Date | string) => {
    const s = formatMonthYear(start);
    const e = end ? formatMonthYear(end) : "Present";
    return `${s} — ${e}`;
};

const computeDuration = (start: Date | string, end?: Date | string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    let months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
    if (months < 1) return "Less than 1 month";
    if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    return remMonths === 0
        ? `${years} year${years > 1 ? "s" : ""}`
        : `${years} year${years > 1 ? "s" : ""} ${remMonths} month${remMonths > 1 ? "s" : ""}`;
};

const ExperienceCard = React.forwardRef<HTMLDivElement, ExperienceCardProps>(
    (props, ref) => {
        const { item, className, ...rest } = props;

        const thumbnails =
            item.thumbnail && item.thumbnail.length > 0
                ? item.thumbnail
                : DEFAULT_THUMBNAILS;

        const alts =
            item.alt && item.alt.length === thumbnails.length
                ? item.alt
                : [
                    `${item.company} workplace preview`,
                    `${item.company} project preview`,
                ];

        const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
        const [current, setCurrent] = React.useState(0);
        const [count, setCount] = React.useState(0);

        React.useEffect(() => {
            if (!carouselApi) return;
            setCount(carouselApi.scrollSnapList().length);
            setCurrent(carouselApi.selectedScrollSnap());
            carouselApi.on("select", () => {
                setCurrent(carouselApi.selectedScrollSnap());
            });
        }, [carouselApi]);

        const subtitle = [item.role, item.position].filter(Boolean).join(" • ");
        const dateRange = formatRange(item.start, item.end);
        const duration = computeDuration(item.start, item.end);

        return (
            <motion.div
                ref={ref}
                className={cn(
                    "w-full min-h-full space-y-4 rounded-lg bg-sidebar p-4 border max-w-96 overflow-hidden",
                    className
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                {...rest}
            >
                <div className="relative w-full">
                    <Carousel setApi={setCarouselApi} className="w-full">
                        <CarouselContent>
                            {thumbnails.map((src, index) => (
                                <CarouselItem key={src} className="basis-full">
                                    <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                                        <img
                                            src={src}
                                            alt={alts[index] || `${item.company} preview ${index + 1}`}
                                            className="h-full w-full object-cover"
                                            style={{ objectPosition: index === 0 ? "top" : "center" }}
                                            loading="lazy"
                                            draggable={false}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

                    {/* Dots indicator (no arrow buttons) */}
                    {count > 1 && (
                        <div className="absolute bottom-2 right-2 z-20 flex gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-2 py-1.5 shadow-sm border border-white/20">
                            {Array.from({ length: count }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => carouselApi?.scrollTo(index)}
                                    className={cn(
                                        "size-2 rounded-full transition-all duration-300",
                                        current === index
                                            ? "bg-white scale-110 ring-1 ring-white/50 ring-offset-1 ring-offset-black/30"
                                            : "bg-white/60 hover:bg-white/80"
                                    )}
                                    aria-label={`View image ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="">
                        <h2 className="line-clamp-1 font-medium text-lg lg:text-xl">{item.company}</h2>
                        {subtitle && (
                            <p className="text-base lg:text-base text-muted-foreground font-bold line-clamp-1">
                                {subtitle}
                            </p>
                        )}
                        {item.description && (
                            <p className="line-clamp-6 @sm:line-clamp-4 text-base text-muted-foreground text-pretty mt-4">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                        <ScrollArea className="w-full">
                            <div className="flex gap-2 pb-1">
                                {item.tags.map((tag, index) => (
                                    <Badge
                                        key={`${tag}-${index}`}
                                        className="shrink-0 bg-muted-foreground hover:bg-muted-background"
                                    >
                                        {typeof tag === "number" ? `Tag ${tag}` : tag}
                                    </Badge>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1.5" />
                        </ScrollArea>
                    )}

                    <div className="flex items-center gap-1 text-xs lg:text-sm text-pretty">
                        <time className="text-muted-foreground font-medium">{dateRange}</time>
                        <i className="text-muted-foreground">({duration})</i>
                        {/* {item.type && (
                            <span className="text-muted-foreground capitalize">
                                {item.type}
                            </span>
                        )} */}
                    </div>
                </div>
            </motion.div>
        );
    }
);

ExperienceCard.displayName = "ExperienceCard";

export default ExperienceCard;