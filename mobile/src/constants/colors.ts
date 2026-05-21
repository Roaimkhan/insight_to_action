export const colors = {

  // ── Base Surfaces ──────────────────────────────────────────────────────
  bg: {
    root:       '#E8EEF8',              // screen root — deeper cool off-white for stronger contrast
    surface:    '#FFFFFF',              // card surfaces — pure white for maximum contrast
    elevated:   '#F7FAFF',              // modal, popover, elevated panel
    sunken:     '#DCE5F2',              // input fields, inset areas
    glass:      'rgba(255, 255, 255, 0.78)',  // glassmorphism panel surface
    glassDark:  'rgba(232, 238, 248, 0.90)',  // heavier glass for overlays
    overlay:    'rgba(15, 23, 42, 0.55)',     // modal backdrop
    terminal:   '#0D1117',              // LLM log terminal background — stays dark
  },

  // ── Accent Colors — ONE semantic role each ─────────────────────────────
  accent: {
    // Primary / Live
    cyan:       '#0078B8',             // LIVE · ACTIVE · primary CTA — deeper teal-blue
    cyanLight:  '#D9F3FB',             // cyan tint background
    cyanGlow:   'rgba(0, 120, 184, 0.24)',  // cyan shadow/glow

    // Success
    emerald:    '#047857',             // SUCCESS · resolved · completed
    emeraldLight: '#D9FBEA',           // emerald tint background
    emeraldGlow:  'rgba(4, 120, 87, 0.24)',

    // Warning
    amber:      '#B45309',             // WARNING · stale · Tier 1 heal
    amberLight: '#FFF1D6',             // amber tint background
    amberGlow:  'rgba(180, 83, 9, 0.24)',

    // Danger
    crimson:    '#B91C1C',             // FAILURE · contradiction · Tier 3
    crimsonLight: '#FFE0E0',           // crimson tint background
    crimsonGlow:  'rgba(185, 28, 28, 0.24)',

    // LLM Reasoning
    violet:     '#6D28D9',             // THINKING · LLM stream only
    violetLight: '#E9E2FF',            // violet tint background
    violetGlow:  'rgba(109, 40, 217, 0.24)',

    // Fallback / Tier 2
    tangerine:  '#C2410C',             // TIER 2 SELF-HEAL only
    tangerineLight: '#FFE4CC',
    tangerineGlow:  'rgba(194, 65, 12, 0.24)',
  },

  // ── Text ───────────────────────────────────────────────────────────────
  text: {
    primary:    '#0B1220',             // main text — near-black, not pure black
    secondary:  '#334155',             // descriptions, body
    muted:      '#64748B',             // timestamps, metadata, placeholders
    disabled:   '#A8B4C7',             // inactive elements
    inverse:    '#FFFFFF',             // text on dark backgrounds
    onCyan:     '#FFFFFF',             // text on cyan bg
    onEmerald:  '#FFFFFF',             // text on emerald bg
    terminal:   '#7FDBFF',             // terminal output — stays bright on dark
    llm:        '#A78BFA',             // LLM stream text — violet on dark terminal
  },

  // ── Borders ────────────────────────────────────────────────────────────
  border: {
    subtle:     'rgba(15, 23, 42, 0.08)',    // resting card border
    default:    'rgba(15, 23, 42, 0.16)',    // standard border
    medium:     'rgba(15, 23, 42, 0.24)',    // emphasized border
    strong:     'rgba(15, 23, 42, 0.40)',    // divider, strong border
    cyan:       'rgba(0, 120, 184, 0.40)',   // active/focused
    cyanStrong: 'rgba(0, 120, 184, 0.70)',   // highly active
    emerald:    'rgba(4, 120, 87, 0.40)',   // success
    amber:      'rgba(180, 83, 9, 0.40)',   // warning
    crimson:    'rgba(185, 28, 28, 0.46)',   // danger
    violet:     'rgba(109, 40, 217, 0.36)',  // LLM thinking
  },

  // ── Glass Blur Borders ─────────────────────────────────────────────────
  glass: {
    border:     'rgba(255, 255, 255, 0.82)',  // glass card outer border
    innerBorder:'rgba(255, 255, 255, 0.50)',  // glass card inner highlight
    shadow:     'rgba(15, 23, 42, 0.14)',     // glass card drop shadow
  },

  // ── Gradients (as LinearGradient color arrays) ─────────────────────────
  gradient: {
    screenBg:   ['#E8EEF8', '#F0F4FB', '#E8EEF8'],  // subtle screen bg
    cardSheen:  ['#FFFFFF', '#F6FAFF'],              // card surface
    glassPanel: ['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.60)'],
    cyanStreak: ['rgba(0,120,184,0.10)', 'rgba(0,120,184,0.00)'],
    crimsonFlare:['rgba(185,28,28,0.12)', 'rgba(185,28,28,0.00)'],
    emeraldPulse:['rgba(4,120,87,0.12)', 'rgba(4,120,87,0.00)'],
    shimmer:    ['#E8EEF8', '#FFFFFF', '#E8EEF8'],   // loading shimmer
    headerBar:  ['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.86)'],
    terminalBg: ['#0D1117', '#111827'],               // terminal stays dark
  },

} as const;

export type ColorKey = typeof colors;
