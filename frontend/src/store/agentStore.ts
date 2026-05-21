// src/store/agentStore.ts — Zustand global state (Real Backend Integration)
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { startMockStream } from '../services/mockStream';
import type { EventHandlers } from '../services/mockStream';
import { uploadFiles } from '../services/uploadService';
import type { AnalysisPayload } from '../services/analysisService';
import {
  runAgentScenario,
  getSessionState,
  type SessionState,
} from '../services/agentService';
import { createAgentSocket, type WebSocketMessage } from '../services/socketService';
import type {
  DataSource, Contradiction, Action, StepStatus,
  HealEvent, ImpactMetrics, AuditEntry, StepLog, ScenarioId, AgentEvent
} from '../types/agent';

/**
 * Backend Source Summary mapped to frontend DataSource
 */
function mapSourceSummary(src: {
  filename: string;
  source_type: string;
  credibility_score?: number;
  detected_category?: string;
  label?: string;
}): DataSource {
  return {
    source_id: src.filename || nanoid(),
    source_type: (['pdf', 'csv', 'table', 'web', 'realtime'].includes(src.source_type) ? src.source_type : 'csv') as DataSource['source_type'],
    credibility_score: src.credibility_score ?? 0.70,
    freshness: 'fresh',
    domain_hints: src.detected_category ? [src.detected_category] : ['general'],
    ingested_at: new Date().toISOString(),
    label: src.label || src.filename,
  };
}

export interface AgentState {

  // Session
  scenarioId: ScenarioId | null;
  sessionId: string | null;
  status: 'idle' | 'uploading' | 'connecting' | 'running' | 'complete' | 'error';
  currentNode: string | null;
  elapsedMs: number;
  isMockMode: boolean;

  // Upload result
  sourcesUploaded: number;
  sourcesAutoFilled: number;
  totalSources: number;

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

  // Upload / prompt UI state
  ingestSessionId: string | null;
  uploadedFiles: UploadedFile[];
  userPrompt: string;

  // Results
  beforeState: Record<string, string> | null;
  afterState: Record<string, string> | null;
  metrics: ImpactMetrics | null;
  auditTrail: AuditEntry[];
  finalState: SessionState | null;

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
  setSessionId: (id: string | null) => void;
  setFinalState: (state: SessionState | null) => void;
  // Upload actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setUserPrompt: (prompt: string) => void;
  startAnalysis: (payload: AnalysisPayload) => Promise<string>;
  // Real backend integration actions
  runUploadAndAgent: (scenario: ScenarioId) => Promise<void>;
  disconnectSocket: () => void;
}

// Types for upload state
export type FileCategory = 'pdf' | 'csv' | 'xlsx' | 'json' | 'txt' | 'image' | 'zip' | 'other';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: FileCategory;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

const initialState: Omit<AgentState, keyof {
  startScenario: unknown; reset: unknown; setStatus: unknown; setCurrentNode: unknown;
  setElapsed: unknown; appendToken: unknown; clearTokens: unknown; addSource: unknown;
  addContradiction: unknown; resolveContradiction: unknown; addInsight: unknown;
  setChain: unknown; updateStep: unknown; addStepLog: unknown; setHealEvent: unknown;
  setBeforeState: unknown; setAfterState: unknown; setMetrics: unknown; addAuditEntry: unknown;
  setMockMode: unknown; setSessionId: unknown; setFinalState: unknown;
  addFiles: unknown; removeFile: unknown; clearFiles: unknown; setUserPrompt: unknown; startAnalysis: unknown;
  runUploadAndAgent: unknown; disconnectSocket: unknown;
}> = {
  scenarioId: null,
  sessionId: null,
  status: 'idle',
  currentNode: null,
  elapsedMs: 0,
  isMockMode: false,
  sourcesUploaded: 0,
  sourcesAutoFilled: 0,
  totalSources: 0,
  sources: [],
  contradictions: [],
  insights: [],
  actionChain: [],
  currentStep: 0,
  stepLogs: [],
  healEvent: null,
  llmTokens: [],
  ingestSessionId: null,
  uploadedFiles: [],
  userPrompt: '',
  beforeState: null,
  afterState: null,
  metrics: null,
  auditTrail: [],
  finalState: null,
};

let activeSocket: WebSocket | null = null;

export const useAgentStore = create<AgentState>((set, get) => ({
  ...(initialState as any),

  startScenario: (id) => {
    // Clear any existing socket
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    set({
      ...initialState,
      scenarioId: id,
      status: 'idle',
      isMockMode: true,
    });
  },

  reset: () => {
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    set({ ...initialState });
  },

  setStatus: (s) => set({ status: s }),
  setSessionId: (id) => set({ sessionId: id }),
  setCurrentNode: (node) => set({ currentNode: node }),
  setElapsed: (ms) => set({ elapsedMs: ms }),
  setFinalState: (state) => set({ finalState: state }),

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
      a.step === step ? { ...a, status, ...(latency_ms !== undefined ? { latency_ms } : {}) } : a
    ),
    currentStep: status === 'active' ? step : state.currentStep,
  })),

  addStepLog: (log) => set((state) => ({
    stepLogs: [...state.stepLogs, log],
  })),

  setHealEvent: (e) => set({ healEvent: e }),
  setBeforeState: (s) => set({ beforeState: s }),
  setAfterState: (s) => set({ afterState: s }),
  setMetrics: (m) => set({ metrics: m }),

  addAuditEntry: (entry) => set((state) => ({
    auditTrail: [...state.auditTrail, entry],
  })),

  setMockMode: (v) => set({ isMockMode: v }),

  disconnectSocket: () => {
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
  },

  // Upload actions
  addFiles: (files) => set((state) => {
    const available = Math.max(0, 5 - state.uploadedFiles.length);
    const toAdd: UploadedFile[] = Array.from(files).slice(0, available).map((f: File) => {
      const name = f.name || 'unnamed';
      const ext = name.split('.').pop()?.toLowerCase() || '';
      let cat: FileCategory = 'other';
      if (ext === 'pdf') cat = 'pdf';
      else if (ext === 'csv') cat = 'csv';
      else if (ext === 'xlsx' || ext === 'xls') cat = 'xlsx';
      else if (ext === 'json') cat = 'json';
      else if (ext === 'txt') cat = 'txt';
      else if (['png','jpg','jpeg','gif','webp'].includes(ext)) cat = 'image';
      else if (ext === 'zip') cat = 'zip';

      return {
        id: nanoid(),
        file: f,
        name,
        size: f.size,
        type: cat,
        status: 'pending' as const,
      };
    });
    return { uploadedFiles: [...state.uploadedFiles, ...toAdd] };
  }),

  removeFile: (id) => set((state) => ({ uploadedFiles: state.uploadedFiles.filter(f => f.id !== id) })),

  clearFiles: () => set({ uploadedFiles: [] }),

  setUserPrompt: (prompt) => set({ userPrompt: prompt }),

  startAnalysis: async (payload) => {
    const files = payload.files;
    const scenario = get().scenarioId || 'supply_chain';
    set({ status: 'uploading', isMockMode: false });
    set((state) => ({
      uploadedFiles: state.uploadedFiles.map((uploaded) => ({
        ...uploaded,
        status: 'processing' as const,
      })),
    }));

    try {
      const uploadRes = await uploadFiles(files, payload.prompt);
      set({ ingestSessionId: uploadRes.session_id });
      set({
        sourcesUploaded: uploadRes.sources_uploaded,
        sourcesAutoFilled: uploadRes.sources_auto_filled,
        totalSources: uploadRes.total_sources,
        sources: uploadRes.source_summaries.map(mapSourceSummary),
        status: 'connecting',
      });

      set((state) => ({
        uploadedFiles: state.uploadedFiles.map((uploaded) => ({
          ...uploaded,
          status: 'done' as const,
        })),
      }));

      const runRes = await runAgentScenario(scenario);
      set({ sessionId: runRes.session_id });

      const ws = createAgentSocket(runRes.session_id, {
        onOpen: () => set({ status: 'running' }),
        onMessage: (msg: WebSocketMessage) => {
          switch (msg.type) {
            case 'status':
              set({ currentNode: msg.node });
              get().addAuditEntry({
                timestamp_ms: get().elapsedMs,
                event: `node_${msg.status}`,
                detail: msg.node,
                status: 'info',
              });
              break;
            case 'transition': {
              set({ currentNode: msg.node });
              const summary = msg.current_state_summary;
              if (msg.node === 'analyze') {
                get().appendToken(`\n[analyze] ${summary.raw_sources_count} sources, ${summary.filtered_sources_count} filtered\n`);
              } else if (msg.node === 'plan') {
                get().appendToken(`\n[plan] ${summary.action_plan_count} actions planned\n`);
              } else if (msg.node === 'execute') {
                get().appendToken(`\n[execute] running ${summary.action_plan_count} steps...\n`);
              }
              break;
            }
            case 'complete': {
              set({ status: 'complete' });
              getSessionState(runRes.session_id)
                .then((sessionState) => {
                  set({ finalState: sessionState });
                  const outcome = sessionState.outcome || {};
                  const metrics: ImpactMetrics = {
                    risk_delta: (outcome.risk_delta as number) ?? 0,
                    latency_ms: get().elapsedMs,
                    steps_completed: (outcome.mitigations_executed as number) ?? 0,
                    steps_total: (outcome.mitigations_executed as number) ?? 0,
                    cost_saved: (outcome.estimated_cost_impact as number) ?? 0,
                    scenario_name: scenario.replace(/_/g, ' '),
                  };
                  set({ metrics });
                })
                .catch(console.error);
              break;
            }
            case 'error': {
              set({ status: 'error' });
              get().addAuditEntry({
                timestamp_ms: get().elapsedMs,
                event: 'error',
                detail: msg.error,
                status: 'error',
              });
              break;
            }
          }
        },
        onError: (err) => {
          console.error('[WebSocket error]', err);
          set({ status: 'error' });
        },
        onClose: () => {
          if (get().status === 'running') set({ status: 'error' });
        },
      });

      activeSocket = ws;
      return runRes.session_id;
    } catch (err) {
      console.warn('[startAnalysis] backend unavailable, falling back to mock stream:', err);
      const scenario = get().scenarioId || 'supply_chain';
      const mockSessionId = `mock_${nanoid()}`;
      set({ isMockMode: true, status: 'running', sessionId: mockSessionId });

      const handlers: Partial<EventHandlers> = {
        node_start: (e) => {
          get().setCurrentNode(e.node);
          get().addAuditEntry({
            timestamp_ms: get().elapsedMs,
            event: 'node_start',
            detail: e.node,
            status: 'info',
          });
        },
        source_ingested: (e) => get().addSource(e.source),
        contradiction: (e) => get().addContradiction(e.data),
        llm_token: (e) => get().appendToken(e.content),
        action_chain: (e) => get().setChain(e.chain),
        step_start: (e) => get().updateStep(e.step, 'active'),
        step_complete: (e) => get().updateStep(e.step, 'complete', Math.floor(200 + Math.random() * 500)),
        step_failed: (e) => get().updateStep(e.step, 'failed'),
        self_heal: (e) => {
          get().setHealEvent({ tier: e.tier, detail: e.detail, status: 'retrying' });
          setTimeout(() => get().setHealEvent(null), 2000);
        },
        complete: (e) => {
          get().setMetrics(e.metrics);
          set({ status: 'complete' });
        },
      };

      const stopMock = startMockStream(scenario, handlers);
      setTimeout(() => stopMock(), 15000);

      return mockSessionId;
    }

    return get().sessionId || '';
  },

  // ── REAL BACKEND INTEGRATION ─────────────────────────────────────────
  runUploadAndAgent: async (scenario) => {
    const state = get();
    const files = state.uploadedFiles.map((u) => u.file);
    const prompt = state.userPrompt;
    const scenarioId = scenario;

    set({ status: 'uploading', scenarioId, isMockMode: false });

    try {
      // Step 1: Upload files
      const uploadRes = await uploadFiles(files, prompt);

      set({
        sessionId: uploadRes.session_id,
        sourcesUploaded: uploadRes.sources_uploaded,
        sourcesAutoFilled: uploadRes.sources_auto_filled,
        totalSources: uploadRes.total_sources,
        sources: uploadRes.source_summaries.map(mapSourceSummary),
        status: 'connecting',
      });

      // Mark uploaded files as done
      set((s) => ({
        uploadedFiles: s.uploadedFiles.map((u) => ({ ...u, status: 'done' as const })),
      }));

      // Step 2: Connect WebSocket
      const ws = createAgentSocket(uploadRes.session_id, {
        onOpen: () => {
          set({ status: 'running' });
        },
        onMessage: (msg: WebSocketMessage) => {
          switch (msg.type) {
            case 'status':
              set({ currentNode: msg.node });
              get().addAuditEntry({
                timestamp_ms: get().elapsedMs,
                event: `node_${msg.status}`,
                detail: msg.node,
                status: 'info',
              });
              break;
            case 'transition': {
              set({ currentNode: msg.node });
              const summary = msg.current_state_summary;
              // Update counts in insights/token stream
              if (msg.node === 'analyze') {
                get().appendToken(`\n[analyze] ${summary.raw_sources_count} sources, ${summary.filtered_sources_count} filtered\n`);
              } else if (msg.node === 'plan') {
                get().appendToken(`\n[plan] ${summary.action_plan_count} actions planned\n`);
              } else if (msg.node === 'execute') {
                get().appendToken(`\n[execute] running ${summary.action_plan_count} steps...\n`);
              }
              break;
            }
            case 'complete': {
              set({ status: 'complete' });
              // Fetch final session state for insights
              getSessionState(uploadRes.session_id)
                .then((sessionState) => {
                  set({ finalState: sessionState });
                  // Derive metrics from session state outcome
                  const outcome = sessionState.outcome || {};
                  const metrics: ImpactMetrics = {
                    risk_delta: (outcome.risk_delta as number) ?? 0,
                    latency_ms: get().elapsedMs,
                    steps_completed: (outcome.mitigations_executed as number) ?? 0,
                    steps_total: (outcome.mitigations_executed as number) ?? 0,
                    cost_saved: (outcome.estimated_cost_impact as number) ?? 0,
                    scenario_name: scenarioId.replace(/_/g, ' '),
                  };
                  set({ metrics });
                })
                .catch(console.error);
              break;
            }
            case 'error': {
              set({ status: 'error' });
              get().addAuditEntry({
                timestamp_ms: get().elapsedMs,
                event: 'error',
                detail: msg.error,
                status: 'error',
              });
              break;
            }
          }
        },
        onError: (err) => {
          console.error('[WebSocket error]', err);
          set({ status: 'error' });
        },
        onClose: () => {
          // If still running when closed, may have completed already
          const currentStatus = get().status;
          if (currentStatus === 'running') {
            set({ status: 'error' });
          }
        },
      });

      activeSocket = ws;

      // Step 3: Trigger agent run
      await runAgentScenario(scenarioId);

      // Start elapsed timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        set({ elapsedMs: Date.now() - startTime });
      }, 100);

      // Clean up timer when complete
      const unsub = useAgentStore.subscribe((s) => {
        if (s.status === 'complete' || s.status === 'error') {
          clearInterval(timer);
          unsub();
        }
      });
    } catch (err) {
      console.warn('[runUploadAndAgent] Backend failed, falling back to mock:', err);

      // ── FALLBACK TO MOCK ──────────────────────────────────────────────
      set({ isMockMode: true, status: 'running' });
      const stopMock = startMockStream(scenarioId, {
        node_start: (e: Extract<AgentEvent, { type: 'node_start' }>) => {
          get().setCurrentNode(e.node);
          get().addAuditEntry({
            timestamp_ms: get().elapsedMs,
            event: 'node_start',
            detail: e.node,
            status: 'info',
          });
        },
        source_ingested: (e: Extract<AgentEvent, { type: 'source_ingested' }>) => get().addSource(e.source),
        contradiction: (e: Extract<AgentEvent, { type: 'contradiction' }>) => get().addContradiction(e.data),
        llm_token: (e: Extract<AgentEvent, { type: 'llm_token' }>) => get().appendToken(e.content),
        action_chain: (e: Extract<AgentEvent, { type: 'action_chain' }>) => get().setChain(e.chain),
        step_start: (e: Extract<AgentEvent, { type: 'step_start' }>) => get().updateStep(e.step, 'active'),
        step_complete: (e: Extract<AgentEvent, { type: 'step_complete' }>) => get().updateStep(e.step, 'complete', Math.floor(200 + Math.random() * 500)),
        step_failed: (e: Extract<AgentEvent, { type: 'step_failed' }>) => get().updateStep(e.step, 'failed'),
        self_heal: (e: Extract<AgentEvent, { type: 'self_heal' }>) => {
          get().setHealEvent({ tier: e.tier, detail: e.detail, status: 'retrying' });
          setTimeout(() => get().setHealEvent(null), 2000);
        },
        complete: (e: Extract<AgentEvent, { type: 'complete' }>) => {
          get().setMetrics(e.metrics);
          set({ status: 'complete' });
        },
      });

      // Mock timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        set({ elapsedMs: Date.now() - startTime });
      }, 100);

      const unsub = useAgentStore.subscribe((s) => {
        if (s.status === 'complete' || s.status === 'error') {
          clearInterval(timer);
          stopMock();
          unsub();
        }
      });
    }
  },
}));
