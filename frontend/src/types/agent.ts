// src/types/agent.ts — ALL TypeScript interfaces (single source of truth)

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
