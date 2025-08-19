import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router';
import TopBar from '@/components/TopBar';
import { ThemeProvider } from "@/features/theming/components/theme-provider";
import { ClientDBProvider } from '@/clientDB/context';
// import { useClientDB } from '@/clientDB/context';

import ErrorBoundary from '@/components/errors/ErrorBoundary';
import { LLMProvider } from '@/contexts/LLMContext';
import SimpleLoader from './components/SimpleLoader';
import NProgressRouteListener from './components/NProgress';
// import { PortfolioDataService } from '@/services/PortfolioDataService';

// Lazies
const Toaster = lazy(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })));
const ChatWidget = lazy(() => import('@/components/landing/Chat'));
const Home = lazy(() => import('@/pages/Home'));
const Contact = lazy(() => import('@/pages/Contact'));
const About = lazy(() => import('@/pages/About'));

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

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
        </LLMProvider>
      </ThemeProvider>
    </ClientDBProvider>
  );
}

export default App;