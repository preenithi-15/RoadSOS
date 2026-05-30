import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StatusBar from './components/StatusBar';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import SOSPage from './pages/SOSPage';
import MedicalPage from './pages/MedicalPage';
import MapPage from './pages/MapPage';
import RespondersPage from './pages/RespondersPage';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

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
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Bottom navigation */}
        <BottomNav />
      </div>

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
