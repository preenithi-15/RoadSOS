import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function StatusBar() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className="shrink-0 flex items-center justify-between px-5"
      style={{
        height: '44px',
        background: '#050505',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Time */}
      <span className="text-white font-bold" style={{ fontSize: '14px', letterSpacing: '0.02em' }}>
        {timeStr}
      </span>

      {/* Right icons */}
      <div className="flex items-center gap-1.5">
        <Signal size={14} className="text-gray-300" strokeWidth={2} />
        <Wifi size={14} className="text-gray-300" strokeWidth={2} />
        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <div className="relative w-6 h-3 border border-gray-400 rounded-sm flex items-center px-0.5">
            <div className="h-1.5 rounded-sm bg-green-400" style={{ width: '75%' }} />
          </div>
          <div className="w-0.5 h-1.5 bg-gray-400 rounded-r-sm" />
        </div>
      </div>
    </div>
  );
}
