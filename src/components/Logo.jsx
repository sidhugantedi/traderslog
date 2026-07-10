// ============================================================
// The TradersLog — Logo Components
// Drop into src/components/Logo.jsx
// Usage:
//   <Logo size={48} />                  — mark only
//   <LogoFull size={48} />              — mark + wordmark
//   <LogoIcon size={32} dark />         — app icon (with bg)
// ============================================================

import React from 'react';

// ── Heatmap grid data ──────────────────────────────────────
// 5×5 opacity map, diagonal flow from top-right to bottom-left
const GRID_LIGHT = [
  [0.12, 0.28, 0.48, 0.68, 0.88],
  [0.28, 0.52, 0.78, 1.00, 1.00],
  [0.42, 0.72, 1.00, 0.72, 0.42],
  [1.00, 1.00, 0.70, 0.42, 0.18],
  [0.82, 0.56, 0.32, 0.15, 0.06],
];

const GRID_DARK = [
  [0.10, 0.22, 0.40, 0.60, 0.80],
  [0.22, 0.45, 0.70, 0.90, 1.00],
  [0.38, 0.65, 1.00, 0.65, 0.38],
  [1.00, 0.90, 0.65, 0.40, 0.18],
  [0.75, 0.50, 0.28, 0.13, 0.05],
];

// Cells that use the deeper emerald instead of mid-green
const ANCHOR_CELLS = new Set(['1-4', '2-2', '3-0']);

// ── Mark — pure heatmap grid ──────────────────────────────
export function Logo({ size = 48, dark = false }) {
  const grid   = dark ? GRID_DARK : GRID_LIGHT;
  const green  = dark ? '#34D399' : '#10B981';
  const anchor = dark ? '#10B981' : '#059669';
  const cell   = 22;
  const gap    = 5; // (156 - 5*22) / 4 ≈ 16.5 — using 27 pitch: 15 + (col * 27)
  const pitch  = 27;
  const offset = 15;

  return (
    <svg
      width='45px'
      height='45px'
      viewBox="0 0 156 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="The TradersLog mark"
    >
      {grid.map((row, r) =>
        row.map((opacity, c) => {
          const isAnchor = ANCHOR_CELLS.has(`${r}-${c}`);
          return (
            <rect
              key={`${r}-${c}`}
              x={offset + c * pitch}
              y={offset + r * pitch}
              width={cell}
              height={cell}
              rx={4}
              fill={isAnchor ? anchor : green}
              opacity={opacity}
            />
          );
        })
      )}
    </svg>
  );
}

// ── App icon — mark on rounded square bg ─────────────────
export function LogoIcon({ size = 50, dark = false }) {
  const bg    = dark ? '#0F1A16' : '#F0FDF9';
  const rx    = Math.round(size * 0.21); // ~20% corner radius

  if (size <= 20) {
    // Simplified 3×3 for tiny sizes (favicon)
    const green  = dark ? '#34D399' : '#10B981';
    const anchor = dark ? '#10B981' : '#059669';
    const tiny = [
      [0.9,  0.55, 0.25],
      [0.55, 1.00, 0.55],
      [0.25, 0.55, 0.90],
    ];
    const p = 42; // pitch in 156-space
    const o = 16;
    const s = 36;
    return (
      <svg width={size} height={size} viewBox="0 0 156 156" fill="none">
        <rect width="156" height="156" rx={rx * (156 / size)} fill={anchor}/>
        {tiny.map((row, r) =>
          row.map((op, c) => (
            <rect key={`${r}-${c}`} x={o + c*p} y={o + r*p} width={s} height={s} rx={6} fill="white" opacity={op}/>
          ))
        )}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 156 156" fill="none">
      <rect width="156" height="156" rx={rx * (156 / size)} fill={bg}/>
      <Logo size={size} dark={dark} />
    </svg>
  );
}

// ── Full lockup — mark + wordmark ────────────────────────
export function LogoFull({
  markSize = 48,
  fontSize = 32,
  dark = false,
  showTagline = false,
}) {
  const nameColor    = dark ? '#F0FDF4' : '#0F1A16';
  const theColor     = dark ? '#34D399' : '#059669';
  const taglineColor = dark ? '#4B7A62' : '#9CA3AF';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Logo size={markSize} dark={dark} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: fontSize * 0.8,
          fontWeight: 400,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: theColor,
          lineHeight: 1,
        }}>
          The
        </span>
        <span style={{
          fontFamily: "'Times New Roman",
          fontSize: '32px',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          color: nameColor,
        }}>
          Traders<span style={{ color: '#F59E0B' }}>L</span>og
        </span>
        {showTagline && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: fontSize * 0.28,
            letterSpacing: '0.16em',
            color: taglineColor,
            marginTop: 6,
          }}>
            TRACK · ANALYZE · IMPROVE
          </span>
        )}
      </div>
    </div>
  );
}

export default Logo;
