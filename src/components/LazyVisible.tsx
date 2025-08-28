import React, { useEffect, useRef, useState } from 'react';

type Loader = () => Promise<{ default: React.ComponentType<any> }>;

interface LazyVisibleProps {
    loader: Loader;
    fallback?: React.ReactNode;
    rootMargin?: string; // e.g. '200px'
    once?: boolean;
    // forwarded props to loaded component
    componentProps?: Record<string, any>;
}

const LazyVisible: React.FC<LazyVisibleProps> = ({
    loader,
    fallback = null,
    rootMargin = '250px',
    once = true,
    componentProps = {}
}) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [Comp, setComp] = useState<React.ComponentType | null>(null);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (!ref.current) return;
        if (loadedRef.current) return;

        const io = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loader().then(m => {
                            setComp(() => m.default);
                            loadedRef.current = true;
                            if (once) io.disconnect();
                        });
                    }
                });
            },
            { root: null, rootMargin, threshold: 0.01 }
        );

        io.observe(ref.current);
        return () => io.disconnect();
    }, [loader, rootMargin, once]);

    return (
        <div ref={ref}>
            {Comp ? <Comp {...componentProps} /> : fallback}
        </div>
    );
};

export default LazyVisible;