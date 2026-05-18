// src/constants/animation.ts — Animation timing & spring configs

export const anim = {
  // Timing durations (ms)
  fast:   150,    // quick feedback, button press
  normal: 300,    // standard transition
  slow:   600,    // deliberate entrance

  // Spring configs (for framer-motion)
  spring: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },

  // Intervals
  charTypingMs:   40,   // LLM token character typing speed
  staggerItem:    80,   // between list items (ms)
  staggerSection: 150,  // between sections (ms)
  pulseLoop:      2000, // PulsingDot cycle duration
  scanLineCycle:  4000, // ScanLine sweep duration
  cursorBlink:    500,  // LLM cursor blink
} as const;

// Framer Motion variants
export const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: delay * 0.001,
      duration: 0.3,
      type: 'spring',
      damping: anim.spring.damping,
      stiffness: anim.spring.stiffness,
    },
  }),
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: anim.staggerItem * 0.001,
      delayChildren: 0.1,
    },
  },
};

export const slideUpVariant = {
  hidden: { y: 200, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 18,
      stiffness: 200,
    },
  },
  exit: {
    y: 200,
    opacity: 0,
    transition: {
      type: 'spring',
      damping: 18,
      stiffness: 200,
    },
  },
};

export const scaleInVariant = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 260,
    },
  },
};
