import { lazy, Suspense, useEffect } from 'react';
import TopBar from '@/components/TopBar';

const Toaster = lazy(() => import('@/components/ui/sonner').then(mod => ({ default: mod.Toaster })));
const Home = lazy(() => import('@/pages/Home'));
import { Routes, Route, useLocation } from 'react-router';
const Contact = lazy(() => import('@/pages/Contact'));
import { ThemeProvider } from "@/features/theming/components/theme-provider"
import { ClientDBProvider } from '@/clientDB/context';
// import { useClientDB } from '@/clientDB/context';
import ErrorBoundary from '@/components/errors/ErrorBoundary';
import { LLMProvider } from '@/contexts/LLMContext';
import SimpleLoader from './components/SimpleLoader';
import About from './pages/About';
// import { PortfolioDataService } from '@/services/PortfolioDataService';

// function DataBootstrapper() {
//   const db = useClientDB();
//   useEffect(() => {
//     if (!db) return;
//     PortfolioDataService.ensureAndGetAll(db).catch(console.error);
//   }, [db]);
//   return null;
// }

function App() {

  const location = useLocation();

  const ChatWidget = lazy(() =>
    import('@/components/landing/Chat')
  );

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
    <ClientDBProvider>
      {/* <DataBootstrapper /> */}
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <LLMProvider>
          <Suspense fallback={null}>
            <Toaster richColors closeButton />
          </Suspense>
          <TopBar />
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
          <Routes>
            <Route path="/" element={
              <ErrorBoundary>
                <Suspense fallback={<SimpleLoader />}>
                  <main><Home /></main>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/contact" element={
              <Suspense fallback={<SimpleLoader />}>
                <main><Contact /></main>
              </Suspense>
            } />
            <Route path="/about" element={
              <Suspense fallback={<SimpleLoader />}>
                <main><About /></main>
              </Suspense>
            } />
          </Routes>
        </LLMProvider>
      </ThemeProvider >
    </ClientDBProvider>
  )
}

export default App