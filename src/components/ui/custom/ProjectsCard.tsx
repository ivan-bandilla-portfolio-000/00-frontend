"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getImageUrl, handleImageError } from "@/app/helpers/image";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import ProjectDialog from "@/components/ui/custom/ProjectDialog";
import { Button } from "../button";
import { ExternalLink } from "lucide-react";

export type Tag = {
    id: number;
    name: string;
    color?: string;
    icon?: string;
    type_id?: number;
};

export type ProjectCardProps = {
    project: {
        name: string;
        role?: { id: number; name: string } | null;
        description?: string;
        image?: string;
        avp?: string;
        project_link?: string;
        tags: Tag[];
    };
    className?: string;
};

const ProjectsCard: React.FC<ProjectCardProps> = ({ project, className }) => {
    // console.log(project);

    const [hovered, setHovered] = React.useState(false);
    const [videoReady, setVideoReady] = React.useState(false);
    const [inView, setInView] = React.useState(false);
    const [playbackTime, setPlaybackTime] = React.useState(0);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const mediaWrapRef = React.useRef<HTMLDivElement | null>(null);
    const resetTimerRef = React.useRef<number | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    React.useEffect(() => {
        const el = mediaWrapRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            entries => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        setInView(true);
                        io.disconnect(); // load once
                        break;
                    }
                }
            },
            { root: null, rootMargin: "200px 0px", threshold: 0.01 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    React.useEffect(() => {
        if (dialogOpen && resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
    }, [dialogOpen]);

    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = true;

        if (hovered && videoReady) {
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
                resetTimerRef.current = null;
            }
            v.play().catch(() => { });
        } else if (!hovered) {
            v.pause();
            if (!dialogOpen && !resetTimerRef.current) {             // CHANGED
                resetTimerRef.current = window.setTimeout(() => {
                    if (!hovered && !dialogOpen && videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setPlaybackTime(0);
                    }
                    resetTimerRef.current = null;
                }, 4000);
            }
        }
    }, [hovered, videoReady, inView, dialogOpen]);                   // include dialogOpen

    // Card pushes playbackTime ONLY when dialog closed (card is driver)
    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (dialogOpen) return;                                      // SUPPRESS while dialog drives
        const onTimeUpdate = () => {
            setPlaybackTime(prev =>
                Math.abs(prev - v.currentTime) > 0.25 ? v.currentTime : prev
            );
        };
        v.addEventListener("timeupdate", onTimeUpdate);
        return () => v.removeEventListener("timeupdate", onTimeUpdate);
    }, [videoReady, dialogOpen]);

    // Apply incoming playbackTime to card only if dialog is (or was) driver
    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (dialogOpen) return;  // while open dialog is live-driving; let it push updates later
        if (Math.abs(v.currentTime - playbackTime) > 0.4) {
            try { v.currentTime = playbackTime; } catch { }
        }
    }, [playbackTime, dialogOpen]);

    return (
        <motion.div
            className={cn(
                "w-full h-full flex flex-col rounded-lg bg-gray-100 dark:bg-stone-800 p-4 border space-y-4 overflow-hidden transition-transform ease-in-out hover:shadow dark:hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)]",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <div
                    ref={mediaWrapRef}
                    className="relative aspect-video w-full overflow-hidden rounded-md border mb-2 group"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onFocus={() => setHovered(true)}
                    onBlur={() => setHovered(false)}
                >
                    <img
                        src={getImageUrl(project.image)}
                        alt={project.name}
                        className={cn(
                            "h-full w-full object-cover transition-opacity duration-300",
                            project.avp ? "group-hover:opacity-0" : ""
                        )}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={(e) => {
                            void handleImageError(e.currentTarget as HTMLImageElement, {
                                fallbackOnFetchError: true,
                            });
                        }}
                    />
                    {project.avp && inView && (
                        <video
                            key={project.avp}
                            ref={videoRef}
                            poster={getImageUrl(project.image)}
                            className={cn(
                                "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                                hovered && videoReady ? "cursor-auto" : "cursor-progress",
                                hovered ? "opacity-100" : "opacity-0"
                            )}
                            playsInline
                            muted
                            loop
                            preload="metadata"
                            controlsList="nodownload noremoteplayback"
                            src={getImageUrl(project.avp)}
                            onLoadedData={() => setVideoReady(true)}
                            onCanPlay={() => setVideoReady(true)}
                            onError={(e) => {
                                setVideoReady(false);
                                (e.currentTarget as HTMLVideoElement).classList.add("hidden");
                                console.warn("Video failed to load:", project.avp);
                            }}
                        />
                    )}
                </div>
                <DialogTrigger asChild>
                    <div className="flex flex-col flex-1 gap-y-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-sm">
                        <hgroup>
                            <h2 className="line-clamp-1 font-medium text-lg lg:text-xl leading-tight">{project.name}</h2>
                            <p
                                className="text-base text-muted-foreground ms-1 leading-tight -mt-1"
                            >
                                {project.role?.name}</p>
                        </hgroup>
                        {project.description && (
                            <p className="line-clamp-6 @sm:line-clamp-4 text-sm text-muted-foreground text-pretty mt-3">
                                {project.description}
                            </p>
                        )}
                        {project.tags && project.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap py-4">
                                {project.tags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        className="bg-muted-foreground hover:bg-muted-background text-background text-sm md:text-[0.85em]"
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {project.project_link && (
                            <div className="self-end-safe mt-auto">
                                <a
                                    href={project.project_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-2 py-4 pointer-coarse:py-5 text-sm text-primary underline "
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button className="cursor-pointer">
                                        <span>Project Link</span>
                                        <ExternalLink />
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>
                </DialogTrigger>
                <ProjectDialog
                    project={project}
                    playbackTime={playbackTime}
                    onPlaybackTimeChange={setPlaybackTime}
                    dialogOpen={dialogOpen}
                />
            </Dialog>
        </motion.div>
    );
};

export default ProjectsCard;