import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, AlertOctagon, Map, Flag, Navigation } from 'lucide-react';
import { useLang } from '../lib/LangContext.jsx';
import { t } from '../lib/i18n.js';

const NAV_DEFS = [
  { to: '/',           key: 'nav.home',      Icon: Home },
  { to: '/map',        key: 'nav.map',       Icon: Map },
  { to: '/sos',        key: 'nav.sos',       Icon: AlertOctagon, isSOS: true },
  { to: '/trip',       key: 'nav.trip',      Icon: Navigation },
  { to: '/community',  key: 'nav.community', Icon: Flag },
];

export default function BottomNav() {
  const location = useLocation();
  const { lang } = useLang();

  return (
    <nav
      className="shrink-0 flex items-center justify-around border-t border-gray-800/80"
      style={{
        background: 'linear-gradient(to top, #080808 0%, #111111 100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        height: '64px',
      }}
    >
      {NAV_DEFS.map(({ to, key, Icon, isSOS }) => {
        const label = t(key);
        const active = location.pathname === to;

        if (isSOS) {
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center relative"
              style={{ flex: 1 }}
            >
              {/* Elevated SOS button */}
              <div
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-90 ${
                  active
                    ? 'bg-gradient-to-br from-red-600 to-red-900 red-glow'
                    : 'bg-gradient-to-br from-red-800 to-red-950 border border-red-900/60'
                }`}
                style={{ marginTop: '-22px', boxShadow: active ? '0 0 24px rgba(220,38,38,0.6)' : '0 4px 16px rgba(0,0,0,0.5)' }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className="text-white"
                />
                <span className="text-white font-black" style={{ fontSize: '9px', marginTop: '2px', letterSpacing: '0.08em' }}>
                  SOS
                </span>
              </div>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-90"
            style={{ flex: 1 }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              className={`transition-colors duration-150 ${active ? 'text-red-500' : 'text-gray-500'}`}
            />
            <span
              className={`font-semibold transition-colors duration-150 ${active ? 'text-red-400' : 'text-gray-600'}`}
              style={{ fontSize: '10px', letterSpacing: '0.04em' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute"
                style={{
                  bottom: 0,
                  width: '24px',
                  height: '2px',
                  background: 'linear-gradient(to right, #DC2626, #EF4444)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
