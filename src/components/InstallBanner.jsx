import React, { useState, useEffect } from 'react';
import { triggerInstallPrompt } from '../main.jsx';

/**
 * InstallBanner
 * ─────────────
 * Shows a slim, non-intrusive "Add to Home Screen" bar at the
 * bottom of the viewport when the browser fires beforeinstallprompt.
 * Auto-hides after 12 seconds. Remembers dismissal in sessionStorage.
 * Does NOT modify any existing UI — it floats above everything via z-index.
 */
export default function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* Already dismissed this session */
    if (sessionStorage.getItem('varadhi-install-dismissed')) return;

    /* Listen for the signal emitted in main.jsx */
    const show = () => setVisible(true);
    window.addEventListener('varadhi-installable', show);

    /* Also check if prompt was already captured before we mounted */
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event('varadhi-installable'));
    }, 500);

    /* Auto-hide after 12 s */
    const autoHide = setTimeout(() => setVisible(false), 12000);

    return () => {
      window.removeEventListener('varadhi-installable', show);
      clearTimeout(timeout);
      clearTimeout(autoHide);
    };
  }, []);

  const handleInstall = () => {
    const triggered = triggerInstallPrompt();
    if (triggered) setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('varadhi-install-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Add Varadhi to Home Screen"
      style={{
        position: 'fixed',
        bottom: 72,           /* above BottomNav (64px) */
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 8888,
        width: 'calc(100% - 32px)',
        maxWidth: 398,
        background: '#1A1A1A',
        border: '1px solid rgba(255,45,45,0.3)',
        borderRadius: 16,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,45,45,0.1)',
        animation: 'installBannerIn 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Logo pill */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        border: '1.5px solid rgba(255,45,45,0.4)',
      }}>
        <img src="/road.jpeg" alt="Varadhi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>
          Add Varadhi to Home Screen
        </div>
        <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
          Instant access · Works offline
        </div>
      </div>

      {/* Install button */}
      <button
        id="varadhi-install-btn"
        onClick={handleInstall}
        style={{
          background: '#FF2D2D', color: '#fff', border: 'none',
          borderRadius: 10, padding: '8px 14px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Install
      </button>

      {/* Dismiss × */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', color: '#444',
          fontSize: 18, cursor: 'pointer', padding: '0 2px',
          lineHeight: 1, fontFamily: 'inherit', flexShrink: 0,
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes installBannerIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
