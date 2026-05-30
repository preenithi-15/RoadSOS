import React from 'react';

/**
 * Varadhi logo — faithful SVG recreation of the reference mark.
 *
 * Anatomy (all in a 200×200 viewBox):
 *   • Large thin outer circle
 *   • Classic shield with gothic-arch peak at top-center
 *   • Two-lane perspective road curving through shield's lower half (dashed white)
 *   • Red ECG / heartbeat line spanning full shield width
 *   • Two small hollow red circles (circuit nodes) on the ECG baseline
 *   • Optional wordmark: "var[a]dhi" — the 4th letter 'a' is red
 *   • Optional tagline
 *
 * Props:
 *   size      — overall px dimension (square canvas)
 *   showName  — whether to render wordmark + tagline below the circle
 */
export default function VaradhiLogo({ size = 200, showName = false }) {
  const W = 200;           // internal viewBox width
  const H = showName ? 270 : 200;  // viewBox height
  const cx = 100;
  const cy = 100;

  // ── Outer circle ──────────────────────────────────────
  const OR = 90;   // outer circle radius

  // ── Shield ─────────────────────────────────────────────
  // Gothic arch: two slanted top edges meeting at a top peak
  const shTop   = 18;   // peak y
  const shPeakX = cx;   // peak x  (100)
  const shW     = 52;   // half-width at the shoulder level
  const shShouY = 40;   // y where the shoulder begins
  const shBotY  = 165;  // bottom tip y

  // Path: peak → right shoulder → right side → bottom tip ← left side ← left shoulder ← peak
  const shieldPath = `
    M ${shPeakX} ${shTop}
    L ${cx + shW} ${shShouY}
    L ${cx + shW} ${cy + 15}
    Q ${cx + shW} ${shBotY - 18} ${cx} ${shBotY}
    Q ${cx - shW} ${shBotY - 18} ${cx - shW} ${cy + 15}
    L ${cx - shW} ${shShouY}
    Z
  `;

  // ── ECG line (horizontal across shield mid) ────────────
  const ecgY = cy - 2;             // baseline y
  const x0   = cx - shW + 1;      // left edge of shield
  const x7   = cx + shW - 1;      // right edge of shield

  // flat → sharp peak → trough → secondary rise → flat
  const ecgPoints = [
    [x0,          ecgY],
    [x0 + 16,     ecgY],
    [x0 + 28,     ecgY - 38],   // main peak
    [x0 + 36,     ecgY + 22],   // trough
    [x0 + 46,     ecgY - 18],   // secondary peak
    [x0 + 56,     ecgY],
    [x7,          ecgY],
  ].map(([x, y]) => `${x},${y}`).join(' ');

  // Circuit node positions (on the baseline, near left/right)
  const nodeLeft  = { cx: x0 + 10, cy: ecgY };
  const nodeRight = { cx: x7 - 10, cy: ecgY };

  // ── Road (perspective 2-lane through lower shield) ─────
  // Road lanes start wide at shield bottom and converge upward
  // Left lane outer / inner, Right lane inner / outer
  const roadTopY    = cy + 10;   // vanishing point area y
  const roadBottomY = shBotY - 10;

  // Left outer lane edge
  const llOuter = `M ${cx - 22} ${roadTopY} Q ${cx - 28} ${(roadTopY + roadBottomY) / 2} ${cx - 36} ${roadBottomY}`;
  // Left inner (centre line)
  const llInner = `M ${cx - 6}  ${roadTopY} Q ${cx - 10} ${(roadTopY + roadBottomY) / 2} ${cx - 16} ${roadBottomY}`;
  // Right inner (centre line)
  const rlInner = `M ${cx + 6}  ${roadTopY} Q ${cx + 10} ${(roadTopY + roadBottomY) / 2} ${cx + 16} ${roadBottomY}`;
  // Right outer lane edge
  const rlOuter = `M ${cx + 22} ${roadTopY} Q ${cx + 28} ${(roadTopY + roadBottomY) / 2} ${cx + 36} ${roadBottomY}`;

  const laneStyle = {
    fill: 'none',
    stroke: 'rgba(255,255,255,0.78)',
    strokeWidth: 1.6,
    strokeDasharray: '7 6',
    strokeLinecap: 'round',
  };

  return (
    <svg
      width={size}
      height={showName ? size * (H / W) : size}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Varadhi"
    >
      {/* ── Outer circle ── */}
      <circle
        cx={cx} cy={cy} r={OR}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.6"
      />

      {/* ── Shield outline ── */}
      <path
        d={shieldPath}
        fill="none"
        stroke="rgba(255,255,255,0.88)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* ── Road lanes ── */}
      <path d={llOuter} {...laneStyle} />
      <path d={llInner} {...laneStyle} />
      <path d={rlInner} {...laneStyle} />
      <path d={rlOuter} {...laneStyle} />

      {/* ── ECG line ── */}
      <polyline
        points={ecgPoints}
        fill="none"
        stroke="#FF2D2D"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Circuit node dots ── */}
      <circle
        cx={nodeLeft.cx} cy={nodeLeft.cy}
        r="4.2"
        fill="none"
        stroke="#FF2D2D"
        strokeWidth="1.6"
      />
      <circle
        cx={nodeRight.cx} cy={nodeRight.cy}
        r="4.2"
        fill="none"
        stroke="#FF2D2D"
        strokeWidth="1.6"
      />

      {/* ── Wordmark + tagline (optional) ── */}
      {showName && (
        <>
          {/*
            "varadhi" — split into spans so the 4th 'a' can be red.
            SVG doesn't have tspan colour per-letter easily, so we
            use two <text> elements offset by glyph measurement.
            Simpler approach: render each letter as its own tspan.
          */}
          <text
            x={cx}
            y={218}
            textAnchor="middle"
            fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
            fontSize="18"
            fontWeight="300"
            letterSpacing="5"
            fill="transparent"
          >
            {/* invisible to get correct box — actual letters below */}
            varadhi
          </text>

          {/* Render letter by letter so the 4th 'a' can be red */}
          {['v','a','r','a','d','h','i'].map((ch, i) => {
            // manually spaced — inter 18px weight-300 ≈ 10px per glyph + 5 spacing
            const glyphW = 11;
            const word   = 'varadhi';
            const totalW = (word.length - 1) * (glyphW) + 5 * (word.length - 1);
            // simpler: just use tspan with dx
            return null; // handled below
          })}

          {/* Single-line wordmark with tspan colours */}
          <text
            x={cx}
            y={218}
            textAnchor="middle"
            fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
            fontSize="18"
            fontWeight="300"
            letterSpacing="5"
          >
            <tspan fill="rgba(255,255,255,0.92)">var</tspan>
            <tspan fill="#FF2D2D">a</tspan>
            <tspan fill="rgba(255,255,255,0.92)">dhi</tspan>
          </text>

          {/* Tagline */}
          <text
            x={cx}
            y={240}
            textAnchor="middle"
            fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
            fontSize="9.5"
            fontWeight="400"
            letterSpacing="1.5"
            fill="#888888"
          >
            India&#39;s emergency corridor
          </text>
        </>
      )}
    </svg>
  );
}
