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
      type: 'spring' as const,
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
      type: 'spring' as const,
      damping: 18,
      stiffness: 200,
    },
  },
  exit: {
    y: 200,
    opacity: 0,
    transition: {
      type: 'spring' as const,
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
      type: 'spring' as const,
      damping: 20,
      stiffness: 260,
    },
  },
};

// PHASE 1: PAGE ENTRANCE ANIMATIONS
export const pageEntranceVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 180,
      duration: 0.3,
    },
  },
};

export const sectionStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const sectionItemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.4,
      type: 'spring' as const,
      damping: 20,
      stiffness: 180,
    },
  }),
};

// Card hover variant for PHASE 2
export const cardHoverVariant = {
  hover: {
    y: -6,
    boxShadow: '0 20px 40px rgba(13,21,38,0.15)',
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
    },
  },
};

// Button hover variant for PHASE 2
export const buttonHoverVariant = {
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 32px rgba(24, 72, 200, 0.3)',
    transition: {
      type: 'spring' as const,
      damping: 18,
      stiffness: 300,
      duration: 0.15,
    },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// PHASE 3: INPUT FIELD ANIMATIONS
export const inputLabelVariant = {
  // Label floats up when input is focused or has value
  floating: {
    y: -24,
    scale: 0.85,
    color: 'var(--brand)',
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 260,
      duration: 0.2,
    },
  },
  // Label returns to normal position
  resting: {
    y: 0,
    scale: 1,
    color: 'var(--text-secondary)',
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 260,
      duration: 0.2,
    },
  },
};

export const inputFocusVariant = {
  // Border glow and scale on focus
  focused: {
    borderColor: 'var(--brand)',
    boxShadow: '0 0 0 2px rgba(24, 72, 200, 0.12), 0 0 12px rgba(24, 72, 200, 0.24)',
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
      duration: 0.15,
    },
  },
  // Normal state
  unfocused: {
    borderColor: 'var(--border-subtle)',
    boxShadow: '0 0 0 0px rgba(24, 72, 200, 0)',
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300,
      duration: 0.2,
    },
  },
};

// PHASE 4: ANIMATED BACKGROUNDS
export const gradientShiftVariant = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
    transition: {
      duration: 8,
      repeat: Infinity,
    },
  },
};

export const floatingVariant = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      type: 'tween' as const,
    },
  },
};

export const pulseGlowVariant = {
  animate: {
    opacity: [0.5, 1, 0.5],
    boxShadow: [
      '0 0 20px rgba(24, 72, 200, 0.3)',
      '0 0 40px rgba(24, 72, 200, 0.6)',
      '0 0 20px rgba(24, 72, 200, 0.3)',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      type: 'tween' as const,
    },
  },
};

// PHASE 5: LOADING & SUCCESS STATES
export const spinnerVariant = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

export const progressBarVariant = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1 },
  transition: {
    duration: 1.2,
    type: 'tween' as const,
  },
};

export const successCheckmarkVariant = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    duration: 0.6,
    type: 'tween' as const,
  },
};

export const bounceInVariant = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: {
    type: 'spring' as const,
    damping: 12,
    stiffness: 200,
    duration: 0.5,
  },
};

// PHASE 6: CHART & DATA ANIMATIONS
export const chartBarVariant = {
  initial: { scaleY: 0, opacity: 0 },
  animate: { scaleY: 1, opacity: 1 },
  transition: {
    type: 'spring' as const,
    damping: 15,
    stiffness: 200,
  },
};

export const numberCounterVariant = {
  // Use for animated counters - applies to container
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.4,
    type: 'tween' as const,
  },
};

export const gaugeNeedleVariant = {
  animate: (value: number) => ({
    rotate: value * 1.8, // Maps 0-100 to 0-180 degrees
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 150,
      duration: 1.2,
    },
  }),
};

export const dataPointStaggerVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      type: 'spring' as const,
      damping: 18,
      stiffness: 260,
    },
  }),
};

// PHASE 7: MODAL & OVERLAY ANIMATIONS
export const backdropVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: 0.3,
    type: 'tween' as const,
  },
};

export const modalVariant = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 200,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: {
      duration: 0.2,
      type: 'tween' as const,
    },
  },
};

export const overlaySlideVariant = {
  hidden: { x: 400, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      damping: 22,
      stiffness: 200,
      mass: 0.8,
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    transition: {
      duration: 0.25,
      type: 'tween' as const,
    },
  },
};

// PHASE 8: ICON & TYPOGRAPHY ANIMATIONS
export const iconRotateVariant = {
  initial: { rotate: 0 },
  animate: { rotate: 360 },
  transition: {
    duration: 0.6,
    type: 'spring' as const,
    damping: 16,
    stiffness: 200,
  },
};

export const iconScalePulseVariant = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      damping: 14,
      stiffness: 260,
    },
  },
};

export const textCharacterStaggerVariant = {
  hidden: { opacity: 0, y: 4 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.03,
      duration: 0.3,
      type: 'tween' as const,
    },
  }),
};

export const headingRevealVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 18,
      stiffness: 180,
      duration: 0.6,
    },
  },
};

// PHASE 9: AGENT/LLM STREAM ANIMATIONS
export const tokenTypeVariant = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: {
    duration: 0.15,
    type: 'spring' as const,
    damping: 16,
    stiffness: 300,
  },
};

export const sourceIngestionFlowVariant = {
  hidden: { opacity: 0, x: -16, y: 8 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.4,
      type: 'spring' as const,
      damping: 18,
      stiffness: 200,
    },
  }),
};

export const contradictionPulseVariant = {
  initial: { opacity: 0.5, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    boxShadow: [
      '0 0 0 0px rgba(220, 38, 38, 0)',
      '0 0 0 8px rgba(220, 38, 38, 0.1)',
      '0 0 0 0px rgba(220, 38, 38, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      type: 'tween' as const,
    },
  },
};

// PHASE 10: MOBILE GESTURE ANIMATIONS
export const swipeExitVariant = {
  initial: { x: 0, opacity: 1 },
  exit: { x: 400, opacity: 0 },
  transition: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
};

export const tapRippleVariant = {
  initial: { scale: 0, opacity: 1 },
  animate: { scale: 4, opacity: 0 },
  transition: {
    duration: 0.6,
    type: 'tween' as const,
  },
};

export const dragFeedbackVariant = {
  drag: {
    scale: 1.05,
    boxShadow: '0 20px 40px rgba(24, 72, 200, 0.2)',
    zIndex: 1000,
  },
  release: {
    scale: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
};

// PHASE 11: DARK MODE IMPLEMENTATION
export const themeTransitionVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    duration: 0.4,
    type: 'tween' as const,
  },
};

// PHASE 12: ACCESSIBILITY ENHANCEMENTS
export const reducedMotionVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  transition: {
    duration: 0.1,
  },
};

export const focusIndicatorVariant = {
  initial: { boxShadow: '0 0 0 0px rgba(24, 72, 200, 0)' },
  focus: {
    boxShadow: '0 0 0 3px rgba(24, 72, 200, 0.5)',
    transition: {
      duration: 0.2,
      type: 'tween' as const,
    },
  },
};

// Drag-active state for file drop zone
export const dragActiveVariant = {
  idle: { scale: 1, borderColor: 'var(--dropzone-border)' },
  active: {
    scale: 1.02,
    borderColor: 'var(--brand)',
    background: 'var(--dropzone-active-bg)',
    transition: { duration: 0.2, type: 'tween' as const },
  },
};

// Shake for validation errors
export const shakeVariant = {
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5, type: 'tween' as const },
  },
};

// File chip entrance
export const chipEntranceVariant = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 180 } },
  exit: { opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.15, type: 'tween' as const } },
};

// "Try Demo" button arrow slide
export const arrowSlideVariant = {
  rest: { x: 0 },
  hover: { x: 5, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } },
};
