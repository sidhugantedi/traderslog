// ============================================================
// The TradersLog — Brand Tokens (JS)
// Use in styled-components, Tailwind config, or inline styles
// import { colors, fonts, spacing, radii } from './brand.tokens';
// ============================================================

export const colors = {
  // Brand greens
  emerald:      '#059669',
  greenMid:     '#10B981',
  greenLight:   '#34D399',
  greenPale:    '#F0FDF9',

  // Accent
  amber:        '#F59E0B',
  amberLight:   '#FEF3C7',

  // Backgrounds
  bgLight:      '#F8FAF9',
  bgDark:       '#0F1A16',
  bgDarkSurface:'#162420',
  bgDarkBorder: '#1E3329',

  // Neutrals
  neutral100:   '#F3F4F6',
  neutral200:   '#E5E7EB',
  neutral300:   '#D1D5DB',
  neutral400:   '#9CA3AF',
  neutral500:   '#6B7280',
  neutral700:   '#374151',
  neutral900:   '#111827',

  // Semantic
  profit:       '#059669',
  profitBg:     '#ECFDF5',
  loss:         '#E24B4A',
  lossBg:       '#FEF2F2',
  warning:      '#F59E0B',
  info:         '#3B82F6',
  infoBg:       '#EFF6FF',
};

export const fonts = {
  display: "'Syne', sans-serif",
  body:    "'Space Grotesk', sans-serif",
  mono:    "'DM Mono', monospace",
};

export const fontWeights = {
  light:       300,
  regular:     400,
  medium:      500,
  semibold:    600,
  bold:        700,
  extrabold:   800,
};

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

export const radii = {
  sm:   '6px',
  md:   '10px',
  lg:   '16px',
  xl:   '24px',
  full: '9999px',
};

export const shadows = {
  sm:   '0 1px 3px rgba(0,0,0,0.06)',
  md:   '0 4px 12px rgba(0,0,0,0.08)',
  lg:   '0 8px 24px rgba(0,0,0,0.10)',
};

// ── Tailwind config extension ────────────────────────────
// Paste this into your tailwind.config.js theme.extend block:
//
// colors: {
//   emerald:    '#059669',
//   'green-mid':'#10B981',
//   amber:      '#F59E0B',
//   profit:     '#059669',
//   loss:       '#E24B4A',
// },
// fontFamily: {
//   display: ["'Syne'", 'sans-serif'],
//   body:    ["'Space Grotesk'", 'sans-serif'],
//   mono:    ["'DM Mono'", 'monospace'],
// },

// ── Heatmap grid opacity map ─────────────────────────────
// Used by the Logo component and the P&L heatmap calendar
export const heatmapGrid = {
  light: [
    [0.12, 0.28, 0.48, 0.68, 0.88],
    [0.28, 0.52, 0.78, 1.00, 1.00],
    [0.42, 0.72, 1.00, 0.72, 0.42],
    [1.00, 1.00, 0.70, 0.42, 0.18],
    [0.82, 0.56, 0.32, 0.15, 0.06],
  ],
  dark: [
    [0.10, 0.22, 0.40, 0.60, 0.80],
    [0.22, 0.45, 0.70, 0.90, 1.00],
    [0.38, 0.65, 1.00, 0.65, 0.38],
    [1.00, 0.90, 0.65, 0.40, 0.18],
    [0.75, 0.50, 0.28, 0.13, 0.05],
  ],
};

export default { colors, fonts, fontWeights, spacing, radii, shadows, heatmapGrid };
