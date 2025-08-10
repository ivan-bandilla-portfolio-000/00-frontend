import { HeroSection } from '@/components/landing';
import { useEffect } from 'react';
import { useClientDB } from '@/clientDB/context';
import { lf } from '@/clientDB/schema';
import SimpleLoader from '@/components/SimpleLoader';
import LazyVisible from '@/components/LazyVisible';
import { SparklesCore } from '@/components/ui/sparkles';


const Home = () => {

    const db = useClientDB();

    useEffect(() => {
        if (!db) return; // Wait for db to be ready

        const projects = db.getSchema().table('Projects');
        const tags = db.getSchema().table('Tags');
        const projectTags = db.getSchema().table('ProjectTags');

        // Example: Get all projects
        db.select().from(projects).exec().then((rows: any[]) => {
            console.log('All Projects:', rows);
        });

        // Example: Get all tags for project with id = 1
        db.select()
            .from(tags, projectTags)
            .where(
                lf.op.and(
                    projectTags.projectId.eq(1),
                    projectTags.tagId.eq(tags.id)
                )
            )
            .groupBy(tags.id) // Group by tag id to avoid duplicates
            .exec()
            .then((rows: any[]) => {
                console.log('Unique Tags for Project 1:', rows);
            });

        // Example: Get projects with a specific tag (e.g., tagId = 2)
        db.select(projects.name, projects.description)
            .from(projects, projectTags)
            .where(
                lf.op.and(
                    projectTags.tagId.eq(2),
                    projectTags.projectId.eq(projects.id)
                )
            )
            .exec()
            .then((rows: any[]) => {
                console.log('Projects with tagId=2:', rows);
            });
    }, [db]);



    return (
        <>
            <HeroSection />
            <div className='fixed contain-paint will-change-scroll inset-0 h-lvh'>
                <SparklesCore
                    id="tsparticles"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={500}
                    className="absolute -bottom-5 h-8 w-full z-50"
                    particleColor="#e60a64"
                />
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