import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalInputCasing } from './lib/inputCasing';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({ immediate: true });

// Initialize global auto-casing rules (uppercase for all text, lowercase for email, both for passwords)
setupGlobalInputCasing();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
