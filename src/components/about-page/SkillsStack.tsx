import { useEffect, useState } from "react";
import { useClientDB } from "@/clientDB/context";
import { TechStackService } from "@/services/TechStackService";
import type { TechStack } from "@/clientDB/@types/TechStack";
import { InfiniteMovingBadges } from "@/components/ui/infinite-moving-badge";

import { AboutSectionHeading } from ".";

const SkillsStack = () => {
    const clientDb = useClientDB();
    const [techStack, setTechStack] = useState<TechStack[]>([]);

    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        TechStackService.ensureAndGetTechStack(clientDb)
            .then((rows) => {
                if (!cancelled) setTechStack(rows);
            })
            .catch(console.error);
        return () => { cancelled = true; };
    }, [clientDb]);

    return (
        <div className="my-6 pointer-events-auto">
            <AboutSectionHeading text="Tech Stacks" />
            <InfiniteMovingBadges
                items={techStack.map(item => ({
                    content: item.content,
                    icon: <img src={item.icon} alt="" loading="lazy" decoding="async" className="w-4 h-4" />,
                }))}
                direction="left"
                speed="normal"
                badgeVariant="outline"
                badgeClassName="rounded-full "
            />
        </div>
    );
};

export default SkillsStack;