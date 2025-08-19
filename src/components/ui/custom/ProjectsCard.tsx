"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getImageUrl, handleImageError } from "@/app/helpers/image";

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
        description?: string;
        image?: string;
        avp?: string;
        project_link?: string;
        tags: Tag[];
    };
    className?: string;
};


const ProjectsCard: React.FC<ProjectCardProps> = ({ project, className }) => {
    return (
        <motion.div
            className={cn(
                "w-full h-full rounded-lg bg-gray-100 dark:bg-stone-800 p-4 border space-y-4 overflow-hidden transition-transform ease-in-out hover:shadow dark:hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)]",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="relative aspect-video w-full overflow-hidden rounded-md border mb-2">
                <img
                    src={getImageUrl(project.image)}
                    alt={project.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={(e) => {
                        void handleImageError(e.currentTarget as HTMLImageElement, {
                            fallbackOnFetchError: true,
                        });
                    }}
                />
            </div>
            <div className="space-y-2">
                <h2 className="line-clamp-1 font-medium text-lg lg:text-xl">{project.name}</h2>
                {project.description && (
                    <p className="line-clamp-6 @sm:line-clamp-4 text-base text-muted-foreground text-pretty mt-3">
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
                    <div className="flex justify-end ">
                        <a
                            href={project.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-2 py-4 pointer-coarse:py-5 text-sm text-primary underline"
                        >
                            Source Code
                        </a>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProjectsCard;