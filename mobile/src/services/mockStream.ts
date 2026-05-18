// src/services/mockStream.ts — Pre-scripted event sequences for all 3 scenarios
import type { AgentEvent, ScenarioId, DataSource, Action, Contradiction } from '../types/agent';

export type EventHandlers = {
  [K in AgentEvent['type']]: (event: Extract<AgentEvent, { type: K }>) => void;
};

// ── Scenario source data ─────────────────────────────────────────────
const scenarioSources: Record<ScenarioId, DataSource[]> = {
  supply_chain: [
    { source_id: 'src_pdf_01', source_type: 'pdf', credibility_score: 0.92, freshness: 'fresh', domain_hints: ['logistics'], ingested_at: new Date().toISOString(), label: 'Supplier Contract Q4' },
    { source_id: 'src_csv_02', source_type: 'csv', credibility_score: 0.41, freshness: 'stale', domain_hints: ['inventory'], ingested_at: new Date().toISOString(), label: 'Stock Levels Export' },
    { source_id: 'src_web_03', source_type: 'web', credibility_score: 0.78, freshness: 'fresh', domain_hints: ['shipping'], ingested_at: new Date().toISOString(), label: 'Port Congestion Report' },
    { source_id: 'src_tbl_04', source_type: 'table', credibility_score: 0.85, freshness: 'fresh', domain_hints: ['procurement'], ingested_at: new Date().toISOString(), label: 'Vendor Risk Matrix' },
    { source_id: 'src_rt_05', source_type: 'realtime', credibility_score: 0.90, freshness: 'fresh', domain_hints: ['demand'], ingested_at: new Date().toISOString(), label: 'Live Demand Feed' },
  ],
  power_grid: [
    { source_id: 'src_pdf_01', source_type: 'pdf', credibility_score: 0.88, freshness: 'fresh', domain_hints: ['grid'], ingested_at: new Date().toISOString(), label: 'Grid Topology Report' },
    { source_id: 'src_csv_02', source_type: 'csv', credibility_score: 0.35, freshness: 'expired', domain_hints: ['load'], ingested_at: new Date().toISOString(), label: 'Load Readings Archive' },
    { source_id: 'src_web_03', source_type: 'web', credibility_score: 0.72, freshness: 'fresh', domain_hints: ['weather'], ingested_at: new Date().toISOString(), label: 'Weather Alert API' },
    { source_id: 'src_tbl_04', source_type: 'table', credibility_score: 0.81, freshness: 'fresh', domain_hints: ['maintenance'], ingested_at: new Date().toISOString(), label: 'Maintenance Schedule' },
    { source_id: 'src_rt_05', source_type: 'realtime', credibility_score: 0.95, freshness: 'fresh', domain_hints: ['sensors'], ingested_at: new Date().toISOString(), label: 'Live Sensor Stream' },
  ],
  sentiment_crisis: [
    { source_id: 'src_pdf_01', source_type: 'pdf', credibility_score: 0.80, freshness: 'fresh', domain_hints: ['brand'], ingested_at: new Date().toISOString(), label: 'Brand Health Survey' },
    { source_id: 'src_csv_02', source_type: 'csv', credibility_score: 0.45, freshness: 'stale', domain_hints: ['sales'], ingested_at: new Date().toISOString(), label: 'Sales Trend Export' },
    { source_id: 'src_web_03', source_type: 'web', credibility_score: 0.68, freshness: 'fresh', domain_hints: ['social'], ingested_at: new Date().toISOString(), label: 'Twitter Sentiment API' },
    { source_id: 'src_tbl_04', source_type: 'table', credibility_score: 0.90, freshness: 'fresh', domain_hints: ['crm'], ingested_at: new Date().toISOString(), label: 'CRM Ticket Database' },
    { source_id: 'src_rt_05', source_type: 'realtime', credibility_score: 0.87, freshness: 'fresh', domain_hints: ['reviews'], ingested_at: new Date().toISOString(), label: 'Live Review Stream' },
  ],
};

// ── Scenario contradictions ──────────────────────────────────────────
const scenarioContradictions: Record<ScenarioId, Contradiction[]> = {
  supply_chain: [
    {
      id: 'ctr_01', status: 'active',
      source_a: { id: 'src_csv_02', type: 'csv', credibility: 0.41 },
      source_b: { id: 'src_rt_05', type: 'realtime', credibility: 0.90 },
      resolution: 'CSV stock data from 14 days ago contradicts live demand feed. CSV flagged as STALE — using real-time data.',
      flagged_source_id: 'src_csv_02',
    },
  ],
  power_grid: [
    {
      id: 'ctr_01', status: 'active',
      source_a: { id: 'src_csv_02', type: 'csv', credibility: 0.35 },
      source_b: { id: 'src_rt_05', type: 'realtime', credibility: 0.95 },
      resolution: 'Archived load readings show normal — live sensors detect 3x surge. CSV flagged as EXPIRED.',
      flagged_source_id: 'src_csv_02',
    },
    {
      id: 'ctr_02', status: 'active',
      source_a: { id: 'src_web_03', type: 'web', credibility: 0.72 },
      source_b: { id: 'src_tbl_04', type: 'table', credibility: 0.81 },
      resolution: 'Weather alert predicts storm in 6h but maintenance scheduled for tomorrow. Escalating maintenance priority.',
      flagged_source_id: 'src_web_03',
    },
  ],
  sentiment_crisis: [
    {
      id: 'ctr_01', status: 'active',
      source_a: { id: 'src_csv_02', type: 'csv', credibility: 0.45 },
      source_b: { id: 'src_web_03', type: 'web', credibility: 0.68 },
      resolution: 'Sales export shows +2% growth, but social sentiment is -34%. Sales data lags behind real-time sentiment shift.',
      flagged_source_id: 'src_csv_02',
    },
  ],
};

// ── Scenario action chains ───────────────────────────────────────────
const scenarioActions: Record<ScenarioId, Action[]> = {
  supply_chain: [
    { step: 1, name: 'Validate Stock', description: 'Cross-check inventory against live demand feed', status: 'pending', fallback_action: 'Use cached inventory data' },
    { step: 2, name: 'Notify Procurement', description: 'Alert procurement team of supply gap', status: 'pending', fallback_action: 'Queue email notification' },
    { step: 3, name: 'Simulate Order', description: 'Run reorder simulation with updated data', status: 'pending', fallback_action: 'Use historical reorder template' },
    { step: 4, name: 'Update Estimates', description: 'Recalculate delivery timelines', status: 'pending' },
    { step: 5, name: 'Schedule Monitoring', description: 'Set up 24h demand monitoring alerts', status: 'pending' },
  ],
  power_grid: [
    { step: 1, name: 'Confirm Outage', description: 'Verify fault from multiple sensor sources', status: 'pending' },
    { step: 2, name: 'Isolate Fault', description: 'Identify and isolate the affected grid segment', status: 'pending', fallback_action: 'Emergency shutdown protocol' },
    { step: 3, name: 'Reroute Load', description: 'Balance load across healthy segments', status: 'pending', fallback_action: 'Enable backup generators' },
    { step: 4, name: 'Escalate Ticket', description: 'Create priority maintenance ticket', status: 'pending' },
    { step: 5, name: 'Deploy Monitoring', description: 'Activate enhanced grid monitoring', status: 'pending' },
  ],
  sentiment_crisis: [
    { step: 1, name: 'Identify Root Cause', description: 'Analyze sentiment drivers from social data', status: 'pending' },
    { step: 2, name: 'Flag At-Risk SKUs', description: 'Identify products mentioned in negative sentiment', status: 'pending', fallback_action: 'Flag top 10 SKUs by volume' },
    { step: 3, name: 'Draft Response', description: 'Generate PR response template', status: 'pending' },
    { step: 4, name: 'Notify Stakeholders', description: 'Alert brand and product teams', status: 'pending' },
    { step: 5, name: 'Setup Daily Monitor', description: 'Configure 7-day sentiment tracking dashboard', status: 'pending' },
  ],
};

// ── LLM reasoning tokens ─────────────────────────────────────────────
const scenarioLLMTokens: Record<ScenarioId, string[]> = {
  supply_chain: [
    '> Analyzing 5 data sources for supply chain crisis...\n',
    '> Source credibility scores: PDF(0.92) CSV(0.41) WEB(0.78) TBL(0.85) RT(0.90)\n',
    '> ALERT: Credibility gap detected — CSV stock data is 0.49 below live feed\n',
    '> CSV last updated: 14 days ago — freshness: STALE\n',
    '> Flagging src_csv_02 as STALE — excluding from decision basis\n',
    '> Generating 5-step action chain based on 4 trusted sources...\n',
    '> Risk assessment: Stock verification critical — demand surge 23% above forecast\n',
    '> Recommended action: Validate → Notify → Simulate → Update → Monitor\n',
  ],
  power_grid: [
    '> Analyzing 5 data sources for power grid fault...\n',
    '> Source credibility: PDF(0.88) CSV(0.35) WEB(0.72) TBL(0.81) RT(0.95)\n',
    '> CRITICAL: Live sensors show 3x load surge on segment 7B\n',
    '> Archived CSV readings show normal — EXPIRED data, ignoring\n',
    '> Weather API predicts severe storm in 6 hours\n',
    '> Cross-referencing maintenance schedule — conflict detected\n',
    '> Escalating maintenance to immediate priority\n',
    '> Generating emergency response chain...\n',
  ],
  sentiment_crisis: [
    '> Analyzing 5 data sources for sentiment crisis...\n',
    '> Source credibility: PDF(0.80) CSV(0.45) WEB(0.68) TBL(0.90) RT(0.87)\n',
    '> Social sentiment: -34% shift detected in last 48h\n',
    '> Sales CSV shows +2% growth — CONTRADICTS social data\n',
    '> Sales data is lagging indicator — sentiment leads by ~72h\n',
    '> Flagging CSV as STALE for this analysis window\n',
    '> Identifying 3 at-risk SKUs from negative mentions\n',
    '> Generating response plan with daily monitoring...\n',
  ],
};

// ── Before/After states ──────────────────────────────────────────────
const scenarioBeforeStates: Record<ScenarioId, Record<string, string>> = {
  supply_chain: { 'Stock Status': 'UNKNOWN', 'Supplier Alert': 'UNRESOLVED', 'Risk Level': 'HIGH', 'Monitoring': 'NONE' },
  power_grid: { 'Outage Status': 'UNVERIFIED', 'Fault Ticket': 'OPEN', 'Load Balance': 'CRITICAL', 'Monitoring': 'NONE' },
  sentiment_crisis: { 'Root Cause': 'UNKNOWN', 'At-Risk SKUs': 'UNTRACKED', 'Response Plan': 'NONE', 'Monitoring': 'NONE' },
};

const scenarioAfterStates: Record<ScenarioId, Record<string, string>> = {
  supply_chain: { 'Stock Status': 'VERIFIED', 'Supplier Alert': 'ESCALATED', 'Risk Level': 'MEDIUM', 'Monitoring': 'ACTIVE (24h)' },
  power_grid: { 'Outage Status': 'CONFIRMED', 'Fault Ticket': 'ESCALATED', 'Load Balance': 'REROUTED', 'Monitoring': 'ACTIVE (48h)' },
  sentiment_crisis: { 'Root Cause': 'IDENTIFIED', 'At-Risk SKUs': 'FLAGGED (3)', 'Response Plan': 'DRAFTED', 'Monitoring': 'DAILY (7d)' },
};

// ── Main mock stream function ────────────────────────────────────────
export function startMockStream(
  scenarioId: ScenarioId,
  handlers: Partial<EventHandlers>
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  const emit = <T extends AgentEvent['type']>(
    type: T,
    event: Extract<AgentEvent, { type: T }>,
    delay: number
  ) => {
    const handler = handlers[type] as ((e: Extract<AgentEvent, { type: T }>) => void) | undefined;
    if (handler) {
      timeouts.push(setTimeout(() => handler(event), delay));
    }
  };

  const sources = scenarioSources[scenarioId];
  const contradictions = scenarioContradictions[scenarioId];
  const actions = scenarioActions[scenarioId];
  const tokens = scenarioLLMTokens[scenarioId];

  // Phase 1: Ingest
  emit('node_start', { type: 'node_start', node: 'ingest' }, 0);

  sources.forEach((source, i) => {
    emit('source_ingested', { type: 'source_ingested', source }, 200 + i * 400);
  });

  // Phase 2: Analyze
  emit('node_start', { type: 'node_start', node: 'analyze' }, 2200);

  contradictions.forEach((c, i) => {
    emit('contradiction', { type: 'contradiction', data: c }, 3000 + i * 800);
  });

  // LLM token stream
  let tokenDelay = 3200;
  tokens.forEach((token) => {
    for (let i = 0; i < token.length; i++) {
      emit('llm_token', { type: 'llm_token', content: token[i] }, tokenDelay);
      tokenDelay += 40;
    }
  });

  // Phase 3: Plan
  emit('node_start', { type: 'node_start', node: 'plan' }, 5200);
  emit('action_chain', { type: 'action_chain', chain: actions }, 5800);

  // Phase 4: Execute steps
  const stepTimings = [
    { step: 1, startAt: 6500,  completeAt: 7200,  latency: 340 },
    { step: 2, startAt: 7500,  failAt: 8000,      latency: 280 },  // this one fails
    // Self-heal at 8200
    { step: 2, recoverAt: 9200, latency: 620 },   // recovery
    { step: 3, startAt: 9500,  completeAt: 10200, latency: 380 },
    { step: 4, startAt: 10500, completeAt: 11100, latency: 190 },
    { step: 5, startAt: 11400, completeAt: 11800, latency: 410 },
  ];

  // Step 1: success
  emit('step_start', { type: 'step_start', step: 1, action: { ...actions[0], status: 'active' } }, 6500);
  emit('step_complete', { type: 'step_complete', step: 1, snapshot: { snapshot_id: 'snap_1', step: 1, timestamp_ms: 7200, state_summary: {} } }, 7200);

  // Step 2: fail → self-heal → recover
  emit('step_start', { type: 'step_start', step: 2, action: { ...actions[1], status: 'active' } }, 7500);
  emit('step_failed', { type: 'step_failed', step: 2, error: 'Procurement API timeout (504)' }, 8000);
  emit('self_heal', { type: 'self_heal', tier: 1, detail: 'Retrying with exponential backoff...' }, 8200);

  // Emit more LLM tokens during self-heal
  const healTokens = '> Self-heal triggered: Tier 1 retry with backoff\n> Attempt 2/3: Procurement API responding...\n> Recovery successful — continuing chain\n';
  let healDelay = 8300;
  for (let i = 0; i < healTokens.length; i++) {
    emit('llm_token', { type: 'llm_token', content: healTokens[i] }, healDelay);
    healDelay += 35;
  }

  emit('step_complete', { type: 'step_complete', step: 2, snapshot: { snapshot_id: 'snap_2', step: 2, timestamp_ms: 9200, state_summary: {} } }, 9200);

  // Steps 3–5: success
  emit('step_start', { type: 'step_start', step: 3, action: { ...actions[2], status: 'active' } }, 9500);
  emit('step_complete', { type: 'step_complete', step: 3, snapshot: { snapshot_id: 'snap_3', step: 3, timestamp_ms: 10200, state_summary: {} } }, 10200);

  emit('step_start', { type: 'step_start', step: 4, action: { ...actions[3], status: 'active' } }, 10500);
  emit('step_complete', { type: 'step_complete', step: 4, snapshot: { snapshot_id: 'snap_4', step: 4, timestamp_ms: 11100, state_summary: {} } }, 11100);

  emit('step_start', { type: 'step_start', step: 5, action: { ...actions[4], status: 'active' } }, 11400);
  emit('step_complete', { type: 'step_complete', step: 5, snapshot: { snapshot_id: 'snap_5', step: 5, timestamp_ms: 11800, state_summary: {} } }, 11800);

  // Phase 5: Complete
  const scenarioNames: Record<ScenarioId, string> = {
    supply_chain: 'Supply Chain Crisis',
    power_grid: 'Power Grid Fault',
    sentiment_crisis: 'Sentiment Crisis',
  };

  emit('complete', {
    type: 'complete',
    metrics: {
      risk_delta: 34,
      latency_ms: 13000,
      steps_completed: 5,
      steps_total: 5,
      cost_saved: 0,
      scenario_name: scenarioNames[scenarioId],
    },
  }, 13000);

  // Set before/after states via custom handler
  if (handlers.node_start) {
    timeouts.push(setTimeout(() => {
      // We dispatch these through a special approach — the screen will read from scenario data
    }, 5000));
  }

  // Return cleanup
  return () => {
    timeouts.forEach(clearTimeout);
  };
}

// Export scenario data for screens that need it
export { scenarioSources, scenarioBeforeStates, scenarioAfterStates, scenarioContradictions };
