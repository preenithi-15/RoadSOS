import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StatusBar from './components/StatusBar';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import InstallBanner from './components/InstallBanner';
import HomePage from './pages/HomePage';
import SOSPage from './pages/SOSPage';
import MedicalPage from './pages/MedicalPage';
import MapPage from './pages/MapPage';
import RespondersPage from './pages/RespondersPage';
import CommunityPage from './pages/CommunityPage';
import TripPage from './pages/TripPage';
import { getUserId } from './lib/user.js';
import { watchForRecovery } from './lib/offline.js';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Init anonymous user on first load
    getUserId();
    // Auto-fire cached SOS when connectivity returns (dead-zone recovery)
    const cleanup = watchForRecovery((result) => {
      console.log('[App] Cached SOS fired on recovery:', result?.sos_id);
    });
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      {/*
        Mobile shell: fixed max-width centered on desktop,
        full screen on mobile devices.
      */}
      <div
        className="flex flex-col mx-auto relative overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '430px',
          height: '100dvh',
          background: '#0D0D0D',
          boxShadow: '0 0 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Splash — renders on top until dismissed */}
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

        {/* Status bar */}
        <StatusBar />

        {/* Page content — grows to fill available space */}
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/"           element={<HomePage />} />
            <Route path="/sos"        element={<SOSPage />} />
            <Route path="/medical"    element={<MedicalPage />} />
            <Route path="/map"        element={<MapPage />} />
            <Route path="/responders" element={<RespondersPage />} />
            <Route path="/community"  element={<CommunityPage />} />
            <Route path="/trip"       element={<TripPage />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Bottom navigation */}
        <BottomNav />
      </div>

      {/* PWA install banner — floats above nav, position:fixed */}
      <InstallBanner />

      {/* Desktop background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #000000 100%)',
        }}
      />
    </BrowserRouter>
  );
}
