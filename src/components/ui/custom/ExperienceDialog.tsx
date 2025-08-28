"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

import type { ExperienceUI } from "./ExperienceCard";
import { Button } from "../button";

export interface ExperienceDialogProps {
    item: ExperienceUI;
    thumbnails: string[];
    alts: string[];
    dateRange: string;
    duration: string;
    subtitle?: string;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const ExperienceDialog: React.FC<ExperienceDialogProps> = ({
    item,
    thumbnails,
    alts,
    dateRange,
    duration,
    subtitle,
    trigger,
    open,
    onOpenChange,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button
                        className=""
                        aria-label={`View full details of ${item.company}`}
                    >
                        View details
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="w-[85svw] lg:w-[70svw] max-h-[85svh] !max-w-none overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex flex-col gap-1">
                        <span className="text-lg font-medium">{item.company}</span>
                        {subtitle && (
                            <span className="text-base font-normal text-muted-foreground">
                                {subtitle}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-sm flex flex-wrap items-center gap-2">
                            <time>{dateRange}</time>
                            <span className="text-muted-foreground">({duration})</span>
                            {item.type && (
                                <Badge variant="secondary" className="uppercase">
                                    {item.type}
                                </Badge>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="w-full my-4">
                    <Carousel className="w-full">
                        <CarouselContent>
                            {thumbnails.map((src, index) => (
                                <CarouselItem key={`dialog-${src}-${index}`} className="basis-full">
                                    <div className="relative aspect-video w-full sm:max-w-1/2 mx-auto border rounded-md overflow-hidden">
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
                </div>

                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag, idx) => (
                            <Badge key={`full-${tag}-${idx}`} className="bg-muted-foreground text-background">
                                {typeof tag === "number" ? `Tag ${tag}` : tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {item.description && (
                    <div className="max-w-prose mx-auto leading-relaxed">
                        {item.description}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ExperienceDialog;