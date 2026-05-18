// src/store/agentStore.ts — Zustand global state
import { create } from 'zustand';
import type {
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
  scenarioId: null as ScenarioId | null,
  status: 'idle' as const,
  currentNode: null as string | null,
  elapsedMs: 0,
  isMockMode: false,
  sources: [] as DataSource[],
  contradictions: [] as Contradiction[],
  insights: [] as string[],
  actionChain: [] as Action[],
  currentStep: 0,
  stepLogs: [] as StepLog[],
  healEvent: null as HealEvent | null,
  llmTokens: [] as string[],
  beforeState: null as Record<string, string> | null,
  afterState: null as Record<string, string> | null,
  metrics: null as ImpactMetrics | null,
  auditTrail: [] as AuditEntry[],
};

export const useAgentStore = create<AgentState>((set) => ({
  ...initialState,

  startScenario: (id) => set({
    ...initialState,
    scenarioId: id,
    status: 'running',
    isMockMode: true,
  }),

  reset: () => set(initialState),

  setStatus: (status) => set({ status }),

  setCurrentNode: (currentNode) => set({ currentNode }),

  setElapsed: (elapsedMs) => set({ elapsedMs }),

  appendToken: (token) => set((state) => ({
    llmTokens: [...state.llmTokens, token],
  })),

  clearTokens: () => set({ llmTokens: [] }),

  addSource: (source) => set((state) => ({
    sources: [...state.sources, source],
  })),

  addContradiction: (c) => set((state) => ({
    contradictions: [...state.contradictions, c],
  })),

  resolveContradiction: (id) => set((state) => ({
    contradictions: state.contradictions.map((c) =>
      c.id === id ? { ...c, status: 'resolved' as const } : c
    ),
  })),

  addInsight: (insight) => set((state) => ({
    insights: [...state.insights, insight],
  })),

  setChain: (chain) => set({ actionChain: chain }),

  updateStep: (step, status, latency_ms) => set((state) => ({
    actionChain: state.actionChain.map((a) =>
      a.step === step
        ? { ...a, status, ...(latency_ms !== undefined ? { latency_ms } : {}) }
        : a
    ),
    currentStep: status === 'active' ? step : state.currentStep,
  })),

  addStepLog: (log) => set((state) => ({
    stepLogs: [...state.stepLogs, log],
  })),

  setHealEvent: (healEvent) => set({ healEvent }),

  setBeforeState: (beforeState) => set({ beforeState }),

  setAfterState: (afterState) => set({ afterState }),

  setMetrics: (metrics) => set({ metrics }),

  addAuditEntry: (entry) => set((state) => ({
    auditTrail: [...state.auditTrail, entry],
  })),

  setMockMode: (isMockMode) => set({ isMockMode }),
}));
