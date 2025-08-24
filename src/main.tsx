import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/css/index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router';
import { registerServiceWorker } from '@/services/registerServiceWorker';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
