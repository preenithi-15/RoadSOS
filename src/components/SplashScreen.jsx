import React, { useEffect, useRef } from 'react';

/*
  VARADHI Cinematic Splash — ~4 seconds total
  ─────────────────────────────────────────────
  0.0s  darkness
  0.3s  GPS pulse dot travels left → right across screen
  1.0s  pulse transforms into heartbeat (ECG) waveform
  2.0s  logo image wipes in (left → right clip-path)
  2.8s  ambient glow burst
  3.0s  VARADHI letters fade in staggered
  3.5s  light sweep
  3.9s  onDone() → app loads, splash fades out
*/

const TOTAL_MS = 3900;

export default function SplashScreen({ onDone }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);

  /* ── Canvas: GPS pulse + heartbeat ──────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf;
    let startTime = null;

    function resize() {
      canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener('resize', resize);

    // ECG path points (normalised 0-1)
    const HB_PTS = [
      [0,    0],  [0.12, 0],  [0.18,-0.08], [0.22, 0],
      [0.34, 0],  [0.42,-1.0],[0.48, 0.55], [0.54,-0.15],
      [0.60, 0],  [0.72, 0],  [0.78,-0.06], [0.82, 0], [1.0, 0],
    ];

    function eio(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function frame(ts) {
      if (!startTime) startTime = ts;
      const el  = ts - startTime;
      const ctx = canvas.getContext('2d');
      const W   = canvas.width;
      const H   = canvas.height;
      const cx  = W / 2;
      const cy  = H / 2;

      ctx.clearRect(0, 0, W, H);

      // ── 1. GPS pulse line (300ms – 1000ms) ───────────────
      const PL_START = 300,  PL_END = 1000;
      if (el >= PL_START && el < 1600) {
        const prog  = Math.min(1, (el - PL_START) / (PL_END - PL_START));
        const eased = eio(prog);

        let alpha = 1;
        if (el > 1200) alpha = 1 - Math.min(1, (el - 1200) / 400);

        const lx0 = cx - W * 0.4;
        const lx1 = cx + W * 0.4;
        const tipX = lerp(lx0, lx1, eased);
        const tailX = Math.max(lx0, tipX - W * 0.2);

        const grd = ctx.createLinearGradient(tailX, cy, tipX, cy);
        grd.addColorStop(0,   `rgba(255,59,59,0)`);
        grd.addColorStop(0.6, `rgba(255,59,59,${0.3 * alpha})`);
        grd.addColorStop(1,   `rgba(255,59,59,${alpha})`);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tailX, cy);
        ctx.lineTo(tipX, cy);
        ctx.strokeStyle = grd;
        ctx.lineWidth   = 1.5 * (window.devicePixelRatio || 1);
        ctx.shadowColor = '#FF3B3B';
        ctx.shadowBlur  = 10;
        ctx.stroke();

        // Leading dot
        const dotR = 3 * (window.devicePixelRatio || 1);
        const dg = ctx.createRadialGradient(tipX,cy,0, tipX,cy, dotR*3);
        dg.addColorStop(0,   `rgba(255,150,150,${alpha})`);
        dg.addColorStop(0.5, `rgba(255,59,59,${0.5*alpha})`);
        dg.addColorStop(1,   'transparent');
        ctx.beginPath(); ctx.arc(tipX, cy, dotR*3, 0, Math.PI*2);
        ctx.fillStyle = dg; ctx.fill();
        ctx.beginPath(); ctx.arc(tipX, cy, dotR, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,220,220,${alpha})`; ctx.fill();
        ctx.restore();
      }

      // ── 2. Heartbeat waveform (1000ms – 2200ms) ──────────
      const HB_START = 1000, HB_END = 2200;
      if (el >= HB_START && el < 2600) {
        const prog  = Math.min(1, (el - HB_START) / (HB_END - HB_START));
        let alpha   = 1;
        if (el > 2100) alpha = 1 - Math.min(1, (el - 2100) / 500);

        const segW = W * 0.42;
        const segH = H * 0.10;
        const pts  = HB_PTS.map(([px,py]) => ({
          x: cx - segW/2 + px*segW,
          y: cy + py*segH,
        }));

        // Calculate total path length
        let totalLen = 0;
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
          totalLen += Math.hypot(dx, dy);
        }
        const targetLen = totalLen * eio(prog);
        let drawnLen = 0;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
          const sLen = Math.hypot(dx, dy);
          if (drawnLen + sLen <= targetLen) {
            ctx.lineTo(pts[i].x, pts[i].y);
            drawnLen += sLen;
          } else {
            const f = (targetLen - drawnLen) / sLen;
            ctx.lineTo(pts[i-1].x + dx*f, pts[i-1].y + dy*f);
            break;
          }
        }

        const hg = ctx.createLinearGradient(cx-segW/2, cy, cx+segW/2, cy);
        hg.addColorStop(0,    `rgba(255,255,255,${0.25*alpha})`);
        hg.addColorStop(0.48, `rgba(255,59,59,${alpha})`);
        hg.addColorStop(0.52, `rgba(255,59,59,${alpha})`);
        hg.addColorStop(1,    `rgba(255,255,255,${0.25*alpha})`);

        ctx.strokeStyle = hg;
        ctx.lineWidth   = 2 * (window.devicePixelRatio || 1);
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';
        ctx.shadowColor = '#FF3B3B';
        ctx.shadowBlur  = 16;
        ctx.stroke();
        ctx.restore();
      }

      if (el < TOTAL_MS + 200) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── onDone after animation completes ───────────────── */
  useEffect(() => {
    const t = setTimeout(onDone, TOTAL_MS + 350);
    return () => clearTimeout(t);
  }, [onDone]);

  // CSS timing (in seconds) — must match ms constants above
  const logoDelay   = '2.0s';
  const ringDelay   = '2.9s';
  const glowDelay   = '2.5s';
  const sweepDelay  = '3.4s';
  const breatheDelay= '3.7s';
  const letterBase  = 3.0;
  const taglineDelay= '3.7s';

  return (
    <div
      ref={wrapRef}
      style={{
        position:   'fixed',
        inset:       0,
        zIndex:      9999,
        background: '#080808',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow:   'hidden',
      }}
    >
      {/* Canvas layer: pulse + heartbeat */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Logo + text — centred */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        transform: 'scale(0.7)',
        opacity: 0,
        animation: `varadhi-zoom-in 3.8s cubic-bezier(0.16,1,0.3,1) 1.8s forwards`,
      }}>

        {/* Logo image container */}
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Breathing glow */}
          <div style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,59,59,0.1) 0%, transparent 65%)',
            opacity: 0,
            animation: `varadhi-breathe-in 0.8s ease-out ${breatheDelay} forwards, varadhi-breathe 3s ease-in-out 4.5s infinite`,
            pointerEvents: 'none',
          }} />

          {/* Neon ring */}
          <div style={{
            position: 'absolute',
            width: 236,
            height: 236,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,59,59,0)',
            boxShadow: 'none',
            opacity: 0,
            animation: `varadhi-ring ${ringDelay}`,
            animationName: 'varadhi-ring',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-out',
            animationDelay: ringDelay,
            animationFillMode: 'forwards',
          }} />

          {/* Ambient glow burst */}
          <div style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,59,59,0.25) 0%, transparent 70%)',
            opacity: 0,
            animation: `varadhi-ambient 1.8s ease-out ${glowDelay} forwards`,
          }} />

          {/* THE ACTUAL LOGO — circular clip removes black square bg */}
          <div style={{
            width: 200, height: 200,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
            opacity: 0,
            animation: `varadhi-logo-fade 0.6s ease-out ${logoDelay} forwards`,
            filter: 'drop-shadow(0 0 0px rgba(255,59,59,0))',
            animationName: 'varadhi-logo-fade, varadhi-logo-glow',
            animationDuration: `0.6s, 1.4s`,
            animationTimingFunction: `ease-out, ease-out`,
            animationDelay: `${logoDelay}, ${logoDelay}`,
            animationFillMode: 'forwards, forwards',
          }}>
            {/* Wipe-reveal mask: a dark cover that slides away left→right */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 3,
              background: '#080808',
              transformOrigin: 'left center',
              animation: `varadhi-wipe-away 1.2s cubic-bezier(0.4,0,0.2,1) ${logoDelay} forwards`,
            }} />

            <img
              src="/road.jpeg"
              alt="VARADHI"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />

            {/* Light sweep — lives inside the circle clip */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 4,
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
              backgroundSize: '300% 100%', backgroundPosition: '200% 0',
              opacity: 0,
              animation: `varadhi-sweep 0.9s cubic-bezier(0.4,0,0.2,1) ${sweepDelay} forwards`,
            }} />
          </div>
        </div>

        {/* VARADHI brand letters */}
        <div style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Outfit', 'Rajdhani', sans-serif",
          fontWeight: 200,
          fontSize: '1.9rem',
          letterSpacing: '0.55em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          {'VARADHI'.split('').map((ch, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: 0,
                transform: 'translateY(10px)',
                color: ch === 'A' && i === 3 ? '#FF3B3B' : '#fff',
                textShadow: ch === 'A' && i === 3 ? '0 0 14px rgba(255,59,59,0.7)' : 'none',
                animation: `varadhi-letter 0.5s cubic-bezier(0.16,1,0.3,1) ${letterBase + i * 0.1}s forwards`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          marginTop: 10,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 300,
          fontSize: '0.58rem',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          opacity: 0,
          animation: `varadhi-tagline 1s ease-out ${taglineDelay} forwards`,
        }}>
          Road Safety · Emergency Response · Technology
        </div>
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300&display=swap');

        @keyframes varadhi-zoom-in {
          0%   { transform: scale(0.68); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes varadhi-logo-fade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes varadhi-logo-glow {
          0%   { filter: drop-shadow(0 0 0px  rgba(255,59,59,0)); }
          50%  { filter: drop-shadow(0 0 22px rgba(255,59,59,0.7)) drop-shadow(0 0 5px rgba(255,255,255,0.15)); }
          100% { filter: drop-shadow(0 0 12px rgba(255,59,59,0.4)) drop-shadow(0 0 2px rgba(255,255,255,0.08)); }
        }
        @keyframes varadhi-wipe-away {
          0%   { transform: scaleX(1); transform-origin: left center; }
          100% { transform: scaleX(0); transform-origin: left center; }
        }
        @keyframes varadhi-ring {
          0%   { opacity: 0; box-shadow: none; border-color: rgba(255,59,59,0); }
          40%  { opacity: 1; box-shadow: 0 0 28px 5px rgba(255,59,59,0.4); border-color: rgba(255,59,59,0.65); }
          100% { opacity: 0.55; box-shadow: 0 0 16px 3px rgba(255,59,59,0.22); border-color: rgba(255,59,59,0.42); }
        }
        @keyframes varadhi-ambient {
          0%   { opacity: 0; transform: scale(0.4); }
          35%  { opacity: 1; transform: scale(1.6); }
          70%  { opacity: 0.45; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        @keyframes varadhi-sweep {
          0%   { opacity: 0; background-position: 200% 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; background-position: -200% 0; }
        }
        @keyframes varadhi-letter {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes varadhi-tagline {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes varadhi-breathe-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes varadhi-breathe {
          0%, 100% { transform: scale(1);   opacity: 0.7; }
          50%       { transform: scale(1.12); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
