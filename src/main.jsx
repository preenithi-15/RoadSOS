import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/* ── Service Worker Registration ───────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[Varadhi] SW registered — scope:', reg.scope);

        /* Notify when a new SW is waiting (app update available) */
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Varadhi] New version available — will activate on next visit');
            }
          });
        });
      })
      .catch(err => console.warn('[Varadhi] SW registration failed:', err));
  });
}

/* ── Install Prompt (Add to Home Screen) ───────────────── */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();                 // stop browser mini-bar
  deferredPrompt = e;
  window.dispatchEvent(new Event('varadhi-installable'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  console.log('[Varadhi] App installed to home screen');
});

/* Export so components can trigger the prompt */
export function triggerInstallPrompt() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    console.log('[Varadhi] Install choice:', choice.outcome);
    deferredPrompt = null;
  });
  return true;
}

/* ── Render ─────────────────────────────────────────────── */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
