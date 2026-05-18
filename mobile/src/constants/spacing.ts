// src/constants/spacing.ts — spacing scale + border radii

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  sm:   6,
  md:   12,
  lg:   18,
  xl:   24,
  full: 999,
} as const;

// Animation constants used throughout the app
export const anim = {
  // Timing durations
  fast:   150,    // quick feedback, button press
  normal: 300,    // standard transition
  slow:   600,    // deliberate entrance

  // Springs (for entrance animations — feel physical)
  spring: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },

  // Intervals
  charTypingMs:   40,   // LLM token character typing speed
  staggerItem:    80,   // between list items
  staggerSection: 150,  // between sections
  pulseLoop:      2000, // PulsingDot cycle duration
  scanLineCycle:  4000, // ScanLine sweep duration
  cursorBlink:    500,  // LLM cursor blink
} as const;
