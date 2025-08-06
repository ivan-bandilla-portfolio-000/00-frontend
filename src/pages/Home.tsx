import { HeroSection, MiscRobot, Projects, AboutMeChatLLM } from '@/components/landing';
import { Suspense, useEffect } from 'react';
import { useClientDB } from '@/clientDB/context';


const Home = ({ llmReady }: { llmReady: boolean }) => {

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
                projectTags.projectId.eq(1),
                projectTags.tagId.eq(tags.id)
            )
            .groupBy(tags.id) // Group by tag id to avoid duplicates
            .exec()
            .then((rows: any[]) => {
                console.log('Unique Tags for Project 1:', rows);
            });

        // Example: Get projects with a specific tag (e.g., tagId = 2)
        db.select(projects.name, projects.description)
            .from(projects, projectTags)
            .where(projectTags.tagId.eq(2), projectTags.projectId.eq(projects.id))
            .exec()
            .then((rows: any[]) => {
                console.log('Projects with tagId=2:', rows);
            });
    }, [db]);

    return (
        <>
            <HeroSection />
            <MiscRobot />
            <Projects />
            <Suspense>
                {/* <div>{llmReady ? "LLM is ready" : "LLM is not ready"}</div> */}
                {llmReady && <AboutMeChatLLM />}
            </Suspense>
        </>
    )
}

export default Home