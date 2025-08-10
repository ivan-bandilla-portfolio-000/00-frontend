import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

export function useIdInViewport(id: string, threshold: number = 0.1, rootMargin: string = '0px'): boolean {
    const [isVisible, setIsVisible] = useState(false);
    const ioRef = useRef<IntersectionObserver | null>(null);
    const moRef = useRef<MutationObserver | null>(null);
    const location = useLocation();

    useEffect(() => {
        let cancelled = false;

        const attach = (el: HTMLElement) => {
            if (cancelled) return;
            ioRef.current?.disconnect();
            ioRef.current = new IntersectionObserver(([entry]) => {
                if (!cancelled) setIsVisible(entry.isIntersecting);
            }, { threshold, rootMargin });
            ioRef.current.observe(el);
        };

        const findOrWait = () => {
            const el = document.getElementById(id);
            if (el) {
                attach(el);
                moRef.current?.disconnect();
                moRef.current = null;
                return;
            }
            moRef.current?.disconnect();
            moRef.current = new MutationObserver(() => {
                const candidate = document.getElementById(id);
                if (candidate) {
                    attach(candidate);
                    moRef.current?.disconnect();
                    moRef.current = null;
                }
            });
            moRef.current.observe(document.body, { childList: true, subtree: true });
        };

        setIsVisible(false);
        findOrWait();

        return () => {
            cancelled = true;
            ioRef.current?.disconnect();
            moRef.current?.disconnect();
            ioRef.current = null;
            moRef.current = null;
        };
    }, [id, threshold, rootMargin, location.pathname]);

    return isVisible;
}