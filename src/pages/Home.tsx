import { HeroSection, MiscRobot, Projects, AboutMeChatLLM } from '@/components/landing';
import { Suspense } from 'react';

const Home = ({ llmReady }: { llmReady: boolean }) => {
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