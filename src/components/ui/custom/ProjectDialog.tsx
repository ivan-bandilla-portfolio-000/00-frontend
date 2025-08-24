"use client";

import * as React from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, handleImageError } from "@/app/helpers/image";
import type { Tag } from "./ProjectsCard";
import { Button } from "../button";
import { ExternalLink } from "lucide-react";

export type ProjectDialogProps = {
    project: {
        name: string;
        description?: string;
        image?: string;
        avp?: string;
        project_link?: string;
        tags: Tag[];
    };
};

const ProjectDialog: React.FC<ProjectDialogProps> = ({ project }) => {
    return (
        <DialogContent className="w-[85svw] lg:w-[70svw] max-h-[85svh] !max-w-none overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                    <span className="text-lg font-medium">{project.name}</span>
                </DialogTitle>
                {project.description && (
                    <DialogDescription>
                        {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
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
                    </DialogDescription>
                )}
            </DialogHeader>

            <div className="space-y-6">
                {project.image && (
                    <div className="relative aspect-video w-full sm:max-w-1/2 mx-auto overflow-hidden rounded-md border">
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
                )}

                {project.description && (
                    <p className="text-sm sm:text-base max-w-prose mx-auto leading-relaxed">
                        {project.description}
                    </p>
                )}

                {project.project_link && (
                    <div>
                        <a
                            href={project.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-2 py-4 pointer-coarse:py-5 text-sm text-primary underline "
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button className="cursor-pointer">
                                <span>Source Code</span>
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