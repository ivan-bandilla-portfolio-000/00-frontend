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
import { getImageUrl } from "@/app/helpers/image";
import ExperienceDialog from "./ExperienceDialog";
import type { ExperienceRow } from "@/services/ExperienceService";
import RoleSpan from "./RoleSpan";

export type ExperienceUI = ExperienceRow & {
    thumbnail?: string[];
    alt?: string[];
    tags?: (number | string)[];
};

type ExperienceCardProps = React.HTMLAttributes<HTMLDivElement> &
    MotionProps & {
        item: ExperienceUI; // use the UI type directly
        onSwap?: (isFirstVisible: boolean) => void;
    };

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
        const { item, className, onClick, ...rest } = props;

        const [open, setOpen] = React.useState(false);

        const handleCardClick = () => {
            setOpen(true);
        };

        const thumbnails =
            item.thumbnail && item.thumbnail.length > 0
                ? item.thumbnail
                : [getImageUrl()];

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

        const roleText = typeof item.role === 'string' ? item.role : item.role?.name;
        const subtitleParts = [roleText, item.position].filter(Boolean);
        // single JSX subtitle node (uses RoleSpan)
        const subtitleNode = (
            <>
                {roleText && <RoleSpan role={roleText} />}
                {roleText && item.position && <span className="mx-1">•</span>}
                {item.position && <span>{item.position}</span>}
            </>
        );
        const dateRange = formatRange(item.start, item.end);
        const duration = computeDuration(item.start, item.end);

        return (
            <motion.div
                ref={ref}
                className={cn(
                    "flex flex-col w-full min-h-full space-y-4 rounded-lg bg-gray-100 dark:bg-stone-800 p-4 border max-w-96 transition-transform ease-in-out hover:shadow dark:hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)] cursor-pointer",
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                {...rest}
            >
                <div className="relative w-full">
                    <Carousel setApi={setCarouselApi} className="w-full">
                        <CarouselContent className="">
                            {thumbnails.map((src, index) => (
                                <CarouselItem key={src} className="basis-full hover">
                                    <div className="relative aspect-video w-full overflow-clip transition-all ease-in-out hover:scale-105 active:scale-105 border rounded-md ">
                                        <img
                                            src={src}
                                            alt={alts[index] || `${item.company} preview ${index + 1}`}
                                            className="h-full w-full object-cover"
                                            style={{ objectPosition: index === 0 ? "top" : "center" }}
                                            loading="lazy"
                                            decoding="async"
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

                <div
                    onClick={handleCardClick}
                    className="flex flex-col gap-y-3 flex-1"
                >
                    <div className="select-none">
                        <h2 className="line-clamp-1 font-medium text-lg lg:text-xl">{item.company}</h2>
                        {subtitleParts.length > 0 && (
                            <p className="text-base lg:text-base text-muted-foreground font-bold line-clamp-1">
                                {subtitleNode}
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

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="self-end-safe mt-auto"
                    >
                        <ExperienceDialog
                            open={open}
                            onOpenChange={setOpen}
                            item={item}
                            thumbnails={thumbnails}
                            alts={alts}
                            dateRange={dateRange}
                            duration={duration}
                            subtitle={subtitleNode}
                        />
                    </div>
                </div>
            </motion.div>
        );
    }
);

ExperienceCard.displayName = "ExperienceCard";

export default ExperienceCard;