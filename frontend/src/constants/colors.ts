// src/constants/colors.ts — the ONLY file where colors are defined
export const colors = {

  // ── Base Surfaces ──────────────────────────────────────────────────────
  bg: {
    root:       '#F0F4FA',              // screen root — cool off-white, never pure white
    surface:    '#FFFFFF',              // card surfaces — pure white for maximum contrast
    elevated:   '#FAFCFF',              // modal, popover, elevated panel
    sunken:     '#E8EDF5',              // input fields, inset areas
    glass:      'rgba(255, 255, 255, 0.62)',  // glassmorphism panel surface
    glassDark:  'rgba(240, 244, 250, 0.80)',  // heavier glass for overlays
    overlay:    'rgba(15, 23, 42, 0.45)',     // modal backdrop
    terminal:   '#0D1117',              // LLM log terminal background — stays dark
  },

  // ── Accent Colors — ONE semantic role each ─────────────────────────────
  accent: {
    // Primary / Live
    cyan:       '#0099CC',             // LIVE · ACTIVE · primary CTA — rich teal-blue
    cyanLight:  '#E6F6FB',             // cyan tint background
    cyanGlow:   'rgba(0, 153, 204, 0.18)',  // cyan shadow/glow

    // Success
    emerald:    '#059669',             // SUCCESS · resolved · completed
    emeraldLight: '#D1FAE5',           // emerald tint background
    emeraldGlow:  'rgba(5, 150, 105, 0.18)',

    // Warning
    amber:      '#D97706',             // WARNING · stale · Tier 1 heal
    amberLight: '#FEF3C7',             // amber tint background
    amberGlow:  'rgba(217, 119, 6, 0.18)',

    // Danger
    crimson:    '#DC2626',             // FAILURE · contradiction · Tier 3
    crimsonLight: '#FEE2E2',           // crimson tint background
    crimsonGlow:  'rgba(220, 38, 38, 0.18)',

    // LLM Reasoning
    violet:     '#7C3AED',             // THINKING · LLM stream only
    violetLight: '#EDE9FE',            // violet tint background
    violetGlow:  'rgba(124, 58, 237, 0.18)',

    // Fallback / Tier 2
    tangerine:  '#EA580C',             // TIER 2 SELF-HEAL only
    tangerineLight: '#FFEDD5',
    tangerineGlow:  'rgba(234, 88, 12, 0.18)',
    
    // Legacy support alias if needed
    teal:       '#0099CC',             // maps to cyan for active indicators
  },

  // ── Text ───────────────────────────────────────────────────────────────
  text: {
    primary:    '#0F172A',             // main text — near-black, not pure black
    secondary:  '#475569',             // descriptions, body
    muted:      '#94A3B8',             // timestamps, metadata, placeholders
    disabled:   '#CBD5E1',             // inactive elements
    inverse:    '#FFFFFF',             // text on dark backgrounds
    onCyan:     '#FFFFFF',             // text on cyan bg
    onEmerald:  '#FFFFFF',             // text on emerald bg
    terminal:   '#7FDBFF',             // terminal output — stays bright on dark
    llm:        '#A78BFA',             // LLM stream text — violet on dark terminal
  },

  // ── Borders ────────────────────────────────────────────────────────────
  border: {
    subtle:     'rgba(15, 23, 42, 0.06)',    // resting card border
    default:    'rgba(15, 23, 42, 0.12)',    // standard border
    medium:     'rgba(15, 23, 42, 0.20)',    // emphasized border
    strong:     'rgba(15, 23, 42, 0.35)',    // divider, strong border
    cyan:       'rgba(0, 153, 204, 0.30)',   // active/focused
    cyanStrong: 'rgba(0, 153, 204, 0.60)',   // highly active
    emerald:    'rgba(5, 150, 105, 0.35)',   // success
    amber:      'rgba(217, 119, 6, 0.35)',   // warning
    crimson:    'rgba(220, 38, 38, 0.40)',   // danger
    violet:     'rgba(124, 58, 237, 0.30)',  // LLM thinking
  },

  // ── Glass Blur Borders ─────────────────────────────────────────────────
  glass: {
    border:     'rgba(255, 255, 255, 0.70)',  // glass card outer border
    innerBorder:'rgba(255, 255, 255, 0.40)',  // glass card inner highlight
    shadow:     'rgba(15, 23, 42, 0.10)',     // glass card drop shadow
  },

  // ── Gradients (as LinearGradient color arrays) ─────────────────────────
  gradient: {
    screenBg:   ['#EDF2FB', '#F0F4FA', '#EDF2FB'],  // subtle screen bg
    cardSheen:  ['#FFFFFF', '#F8FAFF'],              // card surface
    glassPanel: ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.50)'],
    cyanStreak: ['rgba(0,153,204,0.08)', 'rgba(0,153,204,0.00)'],
    crimsonFlare:['rgba(220,38,38,0.10)', 'rgba(220,38,38,0.00)'],
    emeraldPulse:['rgba(5,150,105,0.10)', 'rgba(5,150,105,0.00)'],
    shimmer:    ['#F0F4FA', '#FFFFFF', '#F0F4FA'],   // loading shimmer
    headerBar:  ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.80)'],
    terminalBg: ['#0D1117', '#111827'],               // terminal stays dark
  },

} as const;

export type ColorKey = typeof colors;
