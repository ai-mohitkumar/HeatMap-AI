import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA Service Worker for web offline capability (skip file:// and native Android WebView bundle)
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const isNativeAndroidWebView =
  typeof window !== 'undefined' &&
  Boolean((window as unknown as { HeatShieldNativeGps?: unknown }).HeatShieldNativeGps);

if ('serviceWorker' in navigator && !isFileProtocol && !isNativeAndroidWebView) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || './'}sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then((reg) => {
        console.log('HeatShield PWA Service Worker active:', reg.scope);
        // Check for updates immediately
        reg.update().catch(() => {});
      })
      .catch((err) => console.warn('Service Worker registration skipped:', err));
  });
}

