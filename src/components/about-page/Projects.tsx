import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { useClientDB } from "@/clientDB/context";
import { ProjectService } from "@/services/ProjectService";
import { ProjectMetaService, type MetaTag, type MetaStatus, type MetaCategory } from "@/services/ProjectMetaService";
import type { Project } from "@/clientDB/@types/Project";
import ProjectsCard, { type ProjectCardProps } from "@/components/ui/custom/ProjectsCard";
import { AboutSectionHeading } from ".";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "../ui/input";
import { motion, AnimatePresence } from "framer-motion";

function useDebounced<T>(value: T, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

const Projects = () => {
    const clientDb = useClientDB();

    const [projects, setProjects] = useState<Project[]>([]);
    const [tags, setTags] = useState<MetaTag[]>([]);
    const [statuses, setStatuses] = useState<MetaStatus[]>([]);
    const [categories, setCategories] = useState<MetaCategory[]>([]);

    // Filters
    const [search, setSearch] = useState("");
    const [statusValues, setStatusValues] = useState<string[]>([]);
    const [tagValues, setTagValues] = useState<string[]>([]);
    const [categoryValues, setCategoryValues] = useState<string[]>([]);

    const statusSet = useMemo(() => new Set(statusValues.map(v => parseInt(v))), [statusValues]);
    const tagSet = useMemo(() => new Set(tagValues.map(v => parseInt(v))), [tagValues]);
    const categorySet = useMemo(() => new Set(categoryValues.map(v => parseInt(v))), [categoryValues]);

    const debouncedSearch = useDebounced(search, 250);

    const gridRef = useRef<HTMLDivElement | null>(null);
    const lastNonEmptyHeightRef = useRef<number>(0);

    // Load data
    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;

        (async () => {
            try {
                // 1. Ensure (and possibly seed) projects & related tables
                const proj = await ProjectService.ensureAndGetProjects(clientDb);
                if (!cancelled) setProjects(proj);

                // 2. Only after seeding, load meta
                const meta = await ProjectMetaService.getMeta(clientDb);
                if (!cancelled) {
                    setTags(meta.tags);
                    setStatuses(meta.statuses);
                    setCategories(meta.categories);
                }
            } catch (e) {
                console.error(e);
            }
        })();

        return () => { cancelled = true; };
    }, [clientDb]);

    useEffect(() => {
        if (!clientDb) return;
        if (projects.length && tags.length === 0 && statuses.length === 0 && categories.length === 0) {
            let cancelled = false;
            (async () => {
                try {
                    const meta = await ProjectMetaService.getMeta(clientDb);
                    if (!cancelled) {
                        setTags(meta.tags);
                        setStatuses(meta.statuses);
                        setCategories(meta.categories);
                    }
                } catch (e) {
                    console.error(e);
                }
            })();
            return () => { cancelled = true; };
        }
    }, [clientDb, projects.length, tags.length, statuses.length, categories.length]);

    const clearAll = () => {
        setSearch("");
        setStatusValues([]);
        setTagValues([]);
        setCategoryValues([]);
    };

    const statusOptions = statuses.map(s => ({ value: String(s.id), label: s.name.toLocaleUpperCase() }));
    const categoryOptions = categories.map(c => ({ value: String(c.id), label: c.name.toLocaleUpperCase() }));
    const tagOptions = tags.map(t => ({
        value: String(t.id),
        label: t.name.toLocaleUpperCase(),
        style: t.color ? { badgeColor: t.color } : undefined
    }));

    const filtered = useMemo(() => {
        const s = debouncedSearch.trim().toLowerCase();
        return projects.filter(p => {
            if (s) {
                const hay = `${p.name} ${(p.description ?? "")}`.toLowerCase();
                if (!hay.includes(s)) return false;
            }
            if (statusSet.size && (!p.status_id || !statusSet.has(p.status_id))) return false;
            if (categorySet.size) {
                const catIds = new Set(p.project_category_ids ?? []);
                for (const id of categorySet) if (!catIds.has(id)) return false;
            }
            if (tagSet.size) {
                const tagIds = new Set(
                    (p.tags ?? []).map(t => typeof t === "number" ? t : t.id)
                );
                for (const id of tagSet) if (!tagIds.has(id)) return false;
            }
            return true;
        });
    }, [projects, debouncedSearch, statusSet, categorySet, tagSet]);

    // Measure & store last non-empty height
    useLayoutEffect(() => {
        if (filtered.length && gridRef.current) {
            lastNonEmptyHeightRef.current = gridRef.current.getBoundingClientRect().height;
        }
    }, [filtered.length]);

    // Style object to preserve height when empty
    const preservedStyle: React.CSSProperties =
        filtered.length === 0 && lastNonEmptyHeightRef.current
            ? { minHeight: lastNonEmptyHeightRef.current }
            : {};

    return (
        <>
            <AboutSectionHeading text="Projects" />

            <div className="pointer-events-auto mb-6 space-y-4 border rounded-md p-4 bg-background/60 backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full px-3 py-6 rounded-md border bg-background"
                    />
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs px-3 py-4 rounded-md border hover:bg-muted"
                    >
                        Clear
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <div className="text-xs font-semibold mb-1 text-muted-foreground">Status</div>
                        <MultiSelect
                            options={statusOptions}
                            onValueChange={setStatusValues}
                            defaultValue={statusValues}
                            placeholder="Select status..."
                            responsive
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold mb-1 text-muted-foreground">Categories</div>
                        <MultiSelect
                            options={categoryOptions}
                            onValueChange={setCategoryValues}
                            defaultValue={categoryValues}
                            placeholder="Select categories..."
                            responsive
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold mb-1 text-muted-foreground">Tags</div>
                        <MultiSelect
                            options={tagOptions}
                            onValueChange={setTagValues}
                            defaultValue={tagValues}
                            placeholder="Select tags..."
                            responsive
                        />
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {projects.length}
                </div>
            </div>

            <motion.div
                ref={gridRef}
                layout
                style={preservedStyle}
                className="relative"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-6 pointer-events-auto">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((project, idx) => {
                            const normalized: ProjectCardProps["project"] = {
                                name: project.name,
                                description: project.description,
                                image: project.image,
                                avp: project.avp,
                                source_code_link: project.source_code_link,
                                tags: Array.isArray(project.tags) &&
                                    (project.tags.length === 0 || typeof (project.tags[0] as any)?.id === "number")
                                    ? (project.tags as any) : [],
                            };
                            return (
                                <motion.div
                                    key={project.name + idx}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                >
                                    <ProjectsCard project={normalized} />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {filtered.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="text-sm text-muted-foreground px-4 text-center">
                                No projects match your filters.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};

export default Projects;