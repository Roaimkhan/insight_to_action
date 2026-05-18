// src/constants/typography.ts — the ONLY file where font styles are defined
// Font families loaded via @expo-google-fonts packages
// JetBrainsMono: numbers, IDs, metrics, code, terminal output
// Syne: all headings and screen titles
// DMSans: all body text, descriptions, labels

export const typography = {
  // Headings — Syne
  h1: { fontFamily: 'Syne_700Bold',     fontSize: 28, letterSpacing: -0.5 },
  h2: { fontFamily: 'Syne_600SemiBold', fontSize: 22, letterSpacing: -0.3 },
  h3: { fontFamily: 'Syne_500Medium',   fontSize: 17, letterSpacing: 0    },

  // Body — DM Sans
  body:  { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22 },
  small: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 18 },
  label: { fontFamily: 'DMSans_500Medium',  fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' as const },

  // Mono — JetBrains Mono (ALL numbers, IDs, metrics, timing, terminal)
  mono:     { fontFamily: 'JetBrainsMono_400Regular', fontSize: 13 },
  monoSm:   { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 },
  monoBold: { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 15 },
  monoLg:   { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 32 },   // MetricGauge center
  monoXl:   { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 48 },   // Hero stat on Home
} as const;
