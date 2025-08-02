import TopBar from '@/components/TopBar';

import { LLMService, LLMContext } from '@/services/LLMService';
import { useEffect, useState, Suspense } from 'react';
import Home from './pages/Home';
import { Routes, Route, useLocation } from 'react-router';
import Contact from './pages/Contact';

const llm = new LLMService("You are a helpful assistant.");

function App() {
  const [llmReady, setLlmReady] = useState(false);

  useEffect(() => {
    (async () => {
      await llm.init();
      setLlmReady(llm.requirementsMet && llm.initialized);
    })();
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <LLMContext.Provider value={llm}>
      <TopBar />
      <Routes>
        <Route path="/" element={<main><Home llmReady={llmReady} /></main>} />
        {/* <Route path="/projects" element={<main><Projects llmReady={llmReady} /></main>} /> */}
        {/* <Route path="/about" element={<main><About llmReady={llmReady} /></main>} /> */}
        <Route path="/contact" element={<main><Contact llmReady={llmReady} /></main>} />
      </Routes>
    </LLMContext.Provider>
  )
}

export default App
