import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, CheckCircle, Mic, MicOff, Phone } from 'lucide-react';

/* ─── keyframes injected once ──────────────────────────── */
const CSS = `
@keyframes countdown-ring {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: 283; }
}
@keyframes row-in {
  from { opacity:0; transform:translateX(-18px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes check-pop {
  0%  { opacity:0; transform:scale(0.4); }
  70% { transform:scale(1.15); }
  100%{ opacity:1; transform:scale(1); }
}
@keyframes red-throb {
  0%,100%{ background:rgba(220,38,38,0.92); }
  50%    { background:rgba(185,28,28,0.88); }
}
@keyframes fade-up {
  from{ opacity:0; transform:translateY(10px); }
  to  { opacity:1; transform:translateY(0); }
}
`;

function injectCSS() {
  if (document.getElementById('sos-css')) return;
  const s = document.createElement('style');
  s.id = 'sos-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── Step 1: Countdown ────────────────────────────────── */
const RADIUS = 54;
const CIRC   = 2 * Math.PI * RADIUS; // ≈339

function CountdownScreen({ count, total, onCancel }) {
  const pct = count / total;
  const dash = CIRC * (1 - pct);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(180,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'red-throb 1s ease-in-out infinite',
    }}>
      {/* Pulsing rings */}
      <div style={{
        position: 'absolute', width: 240, height: 240, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.12)',
        animation: 'sos-ring 1.5s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.18)',
        animation: 'sos-ring 1.5s ease-out infinite',
        animationDelay: '0.4s',
      }} />

      {/* SVG countdown ring */}
      <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 28 }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="80" cy="80" r={RADIUS} fill="none"
            stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          {/* Progress */}
          <circle cx="80" cy="80" r={RADIUS} fill="none"
            stroke="#fff" strokeWidth="8"
            strokeDasharray={CIRC}
            strokeDashoffset={dash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        {/* Number */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{count}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 2 }}>seconds</span>
        </div>
      </div>

      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6, textAlign: 'center' }}>
        SOS firing in {count} second{count !== 1 ? 's' : ''}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 36, textAlign: 'center' }}>
        Auto-detected crash · G-force: 4.2g
      </div>

      <button onClick={onCancel} style={{
        padding: '16px 48px', borderRadius: 50,
        background: '#fff', border: 'none',
        color: '#B91C1C', fontSize: 15, fontWeight: 900,
        cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        letterSpacing: '0.02em',
      }}>
        Cancel SOS
      </button>
      <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
        Tap cancel to dismiss
      </div>
    </div>
  );
}

/* ─── Step 2: Agency ignition ──────────────────────────── */
const AGENCIES = [
  { emoji: '🚓', name: 'Madurai North Police Station', status: 'Notified',   time: '0.8s', delay: 0 },
  { emoji: '🚑', name: 'Ambulance #TN-0432',           status: 'Dispatched', time: '1.1s', delay: 350 },
  { emoji: '🚒', name: 'Fire Station Tallakulam',      status: 'Alerted',    time: '1.4s', delay: 700 },
];

function AgencyScreen({ onComplete }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    AGENCIES.forEach((_, i) => {
      setTimeout(() => setVisible(v => [...v, i]), 400 + i * 350);
    });
    const t = setTimeout(onComplete, 400 + AGENCIES.length * 350 + 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      {/* Severity badge */}
      <div style={{
        padding: '5px 18px', borderRadius: 20, marginBottom: 28,
        background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(239,68,68,0.4)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'blink 1s infinite', display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', letterSpacing: '0.15em' }}>CRITICAL</span>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>
        Emergency services contacted
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 30 }}>
        Source: Voice analysis · G-force 4.2g
      </div>

      {/* Agency rows */}
      <div style={{ width: '100%', maxWidth: 340 }}>
        {AGENCIES.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', marginBottom: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            opacity: visible.includes(i) ? 1 : 0,
            transform: visible.includes(i) ? 'translateX(0)' : 'translateX(-18px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{a.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>{a.name}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Response: {a.time}</div>
            </div>
            <div style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
              color: '#4ADE80', whiteSpace: 'nowrap',
            }}>
              {a.status}
            </div>
          </div>
        ))}
      </div>

      {/* ETA */}
      <div style={{
        marginTop: 24, padding: '12px 24px', borderRadius: 14,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Ambulance ETA</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#F87171' }}>11 min</div>
      </div>
    </div>
  );
}

/* ─── Step 3: Black box confirmation ────────────────────── */
const CONFIRMATIONS = [
  { text: 'MLC auto-filed',          sub: 'Madurai North PS',     delay: 200 },
  { text: 'Insurance claim opened',  sub: 'HDFC Ergo',            delay: 550 },
  { text: 'Hospital pre-notified',   sub: 'Meenakshi Mission',    delay: 900 },
  { text: 'Bystander alert sent',    sub: '3 people notified',    delay: 1250 },
];

function BlackBoxScreen({ onReset }) {
  const [visible, setVisible] = useState([]);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    CONFIRMATIONS.forEach((c, i) => {
      setTimeout(() => setVisible(v => [...v, i]), c.delay);
    });
    setTimeout(() => setShowBottom(true), 1800);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: '#050505',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      {/* Header */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%', marginBottom: 20,
        background: 'rgba(22,163,74,0.15)', border: '2px solid rgba(74,222,128,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 28px rgba(74,222,128,0.2)',
      }}>
        <CheckCircle size={26} color="#4ADE80" />
      </div>

      <div style={{ fontSize: 16, fontWeight: 900, color: '#F5F5F5', marginBottom: 4 }}>Black Box Filed</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 28 }}>All systems confirmed</div>

      {/* Confirmation rows */}
      <div style={{ width: '100%', maxWidth: 340 }}>
        {CONFIRMATIONS.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', marginBottom: 8,
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: 12,
            opacity: visible.includes(i) ? 1 : 0,
            transform: visible.includes(i) ? 'scale(1)' : 'scale(0.92)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: visible.includes(i) ? 'rgba(74,222,128,0.2)' : 'transparent',
              border: '1.5px solid rgba(74,222,128,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s',
            }}>
              {visible.includes(i) && <CheckCircle size={13} color="#4ADE80" />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>{c.text}</div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: calm message + share */}
      {showBottom && (
        <div style={{
          marginTop: 24, textAlign: 'center', width: '100%', maxWidth: 340,
          animation: 'fade-up 0.5s ease-out both',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>
            Stay calm. Help is on the way.
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16 }}>
            Ambulance ETA: 11 min · Police: en route
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '11px 22px',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#1D4ED8,#1E40AF)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              boxShadow: '0 0 14px rgba(29,78,216,0.4)',
            }}>
              <Share2 size={13} /> Share Location
            </button>
            <button onClick={onReset} style={{
              padding: '11px 18px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Idle / resting SOS screen ────────────────────────── */
const EMERG_TYPES = [
  { id: 'accident', label: 'Road Accident', icon: '🚗', col: '#EF4444' },
  { id: 'medical',  label: 'Medical',       icon: '🏥', col: '#EC4899' },
  { id: 'fire',     label: 'Fire',          icon: '🔥', col: '#F97316' },
  { id: 'flood',    label: 'Flood',         icon: '🌊', col: '#3B82F6' },
  { id: 'crime',    label: 'Crime',         icon: '🚨', col: '#A855F7' },
  { id: 'other',    label: 'Other',         icon: '⚠️', col: '#EAB308' },
];

/* ─── Main ─────────────────────────────────────────────── */
export default function SOSPage() {
  useEffect(() => { injectCSS(); }, []);

  // phase: idle | countdown | agencies | blackbox
  const [phase, setPhase]       = useState('idle');
  const [count, setCount]       = useState(10);
  const [selType, setSelType]   = useState('accident');
  const [recording, setRecording] = useState(false);
  const timerRef = useRef(null);
  const TOTAL = 10;

  const startSOS = () => {
    if (phase !== 'idle') return;
    setCount(TOTAL);
    setPhase('countdown');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    let c = TOTAL;
    timerRef.current = setInterval(() => {
      c -= 1;
      setCount(c);
      if (navigator.vibrate) navigator.vibrate(80);
      if (c <= 0) {
        clearInterval(timerRef.current);
        setPhase('agencies');
      }
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(timerRef.current);
    setPhase('idle');
    setCount(TOTAL);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Overlay phases ── */}
      {phase === 'countdown' && (
        <CountdownScreen count={count} total={TOTAL} onCancel={cancelSOS} />
      )}
      {phase === 'agencies' && (
        <AgencyScreen onComplete={() => setPhase('blackbox')} />
      )}
      {phase === 'blackbox' && (
        <BlackBoxScreen onReset={cancelSOS} />
      )}

      {/* ── Idle screen ── */}
      <div className="scroll-area" style={{ flex: 1, paddingBottom: 16 }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>
            Emergency Trigger
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F5F5F5', margin: 0 }}>SOS Alert</h1>
        </div>

        {/* Emergency type grid */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Emergency Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {EMERG_TYPES.map(({ id, label, icon, col }) => (
              <button key={id} onClick={() => setSelType(id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                background: selType === id ? `${col}18` : 'rgba(255,255,255,0.04)',
                border: selType === id ? `2px solid ${col}` : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.18s',
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: selType === id ? '#F5F5F5' : '#9CA3AF' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Big SOS button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 20px' }}>
          <div style={{
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(139,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'sos-ring 2s ease-out infinite',
          }}>
            <button onClick={startSOS} className="animate-sos-pulse" style={{
              width: 160, height: 160, borderRadius: '50%', border: 'none',
              background: 'linear-gradient(145deg,#DC2626,#7F1D1D)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.2)',
            }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>SOS</span>
              <span style={{ fontSize: 11, color: 'rgba(255,200,200,0.8)', fontWeight: 600, marginTop: 2 }}>Tap to activate</span>
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#4B5563', textAlign: 'center' }}>
            10-second countdown before dispatch
          </div>
        </div>

        {/* Voice SOS */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
          }}>
            <button onClick={() => setRecording(r => !r)} style={{
              width: 46, height: 46, borderRadius: '50%', border: 'none',
              background: recording ? '#DC2626' : '#1F1F1F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              animation: recording ? 'blink 1s ease-in-out infinite' : 'none',
              boxShadow: recording ? '0 0 14px rgba(220,38,38,0.5)' : 'none',
            }}>
              {recording ? <Mic size={20} color="#fff" /> : <MicOff size={20} color="#6B7280" />}
            </button>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>Voice SOS</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                {recording ? 'Recording… speak your emergency' : 'Tap mic to describe your emergency'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick dial */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Quick Dial
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { num: '112', label: 'Emergency', icon: '🚨', col: '#EF4444' },
              { num: '108', label: 'Ambulance', icon: '🚑', col: '#EC4899' },
              { num: '101', label: 'Fire',      icon: '🔥', col: '#F97316' },
            ].map(({ num, label, icon, col }) => (
              <a key={num} href={`tel:${num}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '12px 8px', borderRadius: 14, textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: col }}>{num}</span>
                <span style={{ fontSize: 10, color: '#6B7280' }}>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
