import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false, trickleSpeed: 180 });

export default function NProgressRouteListener() {
    const first = useRef(true);
    const loc = useLocation();
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        NProgress.start();
        // mark done after paint
        const id = requestAnimationFrame(() => NProgress.done());
        return () => cancelAnimationFrame(id);
    }, [loc.pathname, loc.search, loc.hash]);
    return null;
}