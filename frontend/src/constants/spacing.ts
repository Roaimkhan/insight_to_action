// src/constants/spacing.ts — Spacing & radius scale

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

// Layout constants
export const layout = {
  screenPadding: spacing.md,
  cardPadding:   spacing.md,
  sectionGap:    spacing.lg,
  itemGap:       spacing.sm,
  iconSize:      20,
  headerHeight:  56,
  maxContentWidth: 1200,
  sidebarWidth:  280,
} as const;
