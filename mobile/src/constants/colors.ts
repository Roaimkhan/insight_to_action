// src/constants/colors.ts — the ONLY file where colors are defined
export const colors = {

  // ── Backgrounds ────────────────────────────────────────────────────
  bg: {
    primary:   '#070B14',              // deepest bg — screen root only
    secondary: '#0D1626',              // card surfaces
    elevated:  '#111D33',              // modals, popovers, elevated cards
    glass:     'rgba(13, 22, 38, 0.72)', // glassmorphism overlay
  },

  // ── Accents — ONE purpose per color ────────────────────────────────
  accent: {
    cyan:   '#00E5FF',   // LIVE / ACTIVE — primary actions, running state
    green:  '#00FF87',   // SUCCESS — completed steps, resolved contradictions
    amber:  '#FFB020',   // WARNING — stale sources, self-heal Tier 1
    red:    '#FF3D5A',   // FAILURE — contradictions, failed steps, Tier 3
    violet: '#8B5CF6',   // THINKING — LLM reasoning stream
    orange: '#FF6B35',   // FALLBACK — self-heal Tier 2 specifically
  },

  // ── Text ───────────────────────────────────────────────────────────
  text: {
    primary:   '#E8F4FF',  // main readable text
    secondary: '#7A96B8',  // secondary info, descriptions
    muted:     '#3D5A7A',  // timestamps, labels, placeholders
    inverse:   '#070B14',  // text on light/colored backgrounds
  },

  // ── Borders ────────────────────────────────────────────────────────
  border: {
    subtle:  'rgba(0, 229, 255, 0.08)',   // resting card border
    default: 'rgba(0, 229, 255, 0.18)',   // card border with slight presence
    active:  'rgba(0, 229, 255, 0.45)',   // active/focused element
    danger:  'rgba(255, 61, 90, 0.45)',   // contradiction, failure
    success: 'rgba(0, 255, 135, 0.45)',   // resolved, complete
    warning: 'rgba(255, 176, 32, 0.45)',  // stale, tier 1
  },

  // ── Gradients (use as LinearGradient colors arrays) ─────────────
  gradient: {
    cyanGlow:   ['#00E5FF22', '#00E5FF00'],      // active card bg wash
    redAlarm:   ['#FF3D5A33', '#FF3D5A00'],      // contradiction bg
    greenPulse: ['#00FF8733', '#00FF8700'],      // success bg
    cardSheen:  ['#111D33', '#0D1626'],           // card gradient
    shimmer:    ['#0D1626', '#1A2B47', '#0D1626'], // loading shimmer
    homeBg:     ['#070B14', '#0A0F1E', '#070B14'], // home screen bg
  },

} as const;

export type ColorKey = typeof colors;
