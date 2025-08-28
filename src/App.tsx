import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router';
import TopBar from '@/components/TopBar';
import { ThemeProvider } from "@/features/theming/components/theme-provider";
import { ClientDBProvider } from '@/clientDB/context';
// import { useClientDB } from '@/clientDB/context';
import { pageview } from '@/features/analytics';

import ErrorBoundary from '@/components/errors/ErrorBoundary';
import SimpleLoader from './components/SimpleLoader';
import NProgressRouteListener from './components/NProgress';
// import { PortfolioDataService } from '@/services/PortfolioDataService';

// Lazies
const Toaster = lazy(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })));
const ChatWidget = lazy(() => import('@/components/landing/Chat'));
const Home = lazy(() => import('@/pages/Home'));
const Contact = lazy(() => import('@/pages/Contact'));
const About = lazy(() => import('@/pages/About'));
import { LLMProvider as WebLlmProvider } from '@/contexts/LLMContext';


// function DataBootstrapper() {
//   const db = useClientDB();
//   useEffect(() => {
//     if (!db) return;
//     PortfolioDataService.ensureAndGetAll(db).catch(console.error);
//   }, [db]);
//   return null;
// }

function Layout() {
  const [showChat, setShowChat] = useState(false);
  useEffect(() => {
    const fire = () => {
      // Notify hooks waiting to lazily start LLM work
      window.dispatchEvent(new Event('first-user-interaction'));
    };
    const onFirst = () => {
      setShowChat(true);
      fire();
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
    window.addEventListener('pointerdown', onFirst, { once: true });
    window.addEventListener('keydown', onFirst, { once: true });

    // Idle fallback (if no interaction after a while)
    const idleFallback = setTimeout(() => {
      if (!showChat) setShowChat(true);
      fire();
    }, 8000);

    requestIdleCallback?.(() => {
      // Secondary earlier hint (keeps deferral but can start sooner if system idle)
      fire();
    });

    return () => {
      clearTimeout(idleFallback);
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
  }, [showChat]);
  return (
    <>
      <TopBar />
      {showChat && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
      <Outlet />
    </>
  );
}

function App() {
  const location = useLocation();

  const [llmEnabled, setLlmEnabled] = useState(false);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    // send a GA page_view for SPA navigation (if GA initialized)
    const path = location.pathname + location.search + location.hash;
    pageview(path);
  }, [location]);

  // enable LLMProvider after first interaction (or idle timeout)
  useEffect(() => {
    const enable = () => setLlmEnabled(true);
    window.addEventListener('first-user-interaction', enable, { once: true });
    const t = setTimeout(enable, 8000); // fallback
    return () => {
      clearTimeout(t);
      window.removeEventListener('first-user-interaction', enable);
    };
  }, []);

  const children = (
    <>
      <Suspense fallback={null}>
        <Toaster richColors closeButton />
      </Suspense>
      <NProgressRouteListener />
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <ErrorBoundary>
                <Suspense fallback={<SimpleLoader />}>
                  <main><Home /></main>
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="contact"
            element={
              <Suspense fallback={<SimpleLoader />}>
                <main><Contact /></main>
              </Suspense>
            }
          />
          <Route
            path="about"
            element={
              <Suspense fallback={<SimpleLoader />}>
                <main><About /></main>
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </>
  );

  return (
    <ClientDBProvider>
      {/* <DataBootstrapper /> */}
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        {llmEnabled ? (
          <Suspense fallback={children}>
            <WebLlmProvider>{children}</WebLlmProvider>
          </Suspense>
        ) : (
          children
        )}
      </ThemeProvider>
    </ClientDBProvider>
  );
}

export default App;