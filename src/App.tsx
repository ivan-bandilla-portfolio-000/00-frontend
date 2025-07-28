import TopBar from '@/components/TopBar';
import HeroSection from '@/components/landing/HeroSection';
import MiscRobot from './components/landing/MiscRobot';
import Chat from './components/landing/Chat';
import { LLMService, LLMContext } from '@/services/LLMService';
import { useEffect, useState, Suspense } from 'react';

const llm = new LLMService("You are a helpful assistant.");

function App() {
  const [llmReady, setLlmReady] = useState(false);

  useEffect(() => {
    (async () => {
      await llm.init();
      setLlmReady(true);
    })();
  }, []);

  return (
    <LLMContext.Provider value={llm}>
      <TopBar />
      <HeroSection />
      {/* <Suspense >
        {llmReady && <Chat />}
      </Suspense> */}
      <MiscRobot />
      <div id='fsdaf' style={{ height: '2000px', background: 'linear-gradient(#fff, #eee)' }}>
        <div style={{ paddingTop: '100px', textAlign: 'center', fontSize: '2rem' }}>
          Scroll down to see the TopBar shrink!
        </div>
      </div>
    </LLMContext.Provider>
  )
}

export default App
