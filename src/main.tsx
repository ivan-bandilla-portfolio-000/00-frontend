import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/css/index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router';
import { registerServiceWorker } from '@/services/registerServiceWorker';
import { initTracking } from '@/features/analytics/index.ts';

// Configure tracking from env
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const IPINFO_TOKEN = import.meta.env.VITE_IPINFO_TOKEN as string | undefined;
const VENDOR_SCRIPT = import.meta.env.VITE_VENDOR_SCRIPT_URL as string | undefined; // e.g. Leadfeeder snippet URL
const ENABLE_FINGERPRINT = import.meta.env.VITE_ENABLE_FINGERPRINT === 'true';
const SEND_IDENTIFY_TO_GA = import.meta.env.VITE_SEND_IDENTIFY_TO_GA === 'true';

// initialize (only in production by default — remove PROD check to run in dev)
if (import.meta.env.PROD) {
  initTracking({
    gaId: GA_ID,
    ipinfoToken: IPINFO_TOKEN,
    vendorScriptUrl: VENDOR_SCRIPT,
    enableFingerprint: ENABLE_FINGERPRINT,
    sendIdentifyToGA: SEND_IDENTIFY_TO_GA,
  }).catch(console.error);
}

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
