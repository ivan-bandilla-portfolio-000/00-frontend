"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        source_code_link?: string;
        tags: Tag[];
    };
    className?: string;
};

const getImageUrl = (img?: string) =>
    img
        ? `/images/projects/${img}.jpg`
        : "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=640&h=360&auto=format&fit=crop";

const ProjectsCard: React.FC<ProjectCardProps> = ({ project, className }) => {
    return (
        <motion.div
            className={cn(
                "w-full max-w-96 rounded-lg bg-sidebar p-4 border space-y-4 overflow-hidden",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border mb-2">
                <img
                    src={getImageUrl(project.image)}
                    alt={project.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                />
            </div>
            <div className="space-y-2">
                <h2 className="font-medium line-clamp-1">{project.name}</h2>
                {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {project.description}
                    </p>
                )}
                {project.tags && project.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {project.tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                className="bg-muted-foreground hover:bg-muted-background"
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}
                {project.source_code_link && (
                    <a
                        href={project.source_code_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-primary underline"
                    >
                        Source Code
                    </a>
                )}
            </div>
        </motion.div>
    );
};

export default ProjectsCard;