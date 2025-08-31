if (typeof (window as any).requestIdleCallback === 'undefined') {
  (window as any).requestIdleCallback = function (cb: any, opts?: any) {
    const start = Date.now();
    return window.setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, opts?.timeout ?? 1);
  };
  (window as any).cancelIdleCallback = function (id: number) {
    clearTimeout(id);
  };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/css/index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router';
import { registerServiceWorker } from '@/services/registerServiceWorker';
import { initializeTrackingFromEnv } from '@/features/analytics/trackingClient';
import { event as gaEvent } from '@/features/analytics';

initializeTrackingFromEnv();

registerServiceWorker();

// simple dedupe to avoid flooding analytics with same error
const recentErrors = new Set<string>();
const DEDUPE_TTL = 60_000;

function safeGaEvent(name: string, payload: Record<string, any>) {
  try {
    // non-blocking best-effort
    setTimeout(() => gaEvent(name, payload), 0);
  } catch {
    // swallow - don't allow logging to throw
  }
}

window.addEventListener('error', (ev: ErrorEvent) => {
  const msg = ev.error?.message ?? ev.message ?? String(ev);
  const key = `${msg}:${ev.filename ?? ''}:${ev.lineno ?? ''}:${ev.colno ?? ''}`;
  if (recentErrors.has(key)) return;
  recentErrors.add(key);
  setTimeout(() => recentErrors.delete(key), DEDUPE_TTL);

  safeGaEvent('global_error', {
    message: String(msg).slice(0, 1000),
    filename: ev.filename,
    lineno: ev.lineno,
    colno: ev.colno,
    userAgent: navigator.userAgent,
    url: location.href,
    timestamp: new Date().toISOString(),
  });
});

window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
  const reason = ev.reason?.message ?? String(ev.reason ?? 'unknown');
  const key = `rej:${reason}`;
  if (recentErrors.has(key)) return;
  recentErrors.add(key);
  setTimeout(() => recentErrors.delete(key), DEDUPE_TTL);

  safeGaEvent('unhandled_rejection', {
    reason: String(reason).slice(0, 1000),
    userAgent: navigator.userAgent,
    url: location.href,
    timestamp: new Date().toISOString(),
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
