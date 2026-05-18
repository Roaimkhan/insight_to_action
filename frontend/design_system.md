# Design System — Autonomous Content-to-Action Agent
## "Neural Command Center" — Visual Design Authority
### Version: 1.0 — FINAL

---

## 1. Aesthetic Vision

### The Concept
**"Neural Command Center"** — the feeling of a deep-space monitoring station staffed by a single AI analyst. Every pixel earns its place. Every animation communicates system state. Nothing decorative that doesn't also inform.

The user should feel like they're watching a machine think in real-time. When it succeeds, it's a quiet triumph. When it fails and recovers, it's a tense few seconds before relief.

### The 3 Emotional Beats

| Beat | Moment | Visual Language |
|------|--------|-----------------|
| **Tension** | Contradiction detected | Red pulse, border alarm, alert slide |
| **Precision** | Steps executing | Mono timers, controlled animations, green fills |
| **Impact** | Chain complete | Before/after split, count-up numbers, audit trail |

### What This App Is NOT
- ❌ Generic dark dashboard (no blue/purple gradients on white)
- ❌ Mobile admin panel (no material design, no rounded cards with icons)
- ❌ Startup landing page aesthetic
- ❌ Progress-bar overload
- ❌ Emoji anywhere (use custom SVG icons)

---

## 2. Color System

### The Philosophy
One accent per semantic role. Never mix freely. If cyan is "active/live", it should mean that on every screen — not sometimes cyan, sometimes violet.

### Full Token Tree

```typescript
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
    warning: 'rgba(255, 176, 32, 0.45)', // stale, tier 1
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
```

### Color Usage Rules

| Color | ✅ Use For | ❌ Never Use For |
|-------|-----------|-----------------|
| `accent.cyan` | Active state, primary CTA buttons, live indicators, active step borders | Success confirmation, warnings |
| `accent.green` | Step complete, contradiction resolved, positive metric delta | Active/live state |
| `accent.amber` | Stale source badge, self-heal Tier 1, warning states | Success, danger |
| `accent.red` | Contradiction alert, failed step, self-heal Tier 3, danger | Anything positive |
| `accent.violet` | LLM token stream text, "thinking" indicators ONLY | Any other context |
| `accent.orange` | Self-heal Tier 2 ONLY | Any other context |
| `bg.primary` | Screen root background | Card surfaces (use secondary) |
| `bg.secondary` | All card surfaces | Screen root |
| `text.muted` | Timestamps, metadata, labels below 12px | Primary readable text |

---

## 3. Typography

### Font Families

| Font | Package | Use Case |
|------|---------|----------|
| **JetBrains Mono** | `@expo-google-fonts/jetbrains-mono` | All numbers, IDs, metrics, code, terminal output |
| **Syne** | `@expo-google-fonts/syne` | All screen titles, section headers, card headings |
| **DM Sans** | `@expo-google-fonts/dm-sans` | All body text, descriptions, instructions |

### Loading in `_layout.tsx`
```typescript
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';

// Pass all to useFonts:
const [fontsLoaded] = useFonts({
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
});
```

> ⚠️ Font family strings in StyleSheet MUST exactly match the object key names above.
> `'JetBrainsMono_400Regular'` ← correct
> `'JetBrainsMono-Regular'` ← WRONG — will silently fall back to system font

### Type Scale — `src/constants/typography.ts`

```typescript
export const typography = {
  h1:       { fontFamily: 'Syne_700Bold',           fontSize: 28, letterSpacing: -0.5 },
  h2:       { fontFamily: 'Syne_600SemiBold',        fontSize: 22, letterSpacing: -0.3 },
  h3:       { fontFamily: 'Syne_500Medium',           fontSize: 17, letterSpacing: 0    },
  body:     { fontFamily: 'DMSans_400Regular',        fontSize: 14, lineHeight: 22 },
  small:    { fontFamily: 'DMSans_400Regular',        fontSize: 12, lineHeight: 18 },
  label:    { fontFamily: 'DMSans_500Medium',         fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono:     { fontFamily: 'JetBrainsMono_400Regular', fontSize: 13 },
  monoSm:   { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 },
  monoBold: { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 15 },
  monoLg:   { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 32 },   // MetricGauge center
  monoXl:   { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 48 },   // Hero stat on Home
} as const;
```

### Typography Rules

| Element | Style | Color |
|---------|-------|-------|
| Screen title | `h1` or `h2` | `text.primary` |
| Section header | `h3` | `text.primary` |
| Section sub-label | `label` | `text.muted` |
| Card body | `body` | `text.secondary` |
| All numbers (metrics, scores, timers) | `mono` / `monoBold` / `monoLg` | `text.primary` or accent |
| Timestamps | `monoSm` | `text.muted` |
| Terminal/LLM output | `mono` | `accent.violet` |
| Badge text | `monoSm` | context accent |

---

## 4. Spacing & Layout

### Scale — `src/constants/spacing.ts`
```typescript
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
```

### Layout Rules
- Screen horizontal padding: `spacing.md` (16px) on all screens
- Card internal padding: `spacing.md` (16px)
- Between sections: `spacing.lg` (24px)
- Between list items: `spacing.sm` (8px)
- Icon size (in cards): 20px
- Header height: 56px + safe area top

---

## 5. Shadow & Glow System

### Glow Effect (for active/alert cards)
React Native doesn't support CSS `box-shadow` glow — implement with:

```typescript
// Glow via elevation + colored shadow (Android)
const glowStyle = {
  elevation: 8,
  shadowColor: colors.accent.cyan,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 12,
};

// For pulsing glow: animate shadowOpacity or overlay View opacity
```

### Standard Card Shadow
```typescript
const cardShadow = {
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 8,
};
```

### Glow Intensities

| Intensity | Use Case | shadowOpacity | shadowRadius |
|-----------|----------|---------------|--------------|
| Subtle | Resting card | 0.15 | 4 |
| Normal | Focused card | 0.35 | 8 |
| Active | Running step | 0.55 | 12 |
| Alert | Contradiction | 0.75 | 16 |

---

## 6. Animation System

### Core Rules — NEVER BREAK THESE
1. **All animations use Reanimated 3** — `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `withRepeat`
2. **Never use `setState` for animated values** — this causes JS thread jank
3. **Never use `Animated` from React Native core** — only Reanimated 3
4. **`React.memo`** on all list items to prevent cascade re-renders

### Animation Constants
```typescript
// These values create the "tight, precise, intentional" feel
export const anim = {
  // Timing
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
```

### Standard Entrance Animation
Used for cards, sections, any element entering the viewport:
```typescript
// Fade up — standard entrance
const opacity = useSharedValue(0);
const translateY = useSharedValue(20);

useEffect(() => {
  opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 180 }));
}, []);

const style = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }],
}));
```

### Pulse Animation (for live indicators)
```typescript
const pulse = useSharedValue(1);

useEffect(() => {
  pulse.value = withRepeat(
    withSequence(
      withTiming(0.3, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    ),
    -1, // infinite
    false
  );
}, []);
```

### Slide Panel Animation (SelfHealPanel, sections)
```typescript
const translateY = useSharedValue(200);

const show = () => {
  translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
};
const hide = () => {
  translateY.value = withSpring(200, { damping: 18, stiffness: 200 });
};
```

### Count-Up Animation (MetricGauge numbers)
```typescript
const progress = useSharedValue(0);
progress.value = withTiming(targetValue, { duration: 1500 });

const displayText = useDerivedValue(() =>
  `${Math.round(progress.value)}`
);
```

### Credibility Bar Fill
```typescript
const width = useSharedValue(0);
width.value = withSpring(score * 100, { damping: 20, stiffness: 100 });

const barStyle = useAnimatedStyle(() => ({
  width: `${width.value}%`,
}));
```

---

## 7. Component Design Patterns

### Card Anatomy
```
┌─ border (border.subtle resting, border.active when active) ──────────────┐
│                                                                           │
│  [Icon 20px]  [Title — h3]                          [Badge]              │
│               [Subtitle — small, text.secondary]                         │
│                                                                           │
│  ────────────────────────────────────────────────────────────────────    │
│                                                                           │
│  [Content area]                                                           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────── ┘
 bg: bg.secondary, borderRadius: radius.lg, padding: spacing.md
```

### Section Header Pattern
```typescript
// Every section uses this pattern — thin cyan left border accent
<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
  <View style={{ width: 3, height: 16, backgroundColor: colors.accent.cyan, borderRadius: 2, marginRight: spacing.sm }} />
  <Text style={[typography.label, { color: colors.text.secondary }]}>SECTION TITLE</Text>
  {badge && <Badge label={badge} variant="info" style={{ marginLeft: spacing.sm }} />}
</View>
```

### Status Left-Border Pattern (ActionStepper)
```typescript
// Left colored accent bar = status indicator
const borderColors = {
  pending:     colors.text.muted,
  active:      colors.accent.cyan,
  complete:    colors.accent.green,
  failed:      colors.accent.red,
  rolled_back: colors.accent.amber,
};

<View style={{
  borderLeftWidth: 3,
  borderLeftColor: borderColors[status],
  paddingLeft: spacing.md,
}}>
```

### Terminal Block Pattern (LLMLogStream)
```typescript
// Consistent terminal look
const terminalStyle = {
  backgroundColor: colors.bg.primary,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border.subtle,
  padding: spacing.md,
  fontFamily: 'JetBrainsMono_400Regular',
  color: colors.accent.violet,
  fontSize: 13,
};
```

---

## 8. Icon System

> Use custom SVG components — NO emoji, NO icon library icons that look generic.

### Source Type Icons
Each icon: 20×20px, colored with `colors.text.secondary` default, `colors.accent.cyan` when active.

| Type | Visual Concept | Shape |
|------|---------------|-------|
| PDF | Document with folded corner | Rectangle + triangle fold |
| CSV | Grid of small cells | 3×3 grid lines |
| WEB | Globe/signal rings | Concentric arcs |
| TABLE | Dashboard gauge | Rectangle + horizontal lines |
| REALTIME | Signal waves | 3 expanding arcs |

### Status Icons (in ActionStepper)
| Status | Symbol | Color |
|--------|--------|-------|
| pending | ○ (hollow circle) | `text.muted` |
| active | ◉ (circle + spinning) | `accent.cyan` |
| complete | ✓ (checkmark) | `accent.green` |
| failed | ✕ (cross) | `accent.red` |
| rolled_back | ↩ (back arrow) | `accent.amber` |

---

## 9. Background Effects

### Home Screen
1. **Base color:** `bg.primary` (#070B14)
2. **Atmospheric radial gradient:** from center, very subtle, `rgba(0, 229, 255, 0.03)` at center → transparent at edges
3. **Dot grid pattern:** SVG `<pattern>` — 1px dots, 24px spacing, `rgba(255,255,255,0.03)` opacity

```typescript
// Dot grid SVG pattern
<Svg style={StyleSheet.absoluteFill} opacity={0.35}>
  <Defs>
    <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <Circle cx="1" cy="1" r="1" fill="rgba(0,229,255,0.15)" />
    </Pattern>
  </Defs>
  <Rect width="100%" height="100%" fill="url(#dots)" />
</Svg>
```

4. **ScanLine:** sweeping at 0.15 opacity, 4s cycle
5. **No moving gradient mesh** — too distracting during live agent run

### Agent Screen
- No bg effects — the content IS the visual
- ScanLine at 0.08 opacity only (very subtle, almost imperceptible)

### All Screens
- StatusBar: `translucent={true}`, `backgroundColor="transparent"`, dark-content

---

## 10. Shimmer / Loading State

Used for: SourceCard loading placeholders, initial empty states.

```typescript
// LinearGradient shimmer — animated left to right
const shimmerTranslate = useSharedValue(-200);

useEffect(() => {
  shimmerTranslate.value = withRepeat(
    withTiming(400, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
    -1,
    false
  );
}, []);

// Render: animated View containing LinearGradient
// colors: ['#0D1626', '#1A2B47', '#0D1626'] (left→right sweep)
```

---

## 11. Haptics — Every Touch Has Feedback

```typescript
import * as Haptics from 'expo-haptics';

// Tap on any card or button
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Contradiction detected
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Self-heal triggers
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Chain complete
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Self-heal fails (rollback)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

---

## 12. Screen Transitions

```typescript
// In _layout.tsx Stack navigator
<Stack
  screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: colors.bg.primary },
    animation: 'slide_from_right', // default
  }}
>
  <Stack.Screen name="index" />
  <Stack.Screen
    name="agent"
    options={{ animation: 'slide_from_bottom' }}   // Home → Agent: slides up
  />
  <Stack.Screen
    name="comparison"
    options={{ animation: 'fade' }}                // Agent → Comparison: crossfade
  />
  <Stack.Screen
    name="metrics"
    options={{ animation: 'slide_from_right' }}    // Comparison → Metrics: right
  />
</Stack>
```

---

## 13. Do's and Don'ts — Quick Reference

### ✅ DO
- Use `colors.*` imports everywhere — never a raw `#hex` outside `colors.ts`
- Use `typography.*` spreads: `style={[typography.mono, { color: colors.text.primary }]}`
- Animate with Reanimated 3 — `useSharedValue` only
- `React.memo` on every list item component
- Give every number a mono font family
- Test on a real Android mid-range device (not just emulator)
- Add `Haptics` on every interactive element

### ❌ DON'T
- Never hardcode `'#070B14'` or any hex outside `colors.ts`
- Never use `Animated` from React Native core — Reanimated 3 only
- Never use `FlatList` — use `FlashList` for lists
- Never use emoji in production UI — SVG icons only
- Never use `setState` for values that drive animations
- Never use `Inter`, `Roboto`, `Arial`, or system fonts
- Never put more than one animated value in a single `useState`
- Never use anonymous functions in render — extract to `useCallback`

---

*Design System v1.0 — Neural Command Center*
*This document is the visual authority. Conflicts between this doc and any prompt → this doc wins.*
