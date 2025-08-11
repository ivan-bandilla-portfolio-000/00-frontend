import { HeroSection } from '@/components/landing';
import { lazy, Suspense } from 'react';
import SimpleLoader from '@/components/SimpleLoader';
import LazyVisible from '@/components/LazyVisible';
const Sparkles = lazy(() => import('@/components/ui/sparkles').then(mod => ({ default: mod.SparklesCore })));


const Home = () => {



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

            <LazyVisible
                loader={() => import('@/components/landing/MiscRobot')}
                fallback={null}
                rootMargin="1000px"
            />


            <span id="projects" className="block scroll-mb-[4rem]" aria-hidden="true" />
            <LazyVisible
                loader={() => import('@/components/landing/Projects/Projects')}
                fallback={<SimpleLoader />}
                rootMargin="500px"
            />

            <LazyVisible
                loader={() => import('@/components/landing/Chat')}
                fallback={null}
                componentProps={{}}
            />
        </>
    )
}

export default Home