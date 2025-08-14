import { useEffect, useState } from "react";
import { useClientDB } from "@/clientDB/context";
import { ExperienceService } from "@/services/ExperienceService";
import type { ExperienceRow } from "@/services/ExperienceService";
import ExperienceCard from "@/components/ui/custom/ExperienceCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { AboutSectionHeading } from ".";

const Experience = () => {
    const clientDb = useClientDB();
    const [items, setItems] = useState<ExperienceRow[]>([]);
    const [carouselAPi, setCarouselAPi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const itemsLeft = count - (current + 1);

    useEffect(() => {
        if (!carouselAPi) return;
        setCount(carouselAPi.scrollSnapList().length);
        setCurrent(carouselAPi.selectedScrollSnap());
        carouselAPi.on("select", () => {
            setCurrent(carouselAPi.selectedScrollSnap());
        });
    }, [carouselAPi]);

    useEffect(() => {
        if (!clientDb) return;
        let cancelled = false;
        ExperienceService.ensureAndGetExperiences(clientDb)
            .then((rows) => {
                if (!cancelled) setItems(rows.filter(i => !i.hidden));
            })
            .catch(console.error);
        return () => { cancelled = true; };
    }, [clientDb]);

    return (
        <>
            <AboutSectionHeading text="Experience" />
            {items.length > 0 && (
                <Carousel setApi={setCarouselAPi} className='container pointer-events-auto'>
                    <CarouselContent>
                        {items.map((item, idx) => (
                            <CarouselItem key={`carousel-item-${idx}`} className="md:basis-1/2 lg:basis-1/3">
                                <ExperienceCard key={`${item.company}-${idx}`} item={item} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                    <div className="flex justify-end mt-4 me-[3dvw] px-4">
                        <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-300">
                            {itemsLeft > 0 ? `${itemsLeft} more` : '\u00A0'}
                        </span>
                    </div>
                </Carousel>
            )}
        </>
    );
};

export default Experience;