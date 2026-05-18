# Frontend PRD — Autonomous Content-to-Action Agent
## Mobile App (React Native + Expo) | Hackathon Edition
### Document Type: Product Requirements Document (Frontend Only)
### Version: 2.0 — FINAL (all inconsistencies resolved)

---

## 1. Project Context

**What this app does:**
An AI agent that ingests 5 types of data simultaneously, detects contradictions, plans a multi-step action chain, self-heals on failure, and shows before/after impact — all live, streamed to the user's phone.

**Frontend's job:**
Make the intelligence *visible*. Every thought the agent has, every contradiction it catches, every recovery it attempts — the user feels it in real-time. This is not a dashboard. This is a mission control.

**Tech Stack — LOCKED (no deviations):**
```
React Native (Expo SDK ~51.0.0)
TypeScript (strict: true)
Expo Router v3 (file-based routing)
Zustand ^4.5.0 (global state)
React Native Reanimated ^3.10.0 (all animations — no exceptions)
React Native Gesture Handler ^2.16.0
React Native SVG ^15.2.0 (MetricGauge rings, custom icons)
Expo Linear Gradient ^13.0.0 (shimmer effects, background)
Expo Haptics ^13.0.0 (all touch feedback)
Expo File System ^17.0.0 (audit export)
Expo Sharing ^12.0.0 (audit export share sheet)
@shopify/flash-list ^1.6.3 (audit trail list — never FlatList)
@expo-google-fonts/jetbrains-mono ^0.2.3
@expo-google-fonts/syne ^0.2.3
@expo-google-fonts/dm-sans ^0.2.3
WebSocket (built-in React Native — no library)
Expo EAS Build → APK output
```

> ⚠️ React Native Skia is NOT used. All visual effects use Reanimated 3 + SVG.

---

## 2. Design Philosophy

**Aesthetic Direction: "Neural Command Center"**

Imagine a trading floor meets a deep-space monitoring station. Every data point has urgency. Every contradiction is a red alert. Every success is a quiet triumph.

**NOT this:**
- Generic dark blue + purple gradient app
- Card-based UI that looks like a todo list
- Progress bars that could be in any app

**YES this:**
- Scanning-line animations when data is being ingested
- Pulsing red glow on contradiction cards — like a heartbeat monitor detecting an anomaly
- Step execution that feels like a countdown: precise, inevitable
- Terminal-style LLM stream that types itself out letter by letter
- Before/After comparison that feels like pulling apart two realities

---

## 3. Design System

> ⚠️ See `design_system.md` for full design authority, usage rules, and do/don't guidelines.
> This section is the code-level source of truth for constants files only.

### 3.1 Color Tokens — `src/constants/colors.ts`
```typescript
export const colors = {
  bg: {
    primary:   '#070B14',              // deepest background — screen bg only
    secondary: '#0D1626',              // card surface
    elevated:  '#111D33',              // elevated card / modal
    glass:     'rgba(13, 22, 38, 0.72)',
  },
  accent: {
    cyan:   '#00E5FF',   // primary action, live state, active elements
    green:  '#00FF87',   // success, resolved contradiction
    amber:  '#FFB020',   // warning, stale source, self-heal Tier 1
    red:    '#FF3D5A',   // failure, contradiction alert, self-heal Tier 3
    violet: '#8B5CF6',   // agent reasoning / LLM stream
    orange: '#FF6B35',   // self-heal Tier 2
  },
  text: {
    primary:   '#E8F4FF',
    secondary: '#7A96B8',
    muted:     '#3D5A7A',
    inverse:   '#070B14',
  },
  border: {
    subtle:  'rgba(0, 229, 255, 0.08)',
    default: 'rgba(0, 229, 255, 0.18)',
    active:  'rgba(0, 229, 255, 0.45)',
    danger:  'rgba(255, 61, 90, 0.45)',
    success: 'rgba(0, 255, 135, 0.45)',
    warning: 'rgba(255, 176, 32, 0.45)',
  },
  gradient: {
    cyanGlow:   ['#00E5FF22', '#00E5FF00'],
    redAlarm:   ['#FF3D5A33', '#FF3D5A00'],
    greenPulse: ['#00FF8733', '#00FF8700'],
    cardSheen:  ['#111D33', '#0D1626'],
    shimmer:    ['#0D1626', '#1A2B47', '#0D1626'],  // for loading shimmer
  },
} as const;
```

### 3.2 Typography — `src/constants/typography.ts`

> ⚠️ Font family strings MUST match @expo-google-fonts export names exactly.
> Wrong: `'JetBrainsMono-Regular'`  Correct: `'JetBrainsMono_400Regular'`

```typescript
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
  monoLg:   { fontFamily: 'JetBrainsMono_700Bold',    fontSize: 32 }, // MetricGauge center number
} as const;
```

### 3.3 Spacing & Radius — `src/constants/spacing.ts`
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

---

## 4. TypeScript Interfaces — `src/types/agent.ts`

> ⚠️ This is the ONLY source for all interfaces. Never redefine inline.

```typescript
// ── Source / Ingestion ─────────────────────────────────────────────────
export interface DataSource {
  source_id: string;
  source_type: 'pdf' | 'web' | 'csv' | 'table' | 'realtime';
  credibility_score: number;          // 0.0 – 1.0
  freshness: 'fresh' | 'stale' | 'expired';
  domain_hints: string[];
  ingested_at: string;                // ISO timestamp
  label?: string;                     // human-readable name for display
}

// ── Analysis ───────────────────────────────────────────────────────────
export interface Contradiction {
  id: string;
  source_a: { id: string; type: string; credibility: number };
  source_b: { id: string; type: string; credibility: number };
  resolution: string;                 // human-readable explanation
  flagged_source_id: string;          // which one was marked stale
  status: 'active' | 'resolved';
}

// ── Planning / Execution ───────────────────────────────────────────────
export type StepStatus = 'pending' | 'active' | 'complete' | 'failed' | 'rolled_back';

export interface Action {
  step: number;
  name: string;
  description: string;
  status: StepStatus;
  latency_ms?: number;
  fallback_action?: string;
  cost?: number;
}

export interface StepLog {
  step: number;
  action: string;
  result: string;
  latency_ms: number;
  status: 'success' | 'failed' | 'rolled_back';
  timestamp_ms: number;
}

export interface StateSnapshot {
  snapshot_id: string;
  step: number;
  timestamp_ms: number;
  state_summary: Record<string, unknown>;
}

// ── Self-Heal ──────────────────────────────────────────────────────────
export interface HealEvent {
  tier: 1 | 2 | 3;
  detail: string;
  attempt?: number;
  maxAttempts?: number;
  status: 'retrying' | 'fallback' | 'rollback' | 'success' | 'failed';
}

// ── Metrics / Audit ────────────────────────────────────────────────────
export interface ImpactMetrics {
  risk_delta: number;                 // percentage points reduced
  latency_ms: number;                 // total resolution time
  steps_completed: number;
  steps_total: number;
  cost_saved: number;                 // PKR
  scenario_name: string;
}

export interface AuditEntry {
  timestamp_ms: number;
  event: string;
  detail: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

// ── WebSocket Events ───────────────────────────────────────────────────
export type AgentEvent =
  | { type: 'node_start';      node: string }
  | { type: 'source_ingested'; source: DataSource }
  | { type: 'contradiction';   data: Contradiction }
  | { type: 'stale_flagged';   source_id: string; reason: string }
  | { type: 'action_chain';    chain: Action[] }
  | { type: 'step_start';      step: number; action: Action }
  | { type: 'step_complete';   step: number; snapshot: StateSnapshot }
  | { type: 'step_failed';     step: number; error: string }
  | { type: 'self_heal';       tier: 1 | 2 | 3; detail: string }
  | { type: 'llm_token';       content: string }
  | { type: 'complete';        metrics: ImpactMetrics };

// ── Component Props Helpers ────────────────────────────────────────────
export interface MetricRow {
  label: string;
  before: string | number;
  after: string | number;
  improved: boolean;
}

export type ScenarioId = 'supply_chain' | 'power_grid' | 'sentiment_crisis';
```

---

## 5. State Management — `src/store/agentStore.ts`

```typescript
import { create } from 'zustand';
import {
  DataSource, Contradiction, Action, StepStatus,
  HealEvent, ImpactMetrics, AuditEntry, StepLog, ScenarioId
} from '../types/agent';

interface AgentState {
  // Session
  scenarioId: ScenarioId | null;
  status: 'idle' | 'running' | 'complete' | 'error';
  currentNode: string | null;
  elapsedMs: number;
  isMockMode: boolean;

  // Ingestion
  sources: DataSource[];

  // Analysis
  contradictions: Contradiction[];
  insights: string[];

  // Execution
  actionChain: Action[];
  currentStep: number;
  stepLogs: StepLog[];

  // Self-heal
  healEvent: HealEvent | null;

  // LLM stream
  llmTokens: string[];

  // Results
  beforeState: Record<string, string> | null;
  afterState: Record<string, string> | null;
  metrics: ImpactMetrics | null;
  auditTrail: AuditEntry[];

  // ── Actions ──────────────────────────────────────────────────────────
  startScenario: (id: ScenarioId) => void;
  reset: () => void;
  setStatus: (s: AgentState['status']) => void;
  setCurrentNode: (node: string) => void;
  setElapsed: (ms: number) => void;
  appendToken: (token: string) => void;
  clearTokens: () => void;
  addSource: (source: DataSource) => void;
  addContradiction: (c: Contradiction) => void;
  resolveContradiction: (id: string) => void;
  addInsight: (insight: string) => void;
  setChain: (chain: Action[]) => void;
  updateStep: (step: number, status: StepStatus, latency_ms?: number) => void;
  addStepLog: (log: StepLog) => void;
  setHealEvent: (e: HealEvent | null) => void;
  setBeforeState: (s: Record<string, string>) => void;
  setAfterState: (s: Record<string, string>) => void;
  setMetrics: (m: ImpactMetrics) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  setMockMode: (v: boolean) => void;
}

const initialState = {
  scenarioId: null,
  status: 'idle' as const,
  currentNode: null,
  elapsedMs: 0,
  isMockMode: false,
  sources: [],
  contradictions: [],
  insights: [],
  actionChain: [],
  currentStep: 0,
  stepLogs: [],
  healEvent: null,
  llmTokens: [],
  beforeState: null,
  afterState: null,
  metrics: null,
  auditTrail: [],
};
```

---

## 6. Screen Specifications

---

### Screen 1: Home — `src/app/index.tsx`

**Purpose:** Select a demo scenario or upload custom files. First impression — must feel like entering a command center.

**Layout:**
```
┌─────────────────────────────────┐
│  [LOGO] AGENT.AI    [STATUS ●]  │  ← Header. Dot pulses cyan when idle
│─────────────────────────────────│
│                                 │
│  AUTONOMOUS CONTENT AGENT       │  ← h1, Syne Bold
│  Multi-domain · 5 input types   │  ← label, muted, letterSpacing 2
│  ─────────────────────────────  │
│  5  INPUT TYPES                 │  ← 48px mono bold cyan + label
│                                 │
│  ╔═ DEMO SCENARIOS ═══════════╗ │
│  ║  [SCENARIO CARD A — AMBER] ║ │
│  ║  [SCENARIO CARD B — RED]   ║ │
│  ║  [SCENARIO CARD C — VIOLET]║ │
│  ╚═══════════════════════════╝  │
│                                 │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │  ← dashed border
│  │  +  UPLOAD CUSTOM FILES  │  │
│  │  5 files required         │  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
└─────────────────────────────────┘
```

**Scenario Cards:**

| ID | Title | Accent | Sources | Contradictions |
|----|-------|--------|---------|----------------|
| `supply_chain` | SUPPLY CHAIN CRISIS | `colors.accent.amber` | 5 | 1 |
| `power_grid` | POWER GRID FAULT | `colors.accent.red` | 5 | 2 |
| `sentiment_crisis` | SENTIMENT CRISIS | `colors.accent.violet` | 5 | 1 |

Each ScenarioCard layout:
```
┌────────────────────────────────────┐
│  ● SUPPLY CHAIN CRISIS          →  │  ← dot (accent color) + Syne SemiBold
│                                    │
│  [5 SOURCES]  [1 CONTRADICTION]    │  ← small Badge chips
│  PDF · CSV · WEB · TABLE · FEED    │  ← monoSm chips
│                                    │
│  [ ▶  RUN SCENARIO ]               │  ← full-width accent button
└────────────────────────────────────┘
```

**Animations:**
- Background: ScanLine at 0.15 opacity sweeps every 4s
- Background: very subtle radial gradient from center (atmospheric, not harsh)
- On mount: header (0ms), hero text (150ms), cards stagger (300ms / 380ms / 460ms), upload (600ms)
- All transitions: `translateY 20→0 + opacity 0→1`, spring easing
- Card press: `scale(0.97)` + cyan border glow brightens
- Status dot: infinite loop, `opacity 1→0.4→1`, 2s

---

### Screen 2: Live Agent — `src/app/agent.tsx` ← HERO SCREEN

**Purpose:** Real-time view of agent execution. Judges will spend the most time here.

**Layout (ScrollView, top to bottom, sections appear dynamically):**
```
┌─────────────────────────────────┐
│  ← [BACK]   AGENT RUNNING  [●] │  ← dot blinks red/cyan based on status
│─────────────────────────────────│
│  NODE: analyze          0:04s  │  ← NodeBadge: mono, cyan / elapsed timer
│─────────────────────────────────│
│                                 │
│  ╔═ SOURCE INGESTION ═══[5] ══╗ │  ← section appears at start
│  ║  [PDF shimmer]             ║ │  ← 5 shimmer placeholders initially
│  ║  [CSV shimmer]             ║ │
│  ║  [WEB shimmer]             ║ │
│  ║  [TABLE shimmer]           ║ │
│  ║  [FEED shimmer]            ║ │
│  ╚════════════════════════════╝ │  ← cards fill in as source_ingested fires
│                                 │
│  ╔═ ⚡ CONTRADICTION ══════════╗ │  ← slides in from right on contradiction event
│  ║  CSV (0.41) ─ vs ─ FEED    ║ │  ← pulsing red border
│  ║             (0.90)         ║ │
│  ║  → CSV flagged STALE       ║ │
│  ╚════════════════════════════╝ │
│                                 │
│  ╔═ ACTION CHAIN ══════[5] ═══╗ │  ← appears on action_chain event
│  ║  1  ✅ Validate stock       ║ │  ← ActionStepper
│  ║  2  🔄 Notify procurement   ║ │     active: cyan border + pulse
│  ║  3  ⏳ Simulate order       ║ │     failed: red + SelfHealPanel triggers
│  ║  4  ⏳ Update estimates     ║ │
│  ║  5  ⏳ Schedule monitoring  ║ │
│  ╚════════════════════════════╝ │
│                                 │
│  ╔═ AGENT REASONING ══════════╗ │  ← always visible
│  ║  > Analyzing source delta  ║ │  ← LLMLogStream: violet text, typing effect
│  ║  > Credibility gap: 0.49  ║ │
│  ║  > Flagging CSV as STALE_ ║ │  ← blinking block cursor
│  ╚════════════════════════════╝ │
│                                 │
│  [SELF-HEAL PANEL — ABSOLUTE]  │  ← slides up from bottom on failure only
└─────────────────────────────────┘
```

**Completion flow:**
1. `complete` event fires → all sections dim to 0.5 opacity
2. "CHAIN COMPLETE ✓" green banner slides down from top (stays 1.5s)
3. Auto-navigate: `router.replace('/comparison')`

**Animations:**
- SourceCard: `opacity 0→1 + translateY 30→0`, staggered 80ms apart
- CredibilityBar fills from 0 to score, 800ms spring
- ContradictionCard: slides from right + red border flash on entry
- ActionStepper active step: glowing cyan left-border + pulsing gradient bg
- LLMLogStream: 40ms per character, blinking block cursor
- SelfHealPanel: slides up from bottom, `translateY +200 → 0`, spring
- Data pulse: radial ring expands + fades on each `source_ingested` event
- Node timer: mono font, counts up every 100ms, resets on node change

---

### Screen 3: Before vs After — `src/app/comparison.tsx`

**Purpose:** Show what the agent changed. Satisfying — like pulling a lever and watching reality shift.

**Layout:**
```
┌─────────────────────────────────┐
│  ← RESULTS    [COMPLETE ✓]      │  ← back → index (NOT agent)
│─────────────────────────────────│
│  OUTCOME SUMMARY                │
│  Supply Chain Crisis · 4.2s     │  ← monoSm, scenario + duration
│─────────────────────────────────│
│                                 │
│  ┌──────────┬──────────────┐    │
│  │  BEFORE  │    AFTER     │    │  ← BeforeAfterPanel
│  │──────────│──────────────│    │
│  │ Stock: ? │ Stock: ✓     │    │
│  │ Risk: HI │ Risk: MED    │    │
│  │ Alerts:5 │ Alerts: 0    │    │
│  │Monitorng:│Monitoring:   │    │
│  │  NONE   │  ACTIVE 24h  │    │
│  └──────────┴──────────────┘    │
│                                 │
│  CONTRADICTIONS                 │
│  ┌─────────────────────────┐    │
│  │ ✅ CSV vs Feed — RESOLVED│   │  ← ContradictionCard in resolved state
│  │    Stale source excluded │    │
│  └─────────────────────────┘    │
│                                 │
│  ACTION CHAIN TIMELINE          │
│  ①─────②─────③─────④─────⑤   │  ← horizontal scroll
│  ✅    ✅   ↩rollback ✅   ✅   │  ← colored nodes + latency below
│  340ms 280ms  620ms  190ms 410ms│
│                                 │
│  [  VIEW METRICS →  ]          │
└─────────────────────────────────┘
```

**Before/After data per scenario:**

| Scenario | Metric Label | Before | After |
|----------|-------------|--------|-------|
| Supply Chain | Stock Status | UNKNOWN | VERIFIED ✓ |
| Supply Chain | Supplier Alert | UNRESOLVED | ESCALATED ✓ |
| Supply Chain | Risk Level | HIGH | MEDIUM |
| Supply Chain | Monitoring | NONE | ACTIVE (24h) |
| Power Grid | Outage Status | UNVERIFIED | CONFIRMED |
| Power Grid | Fault Ticket | OPEN | ESCALATED |
| Power Grid | Load Balance | CRITICAL | REROUTED |
| Sentiment | Root Cause | UNKNOWN | IDENTIFIED |
| Sentiment | At-Risk SKUs | UNTRACKED | FLAGGED (3) |
| Sentiment | Monitoring | NONE | DAILY (7d) |

**Animations:**
- Before panel: slides from left on mount (`translateX -100 → 0`)
- After panel: slides from right on mount (`translateX +100 → 0`)
- Metric rows: stagger in 60ms each after panels settle
- Numbers: count-up animation, 1.2s
- Contradiction cards: stagger 0ms / 100ms / 200ms
- Timeline nodes: fill left to right, 80ms stagger, color matches step status
- Rolled-back node: amber, ↩ icon, slightly dimmed

---

### Screen 4: Metrics & Audit — `src/app/metrics.tsx`

**Purpose:** Final impact numbers + full audit trail. Judges look here for technical depth.

**Layout:**
```
┌─────────────────────────────────┐
│  ← IMPACT METRICS              │
│─────────────────────────────────│
│  IMPACT SUMMARY                 │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │   34%    │  │  4.2s    │    │  ← MetricGauge × 4
│  │  RISK ↓  │  │ LATENCY  │    │    circular SVG rings
│  └──────────┘  └──────────┘    │    large mono numbers
│  ┌──────────┐  ┌──────────┐    │    count-up animation
│  │   4/5    │  │  PKR 0   │    │
│  │ STEPS ✓  │  │   COST   │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  EXECUTION TIMELINE             │
│  [Horizontal SVG bar chart]     │  ← step name | colored bar (time)
│                                 │
│  AUDIT TRAIL           [42] ⬛  │  ← count badge
│  ┌─────────────────────────┐    │
│  │ 00:00.000  ingest_start │    │  ← monoSm, color-coded left border
│  │ 00:00.412  pdf_parsed ✓ │    │
│  │ 00:01.103  contradiction!│   │
│  │ 00:02.304  plan_generated│   │
│  │ 00:03.108  step_1 ✓     │    │
│  │ 00:03.902  step_2 ✗ retry│   │
│  │ 00:04.511  step_2 ✓ fbk │    │
│  └─────────────────────────┘    │
│                                 │
│  [↓ EXPORT AUDIT JSON]         │
│  [← NEW SCENARIO]              │
└─────────────────────────────────┘
```

**MetricGauge values:**

| Gauge | Value Source | Max | Unit | Direction |
|-------|-------------|-----|------|-----------|
| RISK REDUCED | `34` (fixed for demo) | 100 | % | down-good |
| RESOLUTION TIME | `metrics.latency_ms / 1000` | 30 | s | down-good |
| STEPS COMPLETE | `metrics.steps_completed` | `metrics.steps_total` | steps | up-good |
| DIRECT COST | `0` | 100 | PKR | down-good |

**Export flow:**
1. Button press → `Haptics.impactAsync(Medium)` → loading spinner
2. Write `auditTrail` as JSON to `FileSystem.documentDirectory + 'audit_log.json'`
3. Call `Sharing.shareAsync(fileUri)`
4. On complete → success toast

**Animations:**
- Gauges stagger in with 200ms between each (so 0ms / 200ms / 400ms / 600ms)
- Each gauge: SVG ring animates 0→value, 1.5s spring; number counts up simultaneously
- Audit entries: first 10 visible on mount, rest load as user scrolls (FlashList handles this)
- Export button: pulse animation to draw attention

---

## 7. Component Specifications

### `SourceCard` — `src/components/SourceCard.tsx`
```typescript
interface SourceCardProps {
  source: DataSource;
  animationDelay?: number;
  isLoading?: boolean;   // shows shimmer when true
}
```
- Custom SVG icon per type (NOT emoji): PDF=doc icon, CSV=table, WEB=globe, TABLE=grid, FEED=signal
- CredibilityBar component (horizontal, below source info)
- Freshness Badge: fresh=green, stale=amber, expired=red
- STALE sources: overall opacity 0.65 + amber warning tint overlay
- Loading state: LinearGradient shimmer sweeping left→right on repeat
- Entry: `translateY 30→0 + opacity 0→1`, delayed by `animationDelay`

### `ActionStepper` — `src/components/ActionStepper.tsx`
```typescript
interface ActionStepperProps {
  steps: Action[];
}
```
- Vertical list with connector lines between steps
- Left accent bar color changes by status
- Active step: animated cyan gradient background (subtle wash)
- Failed step: red glow → SelfHealPanel becomes visible
- Connector line colors: cyan (complete), amber (rolled_back), red (failed), muted (pending)
- Status icons: ✓ complete / spinner active / ⏳ pending / ✗ failed / ↩ rolled_back
- Latency shown in mono font below completed steps

### `LLMLogStream` — `src/components/LLMLogStream.tsx`
```typescript
interface LLMLogStreamProps {
  tokens: string[];
  maxLines?: number;   // default 20
}
```
- Background: `colors.bg.primary` (#070B14), text: violet (#8B5CF6), font: JetBrainsMono_400Regular
- Each "line" prefixed with `> `
- Blinking block cursor `█` at end of last line (Reanimated opacity loop, 500ms)
- New tokens append character by character (consume from store)
- `\n` in token starts new line
- Max height: 180px with internal ScrollView, auto-scrolls to bottom
- Use `useMemo` for assembled text string

### `ContradictionCard` — `src/components/ContradictionCard.tsx`
```typescript
interface ContradictionCardProps {
  contradiction: Contradiction;
}
```
- `active`: pulsing red border (Reanimated loop `opacity 1→0.3→1`, 1.5s), red background tint, ⚡ header
- `resolved`: static green border, ✅ header, "RESOLVED" stamp text
- Two source rows showing ID + credibility score
- VS divider between sources
- Resolution text (small, muted) — which was flagged and why
- Entry: slide from right + opacity fade

### `BeforeAfterPanel` — `src/components/BeforeAfterPanel.tsx`
```typescript
interface BeforeAfterPanelProps {
  rows: MetricRow[];
}
```
- Split layout: "BEFORE" (muted, left) | vertical divider | "AFTER" (cyan, right)
- `improved=true` → after value in green; `improved=false` → after value in amber
- All values in mono font
- Rows stagger in: 60ms delay per row
- Before side enters from left, After side from right on mount

### `MetricGauge` — `src/components/MetricGauge.tsx`
```typescript
interface MetricGaugeProps {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  direction?: 'up-good' | 'down-good';
  animationDelay?: number;
}
```
- Circular SVG ring built with `react-native-svg` Circle + stroke-dashoffset
- Animated from 0 to `(value/maxValue)` ratio, 1.5s spring
- Large mono number center: count-up animation
- Color logic:
  - `direction=down-good` AND `value < maxValue * 0.5` → green
  - `direction=up-good` AND `value > maxValue * 0.5` → green
  - Otherwise → amber

### `SelfHealPanel` — `src/components/SelfHealPanel.tsx`
```typescript
interface SelfHealPanelProps {
  event: HealEvent;
}
```
- Position: absolute, bottom of screen, above safe area
- Entry: `translateY +200 → 0`, spring easing
- "SELF HEAL — TIER X" header in mono font
- Tier badge colors: Tier1=amber, Tier2=orange, Tier3=red
- `retrying`: animated progress bar + "Attempt X/3" + countdown
- `fallback`: "Executing fallback: [detail]" text
- `rollback`: "Rolling back to snapshot..." text
- On `success`: border flashes green → `translateY 0 → +200` dismisses

### Base UI Components — `src/components/ui/`

**`GlassCard.tsx`**
Props: `children, style?, glowColor?, intensity?: 'low'|'medium'|'high'`
Dark bg (`colors.bg.secondary`), border with glow color at low opacity, subtle shadow.
`high` intensity: border opacity increases + inner shadow glow.

**`PulsingDot.tsx`**
Props: `color?, size?, speed?: 'slow'|'normal'|'fast'`
Reanimated loop: `opacity 1→0.3→1`. Outer ring expands and fades.

**`Badge.tsx`**
Props: `label: string, variant: 'success'|'warning'|'danger'|'info'|'default'`
Pill shape, uppercase, monoSm font. Maps: success=green, warning=amber, danger=red, info=cyan.

**`CredibilityBar.tsx`**
Props: `score: number, animate?: boolean, showLabel?: boolean`
Color: green (>0.7), amber (0.5–0.7), red (<0.5).
Animates from 0 to score with spring on mount. Label shows "0.85" in monoSm.

**`ScanLine.tsx`**
Props: `color?, duration?`
Thin line (1px) sweeps `translateY 0 → container height`, looping.

**`NodeBadge.tsx`**
Props: `node: string, elapsedMs: number`
Left: node name in uppercase mono + cyan. Right: elapsed "4.2s", updates every 100ms.

---

## 8. Services

### `src/services/mockStream.ts`
```typescript
// Pre-scripted event sequences for all 3 scenarios
// Returns cleanup function to cancel pending timeouts

export type EventHandlers = {
  [K in AgentEvent['type']]: (event: Extract<AgentEvent, { type: K }>) => void;
};

export function startMockStream(
  scenarioId: ScenarioId,
  handlers: Partial<EventHandlers>
): () => void;
// Returns: cleanup function that calls clearTimeout on all pending timeouts
```

Timing schedule for each scenario:
- `node_start: 'ingest'` → 0ms
- Sources ingested → 200ms, 600ms, 1000ms, 1400ms, 1800ms (staggered)
- `node_start: 'analyze'` → 2200ms
- `contradiction` → 3000ms
- LLM tokens stream → 3200ms–5000ms
- `node_start: 'plan'` → 5200ms
- `action_chain` → 5800ms
- Steps execute: 6500ms, 8000ms (this one fails), 8200ms (self_heal fires), 9200ms (recovery), 10500ms, 11800ms
- `complete` → 13000ms

### `src/services/websocket.ts`
```typescript
class AgentWebSocket {
  connect(backendUrl: string, scenarioId: ScenarioId): void;
  disconnect(): void;
  // On error within 3s: silently falls back to startMockStream
  // Sets store.isMockMode = true when in fallback
}
```

### `src/services/api.ts`
```typescript
const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export const api = {
  getScenarios: () => fetch(`${BASE_URL}/api/scenarios`).then(r => r.json()),
  getAuditLog: (scenarioId: string) =>
    fetch(`${BASE_URL}/api/agent/${scenarioId}/audit`).then(r => r.json()),
};
```

---

## 9. Navigation Structure (Expo Router)

```
src/app/
├── _layout.tsx         ← Root: fonts, StatusBar, gesture handler, Stack navigator
├── index.tsx           ← Screen 1: Home
├── agent.tsx           ← Screen 2: Live Agent  (params: scenarioId)
├── comparison.tsx      ← Screen 3: Before vs After
└── metrics.tsx         ← Screen 4: Metrics & Audit

Flow:
index ──push──▶ agent ──replace──▶ comparison ──push──▶ metrics
                                       │
                                  back ──replace──▶ index

Back from comparison → index (NOT agent — chain is done, agent screen destroyed)
Back from metrics → comparison
"NEW SCENARIO" button → store.reset() then router.replace('/')
```

---

## 10. File Structure — Complete

```
mobile/
├── app.json
├── eas.json
├── tsconfig.json         ← strict: true
├── package.json
└── src/
    ├── app/
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── agent.tsx
    │   ├── comparison.tsx
    │   └── metrics.tsx
    ├── components/
    │   ├── SourceCard.tsx
    │   ├── ActionStepper.tsx
    │   ├── LLMLogStream.tsx
    │   ├── ContradictionCard.tsx
    │   ├── BeforeAfterPanel.tsx
    │   ├── MetricGauge.tsx
    │   ├── SelfHealPanel.tsx
    │   ├── NodeBadge.tsx
    │   └── ui/
    │       ├── GlassCard.tsx
    │       ├── Badge.tsx
    │       ├── PulsingDot.tsx
    │       ├── CredibilityBar.tsx
    │       └── ScanLine.tsx
    ├── constants/
    │   ├── colors.ts        ← ONLY source of color values
    │   ├── typography.ts    ← ONLY source of font styles
    │   └── spacing.ts       ← spacing + radius
    ├── store/
    │   └── agentStore.ts    ← Zustand store
    ├── services/
    │   ├── api.ts           ← REST calls
    │   ├── websocket.ts     ← WebSocket class with mock fallback
    │   └── mockStream.ts    ← Pre-scripted event timelines
    └── types/
        └── agent.ts         ← ALL TypeScript interfaces (single source)
```

---

## 11. Performance Requirements

| Metric | Target |
|--------|--------|
| App launch → Home visible | < 1.5s |
| WebSocket connect → first event | < 200ms |
| Animation frame drops | 0 (all Reanimated, JS thread never blocked) |
| APK size | < 50MB |
| Audit list scroll FPS | 60fps (FlashList) |

**Mandatory optimizations:**
- `React.memo` on: `SourceCard`, `ActionStepper` row item, `AuditEntry`, `ContradictionCard`
- `FlashList` for all lists over 10 items (never `FlatList`)
- Zustand granular selectors: `const sources = useAgentStore(s => s.sources)` — never subscribe to full store
- All animated values: `useSharedValue` / `useAnimatedStyle` — **never** `useState` for animated values
- LLMLogStream: `useMemo` for assembled text, `useCallback` for token append
- Anonymous functions extracted to `useCallback` — none in render

---

## 12. APK Build

```json
// eas.json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal",
      "env": { "BACKEND_URL": "http://192.168.1.XXX:8000" }
    }
  }
}
```

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

*Frontend PRD v2.0 — covers frontend only. Backend (FastAPI + LangGraph) is a separate implementation.*
*Design authority: see `design_system.md`. Build prompts: see `antigravity_prompts.md`.*
