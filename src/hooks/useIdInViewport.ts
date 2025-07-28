import { useEffect, useState } from 'react';

export function useIdInViewport(id: string, threshold: number = 0.1): boolean {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = document.getElementById(id);
        if (!el) return;

        const observer = new window.IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold }
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, [id, threshold]);

    return isVisible;
}