// src/constants/typography.ts — Type scale definitions
// Fonts loaded via Google Fonts in index.html:
// JetBrains Mono (numbers, code, metrics)
// Plus Jakarta Sans (titles, headers, body text)

export const fontFamily = {
  mono:     "'JetBrains Mono', monospace",
  heading:  "'Plus Jakarta Sans', sans-serif",
  body:     "'Plus Jakarta Sans', sans-serif",
} as const;

export const typography = {
  h1:       { fontFamily: fontFamily.heading,  fontSize: '28px', fontWeight: 700,  letterSpacing: '-0.5px' },
  h2:       { fontFamily: fontFamily.heading,  fontSize: '22px', fontWeight: 600,  letterSpacing: '-0.3px' },
  h3:       { fontFamily: fontFamily.heading,  fontSize: '17px', fontWeight: 500,  letterSpacing: '0px' },
  body:     { fontFamily: fontFamily.body,     fontSize: '14px', fontWeight: 400,  lineHeight: '22px' },
  small:    { fontFamily: fontFamily.body,     fontSize: '12px', fontWeight: 400,  lineHeight: '18px' },
  label:    { fontFamily: fontFamily.body,     fontSize: '11px', fontWeight: 500,  letterSpacing: '0.8px', textTransform: 'uppercase' as const },
  mono:     { fontFamily: fontFamily.mono,     fontSize: '13px', fontWeight: 400 },
  monoSm:   { fontFamily: fontFamily.mono,     fontSize: '11px', fontWeight: 400 },
  monoBold: { fontFamily: fontFamily.mono,     fontSize: '15px', fontWeight: 700 },
  monoLg:   { fontFamily: fontFamily.mono,     fontSize: '32px', fontWeight: 700 },
  monoXl:   { fontFamily: fontFamily.mono,     fontSize: '48px', fontWeight: 700 },
} as const;
