import { HeroSection } from '@/components/landing';
import { lazy, Suspense, useEffect, useState } from 'react';
import SimpleLoader from '@/components/SimpleLoader';
import LazyVisible from '@/components/LazyVisible';
import { UserDataService } from '@/services/UserDataService';
const Sparkles = lazy(() => import('@/components/ui/sparkles').then(mod => ({ default: mod.SparklesCore })));


const Home = () => {
    const [showMiscRobot, setShowMiscRobot] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const existing = await UserDataService.getUserData();
            if (cancelled) return;
            // show only if not answered yet
            setShowMiscRobot(!(existing && typeof existing.isITField === 'boolean'));
        })();
        return () => { cancelled = true; };
    }, []);


    return (
        <>
            <HeroSection />
            <div className='fixed contain-paint will-change-scroll inset-0 h-lvh'>
                <Suspense fallback={null}>
                    <Sparkles
                        id="tsparticles"
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={500}
                        className="absolute -bottom-5 h-8 w-full z-50"
                        particleColor="#e60a64"
                    />
                </Suspense>
            </div>

            <LazyVisible
                loader={() => import('@/components/landing/featured-info')}
                fallback={<SimpleLoader />}
            />

            {showMiscRobot && (
                <LazyVisible
                    loader={() => import('@/components/landing/MiscRobot')}
                    fallback={null}
                    rootMargin="1000px"
                />
            )}


            <span id="projects" className="block scroll-mb-[4rem]" aria-hidden="true" />
            <LazyVisible
                loader={() => import('@/components/landing/Projects/Projects')}
                fallback={<SimpleLoader />}
                rootMargin="500px"
            />
        </>
    )
}

export default Home