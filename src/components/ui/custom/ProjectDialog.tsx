"use client";

import * as React from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, handleImageError } from "@/app/helpers/image";
import type { Tag } from "./ProjectsCard";
import { Button } from "../button";
import { ExternalLink } from "lucide-react";
import { ProjectMetaService, type MetaCategory, type MetaStatus } from "@/services/ProjectMetaService";
import { useClientDB } from "@/clientDB/context";

export type ProjectDialogProps = {
    project: {
        name: string;
        role?: { id: number; name: string } | null;
        description?: string;
        image?: string;
        avp?: string;
        project_link?: string;
        status_id?: number;
        project_category_ids?: number[];
        tags: Tag[];
    };
    playbackTime: number;
    onPlaybackTimeChange: React.Dispatch<React.SetStateAction<number>>;
    dialogOpen: boolean;
};

const ProjectDialog: React.FC<ProjectDialogProps> = ({
    project,
    playbackTime,
    onPlaybackTimeChange,
    dialogOpen
}) => {
    const [hovered, setHovered] = React.useState(false);
    const [videoReady, setVideoReady] = React.useState(false);
    const [showControls, setShowControls] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const mediaWrapRef = React.useRef<HTMLDivElement | null>(null);
    const suppressSyncRef = React.useRef(false);
    const clientDb = useClientDB();
    const [status, setStatus] = React.useState<MetaStatus | undefined>();
    const [categories, setCategories] = React.useState<MetaCategory[]>([]);

    React.useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        (async () => {
            try {
                const meta = await ProjectMetaService.getMeta(clientDb);
                console.log(meta);
                if (cancelled) return;
                setStatus(project.status_id != null ? (meta.statuses as any).find((s: any) => s.id === project.status_id) : undefined);
                const cats = (project.project_category_ids ?? [])
                    .map(id => (meta.categories as any).find((c: any) => c.id === id))
                    .filter(Boolean) as MetaCategory[];
                setCategories(cats);
            } catch (e) {
                // ignore
            }
        })();
        return () => { cancelled = true; };
    }, [clientDb, project.status_id, project.project_category_ids]);

    // Track play/pause to keep video visible after user interaction
    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        v.addEventListener("play", onPlay);
        v.addEventListener("pause", onPause);
        return () => {
            v.removeEventListener("play", onPlay);
            v.removeEventListener("pause", onPause);
        };
    }, []);

    // Autoplay only when hovered OR controls visible; keep visible if isPlaying
    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = true;
        if ((hovered || showControls) && videoReady && !isPlaying) {
            v.play().catch(() => { });
        }
        // do not auto-pause immediately on mouse leave if user manually paused/played; visibility handled by class logic
    }, [hovered, videoReady, showControls, isPlaying]);

    // Incoming sync (card -> dialog) only when dialogOpen & video ready
    React.useEffect(() => {
        if (!dialogOpen) return;
        const v = videoRef.current;
        if (!v || !videoReady) return;
        if (suppressSyncRef.current) return;
        if (Math.abs(v.currentTime - playbackTime) > 0.4) {
            try { v.currentTime = playbackTime; } catch { }
        }
    }, [playbackTime, videoReady, dialogOpen]);

    // Outgoing sync (dialog drives) only while open
    React.useEffect(() => {
        if (!dialogOpen) return;
        const v = videoRef.current;
        if (!v) return;
        const onTimeUpdate = () => {
            const ct = v.currentTime;
            onPlaybackTimeChange(prev =>
                Math.abs(prev - ct) > 0.25 ? ct : prev
            );
        };
        v.addEventListener("timeupdate", onTimeUpdate);
        return () => v.removeEventListener("timeupdate", onTimeUpdate);
    }, [dialogOpen, onPlaybackTimeChange]);

    // When dialog closes, pause dialog video (card may resume later)
    React.useEffect(() => {
        if (dialogOpen) return;
        const v = videoRef.current;
        if (v) v.pause();
    }, [dialogOpen]);

    return (
        <DialogContent className="w-[85svw] lg:w-[70svw] max-h-[85svh] !max-w-none overflow-y-auto">
            <DialogHeader className="gap-5">
                <DialogTitle>
                    <hgroup className="">
                        <span className="font-medium text-lg lg:text-xl leading-tight">{project.name}</span>
                        {' ('}
                        <span className="text-base text-muted-foreground ms-1 text-nowrap leading-tight -mt-1">
                            {project.role?.name}
                        </span>
                        {' ) '}
                    </hgroup>
                </DialogTitle>
            </DialogHeader>

            <div className="px-6 mt-1 gap-2">
                <b className="font-medium">Status:</b>{' '}
                {status && (
                    <Badge
                        variant={null}
                        className="text-sm uppercase"
                        style={(status as any).color ? { background: (status as any).color, color: '#fff' } : undefined}
                    >
                        {(status as any).name ?? (status as any).label ?? ''}
                    </Badge>
                )}
            </div>

            {categories.length > 0 && (
                <div className="px-6 mt-1 flex gap-2 flex-wrap">
                    <b className="font-medium">Categories:</b>{' '}
                    {categories.map(c => (
                        <Badge
                            className="text-sm capitalize font-bold"
                            variant="outline"
                            key={c.id}
                        >
                            {c.name}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-y-6">
                {(project.image || project.avp) && (
                    <div
                        ref={mediaWrapRef}
                        className="relative aspect-video w-full sm:max-w-3xl mx-auto overflow-hidden rounded-md border group"
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onFocus={() => setHovered(true)}
                        onBlur={() => setHovered(false)}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (videoReady) {
                                setShowControls(c => !c);
                                setHovered(true);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (videoReady) {
                                    setShowControls(c => !c);
                                    setHovered(true);
                                }
                            }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Toggle video controls"
                        aria-pressed={showControls}
                    >
                        {project.image && (
                            <img
                                src={getImageUrl(project.image)}
                                alt={project.name}
                                className={`h-full w-full object-cover transition-opacity duration-300 ${project.avp ? "group-hover:opacity-0" : ""
                                    }`}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                onError={(e) => {
                                    void handleImageError(e.currentTarget as HTMLImageElement, {
                                        fallbackOnFetchError: true,
                                    });
                                }}
                            />
                        )}

                        {project.avp && (
                            <video
                                ref={videoRef}
                                key={project.avp}
                                poster={project.image ? getImageUrl(project.image) : undefined}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${(videoReady && (hovered || showControls || isPlaying)) ? "opacity-100" : "opacity-0"
                                    } ${videoReady ? (showControls ? "cursor-default" : "cursor-pointer") : "cursor-progress"}`}
                                playsInline
                                muted
                                loop
                                preload="metadata"
                                controls={showControls}
                                controlsList="nodownload noremoteplayback"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                                src={getImageUrl(project.avp)}
                                onLoadedData={() => {
                                    setVideoReady(true);
                                    if (videoRef.current && playbackTime > 0) {
                                        try { videoRef.current.currentTime = playbackTime; } catch { }
                                    }
                                }}
                                onCanPlay={() => setVideoReady(true)}
                                onError={(e) => {
                                    setVideoReady(false);
                                    (e.currentTarget as HTMLVideoElement).classList.add("hidden");
                                    console.warn("Dialog video failed:", project.avp);
                                }}
                            />
                        )}

                        {project.avp && videoReady && !showControls && (
                            <div className="pointer-events-none absolute bottom-2 right-2 bg-black/55 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to toggle controls
                            </div>
                        )}
                    </div>
                )}


                {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap mx-auto max-w-prose gap-2 justify-center-safe ">
                        {project.tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="bg-muted-foreground hover:bg-muted-background text-background text-xs sm:text-sm"
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}

                {project.description && (
                    <p className="text-sm sm:text-base w-full max-w-prose text-left mx-auto leading-relaxed">
                        {project.description}
                    </p>
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
        </DialogContent>
    );
};

export default ProjectDialog;