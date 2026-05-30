import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, MapPin, Zap, Users, Shield, AlertTriangle,
  TrendingUp, Wifi, ChevronRight, X, Navigation,
  Radio, Hospital, Phone, Activity, CheckCircle
} from 'lucide-react';

/* ─── MOCK DATA ──────────────────────────────────────────── */
const ALERTS = [
  {
    id: 1, level: 'red', emoji: '🔴',
    title: 'Road Hazard Detected',
    subtitle: 'NH-48, Near Toll Gate 3 · 2.1 km away',
    time: '2m ago',
    detail: 'A debris field has been confirmed on NH-48 near Toll Gate 3. Vehicles have been diverting via NH-44. Avoid the stretch between km 38–42. Varadhi responders have been notified.',
    distance: '2.1 km',
    location: 'NH-48, Toll Gate 3',
  },
  {
    id: 2, level: 'yellow', emoji: '🟡',
    title: 'Traffic Surge Alert',
    subtitle: 'Outer Ring Road — 45 min delay',
    time: '8m ago',
    detail: 'Heavy congestion on the Outer Ring Road between Silk Board Junction and Electronic City. Estimated delay: 45 minutes. Alternative route via Bannerghatta Road recommended.',
    distance: '4.5 km',
    location: 'Outer Ring Road',
  },
  {
    id: 3, level: 'green', emoji: '🟢',
    title: 'Network Coverage Restored',
    subtitle: 'Dead zone cleared · Sector 7 Bridge',
    time: '15m ago',
    detail: 'The network dead zone at Sector 7 Bridge has been resolved. Emergency communications are now fully operational in this corridor. Acoustic triggers are also functional.',
    distance: '1.8 km',
    location: 'Sector 7 Bridge',
  },
  {
    id: 4, level: 'blue', emoji: '🔵',
    title: 'Responder Nearby',
    subtitle: 'Priya Nair (Nurse) just came online',
    time: '22m ago',
    detail: 'Verified responder Priya Nair (Registered Nurse, 6 yrs experience) is now online and available for emergency response within 1.2 km of your location.',
    distance: '1.2 km',
    location: 'Near Koramangala',
  },
];

const LEVEL_STYLES = {
  red:    { border: '#FF2D2D', bg: 'rgba(255,45,45,0.08)',   dot: '#FF2D2D', text: '#FF6B6B' },
  yellow: { border: '#F59E0B', bg: 'rgba(245,158,11,0.08)', dot: '#F59E0B', text: '#FCD34D' },
  green:  { border: '#22C55E', bg: 'rgba(34,197,94,0.08)',  dot: '#22C55E', text: '#4ADE80' },
  blue:   { border: '#3B82F6', bg: 'rgba(59,130,246,0.08)', dot: '#3B82F6', text: '#60A5FA' },
};

/* ─── BOTTOM SHEET ───────────────────────────────────────── */
function AlertSheet({ alert, onClose }) {
  const s = LEVEL_STYLES[alert.level];
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, margin: '0 auto',
          background: '#111', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
          borderTop: `2px solid ${s.border}`,
          animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{alert.emoji}</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{alert.title}</div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{alert.time} · {alert.location}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#555', background: '#1A1A1A', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}33`,
          borderRadius: 12, padding: '12px 14px', marginBottom: 16,
        }}>
          <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>{alert.detail}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: '#1A1A1A', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ color: '#555', fontSize: 10, marginBottom: 2 }}>DISTANCE</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{alert.distance}</div>
          </div>
          <div style={{ flex: 2, background: '#1A1A1A', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ color: '#555', fontSize: 10, marginBottom: 2 }}>LOCATION</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{alert.location}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, sub, delay }) {
  return (
    <div style={{
      background: '#1A1A1A', borderRadius: 16, padding: '14px 14px 12px',
      border: '1px solid #2A2A2A', opacity: 0,
      animation: `fadeInUp 0.4s ease-out ${delay}ms forwards`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'rgba(255,45,45,0.15)', border: '1px solid rgba(255,45,45,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        <Icon size={16} color="#FF2D2D" />
      </div>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#888', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{label}</div>
      <div style={{ color: '#444', fontSize: 10, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ─── ALERT CARD ─────────────────────────────────────────── */
function AlertCard({ alert, onTap, delay }) {
  const s = LEVEL_STYLES[alert.level];
  return (
    <button
      onClick={() => onTap(alert)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: s.bg, borderRadius: 14,
        border: `1px solid ${s.border}33`,
        borderLeft: `3px solid ${s.border}`,
        padding: '12px 14px', width: '100%', textAlign: 'left',
        cursor: 'pointer', marginBottom: 8,
        opacity: 0, animation: `fadeInUp 0.4s ease-out ${delay}ms forwards`,
      }}
    >
      <span style={{ fontSize: 17, marginTop: 1, flexShrink: 0 }}>{alert.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{alert.title}</div>
        <div style={{ color: '#777', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {alert.subtitle}
        </div>
      </div>
      <div style={{ color: '#444', fontSize: 10, flexShrink: 0, marginTop: 2 }}>{alert.time}</div>
    </button>
  );
}

/* ─── MINI MAP ───────────────────────────────────────────── */
function MiniMap({ onViewFull }) {
  const dots = [
    { x: '38%', y: '42%', color: '#FF2D2D', pulse: true },
    { x: '62%', y: '30%', color: '#F59E0B', pulse: false },
    { x: '55%', y: '65%', color: '#FF2D2D', pulse: false },
  ];
  return (
    <div style={{
      background: '#111', borderRadius: 16, border: '1px solid #222',
      overflow: 'hidden', marginBottom: 16,
      opacity: 0, animation: 'fadeInUp 0.4s ease-out 600ms forwards',
    }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Hazard nodes near you</div>
          <div style={{ color: '#F59E0B', fontSize: 11, marginTop: 2 }}>⚠ 2 confirmed hazards within 10 km</div>
        </div>
        <button
          onClick={onViewFull}
          style={{ color: '#FF2D2D', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View map →
        </button>
      </div>

      {/* Map area */}
      <div style={{ position: 'relative', height: 110, background: '#0D0D0D', margin: '0 12px 12px', borderRadius: 10, overflow: 'hidden' }}>
        {/* Grid lines */}
        {[25, 50, 75].map(pct => (
          <React.Fragment key={pct}>
            <div style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, width: 1, background: '#1E1E1E' }} />
            <div style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: 1, background: '#1E1E1E' }} />
          </React.Fragment>
        ))}
        {/* Road lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M0,55 Q60,50 110,42 Q160,34 200,42" stroke="#2A2A2A" strokeWidth="2" fill="none" />
          <path d="M30,0 Q80,40 90,110" stroke="#2A2A2A" strokeWidth="2" fill="none" />
        </svg>
        {/* Location dots */}
        {dots.map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, transform: 'translate(-50%,-50%)' }}>
            {d.pulse && (
              <div style={{
                position: 'absolute', inset: -6, borderRadius: '50%',
                border: `1px solid ${d.color}`, opacity: 0.4,
                animation: 'pingRing 1.5s ease-out infinite',
              }} />
            )}
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, border: '2px solid #000' }} />
          </div>
        ))}
        {/* You are here */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 12, height: 12, borderRadius: '50%',
          background: '#3B82F6', border: '2px solid #fff',
        }} />
        <div style={{ position: 'absolute', bottom: 6, left: 8, color: '#444', fontSize: 9 }}>You</div>
      </div>
    </div>
  );
}

/* ─── HOME PAGE ──────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);
  const [syncCount, setSyncCount] = useState(12);
  const [lifelineSet] = useState(false); // toggle to true to see green state

  useEffect(() => {
    const t = setInterval(() => setSyncCount(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="scroll-area" style={{ height: '100%', paddingBottom: 12 }}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Wordmark */}
          <div style={{
            color: '#fff', fontWeight: 300, fontSize: 22,
            letterSpacing: '0.22em', textTransform: 'lowercase',
            fontFamily: "'Outfit', 'Inter', sans-serif",
          }}>
            varadhi
          </div>

          {/* Right: Bell + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Bell with dot */}
            <button
              style={{ position: 'relative', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: 8, cursor: 'pointer' }}
              aria-label="Notifications"
            >
              <Bell size={16} color="#ccc" />
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 7, height: 7,
                borderRadius: '50%', background: '#FF2D2D', border: '1.5px solid #000',
              }} />
            </button>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF2D2D, #8B0000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
            }}>
              AS
            </div>
          </div>
        </div>

        {/* ── SYSTEM STATUS BAR ──────────────────────────── */}
        <div style={{ padding: '8px 18px 14px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.08)', borderRadius: 20,
            padding: '4px 12px', border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'blink 2s ease-in-out infinite' }} />
            <span style={{ color: '#22C55E', fontSize: 11, fontWeight: 500 }}>
              System Active · GPS locked · Last sync {syncCount}s ago
            </span>
          </div>
        </div>

        {/* ── STAT CARDS ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
          <StatCard icon={MapPin}  value="5.2km" label="Nearest hospital"  sub="Meenakshi Mission"        delay={50}  />
          <StatCard icon={Zap}     value="98%"   label="System uptime"     sub="All services live"        delay={120} />
          <StatCard icon={Users}   value="4"     label="Responders nearby" sub="Verified & active"        delay={190} />
          <StatCard icon={Shield}  value="0"     label="Active SOS near you" sub="All clear"              delay={260} />
        </div>

        {/* ── LIFELINE BANNER ────────────────────────────── */}
        {lifelineSet ? (
          <div style={{
            margin: '0 16px 16px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 14, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: 0, animation: 'fadeInUp 0.4s ease-out 320ms forwards',
          }}>
            <CheckCircle size={20} color="#22C55E" />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#22C55E', fontWeight: 700, fontSize: 12 }}>LifeLine active</div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>B+ · No critical allergies · QR ready</div>
            </div>
          </div>
        ) : (
          <div style={{
            margin: '0 16px 16px',
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 14, padding: '12px 16px',
            opacity: 0, animation: 'fadeInUp 0.4s ease-out 320ms forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12, marginBottom: 3 }}>
                  ⚠ LifeLine profile incomplete
                </div>
                <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>
                  Medics won't have your data at the crash scene
                </div>
              </div>
              <button
                onClick={() => navigate('/medical')}
                style={{
                  background: '#FF2D2D', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '7px 12px', fontSize: 11,
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                Complete Now →
              </button>
            </div>
          </div>
        )}

        {/* ── QUICK ACTIONS ──────────────────────────────── */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {/* Call 112 */}
            <a href="tel:112" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#1A1A1A', border: '1px solid #FF2D2D33', borderRadius: 14,
                padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,45,45,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={17} color="#FF2D2D" />
                </div>
                <span style={{ color: '#eee', fontSize: 11, fontWeight: 600 }}>Call 112</span>
              </div>
            </a>

            {/* Alert Zone */}
            <button
              onClick={() => navigate('/map')}
              style={{ background: '#1A1A1A', border: '1px solid #F59E0B33', borderRadius: 14, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: '100%' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={17} color="#F59E0B" />
              </div>
              <span style={{ color: '#eee', fontSize: 11, fontWeight: 600 }}>Alert Zone</span>
            </button>

            {/* Find Help */}
            <button
              onClick={() => navigate('/responders')}
              style={{ background: '#1A1A1A', border: '1px solid #3B82F633', borderRadius: 14, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: '100%' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={17} color="#3B82F6" />
              </div>
              <span style={{ color: '#eee', fontSize: 11, fontWeight: 600 }}>Find Help</span>
            </button>
          </div>
        </div>

        {/* ── RECENT ALERTS ──────────────────────────────── */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Recent Alerts
            </div>
            <button style={{ color: '#FF2D2D', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              See all →
            </button>
          </div>
          {ALERTS.map((a, i) => (
            <AlertCard key={a.id} alert={a} onTap={setActiveAlert} delay={350 + i * 60} />
          ))}
        </div>

        {/* ── MAP PREVIEW ────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>
          <MiniMap onViewFull={() => navigate('/map')} />
        </div>

        {/* ── SYSTEM STATUS FOOTER ───────────────────────── */}
        <div style={{
          margin: '0 16px 20px',
          background: '#111', border: '1px solid #1E1E1E', borderRadius: 16,
          padding: '14px 16px',
          opacity: 0, animation: 'fadeInUp 0.4s ease-out 700ms forwards',
        }}>
          <div style={{ color: '#555', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Varadhi corridor status
          </div>
          {[
            { icon: Radio,    label: 'Acoustic trigger',     status: 'Listening',           ok: true },
            { icon: Activity, label: 'Agency relay',         status: 'Connected',           ok: true },
            { icon: Hospital, label: 'Hospital network',     status: '3 hospitals synced',  ok: true },
            { icon: Navigation,label: 'Rural responder grid',status: '4 active near you',   ok: true },
          ].map(({ icon: Icon, label, status, ok }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: ok ? '#22C55E' : '#FF2D2D',
                boxShadow: ok ? '0 0 6px #22C55E88' : '0 0 6px #FF2D2D88',
              }} />
              <Icon size={13} color="#555" />
              <span style={{ color: '#666', fontSize: 12, flex: 1 }}>{label}</span>
              <span style={{ color: ok ? '#22C55E' : '#FF2D2D', fontSize: 11, fontWeight: 600 }}>{status}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── ALERT BOTTOM SHEET ─────────────────────────── */}
      {activeAlert && <AlertSheet alert={activeAlert} onClose={() => setActiveAlert(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes pingRing {
          0%   { transform: scale(1);   opacity: 0.5; }
          80%  { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        button { font-family: inherit; }
      `}</style>
    </>
  );
}
