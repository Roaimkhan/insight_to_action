// src/services/mockStream.ts — Pre-scripted event sequences for all 3 scenarios
import type { AgentEvent, ScenarioId, DataSource, Contradiction, Action } from '../types/agent';

export type EventHandlers = {
  [K in AgentEvent['type']]: (event: Extract<AgentEvent, { type: K }>) => void;
};

// ── Scenario Data ─────────────────────────────────────────────────────────

const scenarioSources: Record<ScenarioId, DataSource[]> = {
  supply_chain: [
    { source_id: 'sc-pdf-1', source_type: 'pdf', credibility_score: 0.92, freshness: 'fresh', domain_hints: ['logistics'], ingested_at: new Date().toISOString(), label: 'Q2 Inventory Report.pdf' },
    { source_id: 'sc-csv-1', source_type: 'csv', credibility_score: 0.41, freshness: 'stale', domain_hints: ['procurement'], ingested_at: new Date().toISOString(), label: 'supplier_pricing_may.csv' },
    { source_id: 'sc-web-1', source_type: 'web', credibility_score: 0.78, freshness: 'fresh', domain_hints: ['market'], ingested_at: new Date().toISOString(), label: 'reuters.com/supply-chains' },
    { source_id: 'sc-tbl-1', source_type: 'table', credibility_score: 0.85, freshness: 'fresh', domain_hints: ['internal'], ingested_at: new Date().toISOString(), label: 'warehouse_stock_levels' },
    { source_id: 'sc-rt-1', source_type: 'realtime', credibility_score: 0.90, freshness: 'fresh', domain_hints: ['iot'], ingested_at: new Date().toISOString(), label: 'IoT Sensor Feed — Bay 7' },
  ],
  power_grid: [
    { source_id: 'pg-pdf-1', source_type: 'pdf', credibility_score: 0.88, freshness: 'fresh', domain_hints: ['energy'], ingested_at: new Date().toISOString(), label: 'Grid Status Report.pdf' },
    { source_id: 'pg-csv-1', source_type: 'csv', credibility_score: 0.55, freshness: 'stale', domain_hints: ['metrics'], ingested_at: new Date().toISOString(), label: 'load_balance_data.csv' },
    { source_id: 'pg-web-1', source_type: 'web', credibility_score: 0.72, freshness: 'fresh', domain_hints: ['news'], ingested_at: new Date().toISOString(), label: 'energy.gov/outage-tracker' },
    { source_id: 'pg-tbl-1', source_type: 'table', credibility_score: 0.91, freshness: 'fresh', domain_hints: ['scada'], ingested_at: new Date().toISOString(), label: 'substation_readings' },
    { source_id: 'pg-rt-1', source_type: 'realtime', credibility_score: 0.65, freshness: 'expired', domain_hints: ['sensor'], ingested_at: new Date().toISOString(), label: 'Transformer Temp Feed' },
  ],
  sentiment_crisis: [
    { source_id: 'st-pdf-1', source_type: 'pdf', credibility_score: 0.80, freshness: 'fresh', domain_hints: ['brand'], ingested_at: new Date().toISOString(), label: 'Brand Health Survey.pdf' },
    { source_id: 'st-csv-1', source_type: 'csv', credibility_score: 0.70, freshness: 'fresh', domain_hints: ['sales'], ingested_at: new Date().toISOString(), label: 'sku_returns_q2.csv' },
    { source_id: 'st-web-1', source_type: 'web', credibility_score: 0.60, freshness: 'stale', domain_hints: ['social'], ingested_at: new Date().toISOString(), label: 'twitter.com/trending' },
    { source_id: 'st-tbl-1', source_type: 'table', credibility_score: 0.85, freshness: 'fresh', domain_hints: ['crm'], ingested_at: new Date().toISOString(), label: 'support_ticket_log' },
    { source_id: 'st-rt-1', source_type: 'realtime', credibility_score: 0.90, freshness: 'fresh', domain_hints: ['nlp'], ingested_at: new Date().toISOString(), label: 'Real-time Sentiment API' },
  ],
};

const scenarioContradictions: Record<ScenarioId, Contradiction[]> = {
  supply_chain: [{
    id: 'c-sc-1',
    source_a: { id: 'sc-csv-1', type: 'csv', credibility: 0.41 },
    source_b: { id: 'sc-rt-1', type: 'realtime', credibility: 0.90 },
    resolution: 'CSV pricing data is 3 weeks old. Real-time IoT sensor confirms current stock levels. CSV flagged as STALE.',
    flagged_source_id: 'sc-csv-1',
    status: 'active',
  }],
  power_grid: [
    {
      id: 'c-pg-1',
      source_a: { id: 'pg-csv-1', type: 'csv', credibility: 0.55 },
      source_b: { id: 'pg-tbl-1', type: 'table', credibility: 0.91 },
      resolution: 'Load balance CSV conflicts with live substation readings. CSV data predates latest outage event.',
      flagged_source_id: 'pg-csv-1',
      status: 'active',
    },
    {
      id: 'c-pg-2',
      source_a: { id: 'pg-rt-1', type: 'realtime', credibility: 0.65 },
      source_b: { id: 'pg-pdf-1', type: 'pdf', credibility: 0.88 },
      resolution: 'Transformer temp feed shows expired sensor calibration. Grid report takes priority.',
      flagged_source_id: 'pg-rt-1',
      status: 'active',
    },
  ],
  sentiment_crisis: [{
    id: 'c-st-1',
    source_a: { id: 'st-web-1', type: 'web', credibility: 0.60 },
    source_b: { id: 'st-rt-1', type: 'realtime', credibility: 0.90 },
    resolution: 'Scraped social data is 48h stale. Real-time sentiment API shows shifted narrative.',
    flagged_source_id: 'st-web-1',
    status: 'active',
  }],
};

const scenarioChains: Record<ScenarioId, Action[]> = {
  supply_chain: [
    { step: 1, name: 'Validate stock levels', description: 'Cross-check IoT sensor data against warehouse DB', status: 'pending' },
    { step: 2, name: 'Notify procurement', description: 'Send urgent restock alert to procurement team', status: 'pending' },
    { step: 3, name: 'Simulate reorder', description: 'Run Monte Carlo simulation on optimal order quantity', status: 'pending' },
    { step: 4, name: 'Update delivery estimates', description: 'Recalculate ETAs based on current logistics data', status: 'pending' },
    { step: 5, name: 'Schedule monitoring', description: 'Set up 24h automated monitoring on Bay 7 sensors', status: 'pending' },
  ],
  power_grid: [
    { step: 1, name: 'Confirm outage scope', description: 'Verify affected substations from SCADA data', status: 'pending' },
    { step: 2, name: 'Escalate fault ticket', description: 'Create P1 incident and assign to grid ops team', status: 'pending' },
    { step: 3, name: 'Reroute load balance', description: 'Redistribute power load to unaffected zones', status: 'pending' },
    { step: 4, name: 'Deploy field crew', description: 'Dispatch nearest maintenance team to fault location', status: 'pending' },
    { step: 5, name: 'Activate backup gen', description: 'Spin up diesel generators for critical infrastructure', status: 'pending' },
  ],
  sentiment_crisis: [
    { step: 1, name: 'Identify root cause', description: 'Trace negative sentiment spike to originating event', status: 'pending' },
    { step: 2, name: 'Flag at-risk SKUs', description: 'Cross-reference complaint topics with product catalog', status: 'pending' },
    { step: 3, name: 'Draft response', description: 'Generate crisis communication template', status: 'pending' },
    { step: 4, name: 'Notify stakeholders', description: 'Alert brand team and customer success managers', status: 'pending' },
    { step: 5, name: 'Setup daily monitor', description: 'Configure 7-day sentiment tracking dashboard', status: 'pending' },
  ],
};

const scenarioLLMTokens: Record<ScenarioId, string[]> = {
  supply_chain: [
    '> Ingesting source: Q2 Inventory Report.pdf\n',
    '  Extracted 8 claims, 3 numerical, 5 qualitative\n',
    '> Ingesting source: supplier_pricing_may.csv\n',
    '  Extracted 12 rows, 4 price-point claims\n',
    '> Ingesting source: reuters.com/supply-chains\n',
    '  Scraped 3 articles, 6 relevant claims\n',
    '> Ingesting source: warehouse_stock_levels\n',
    '  Table scan: 847 rows, 5 key metrics extracted\n',
    '> Ingesting source: IoT Sensor Feed — Bay 7\n',
    '  Real-time: 120 readings/min, current stock validated\n',
    '\n',
    '> Cross-referencing claim #4 (CSV: stock depleted) vs claim #9 (IoT: stock at 73%)\n',
    '  ⚠ CONTRADICTION DETECTED — credibility delta: 0.49\n',
    '  Source priority: IoT Feed (0.90) > CSV (0.41)\n',
    '  CSV data age: 21 days — exceeds freshness threshold\n',
    '  → Flagging sc-csv-1 as STALE\n',
    '  Resolution confidence: 0.87\n',
    '\n',
    '> Generating action chain...\n',
    '  5 steps identified for supply chain crisis resolution\n',
    '  Estimated execution time: 4.2s\n',
  ],
  power_grid: [
    '> Ingesting source: Grid Status Report.pdf\n',
    '  Extracted 11 claims, 6 numerical\n',
    '> Ingesting source: load_balance_data.csv\n',
    '  Extracted 8 load distribution claims\n',
    '> Ingesting source: energy.gov/outage-tracker\n',
    '  Scraped 2 active outage reports\n',
    '> Ingesting source: substation_readings\n',
    '  Table: 2,340 readings, 3 anomalies flagged\n',
    '> Ingesting source: Transformer Temp Feed\n',
    '  Real-time: last calibration expired 7d ago\n',
    '\n',
    '> Cross-referencing load data vs substation readings\n',
    '  ⚠ CONTRADICTION #1 — load CSV predates outage event\n',
    '  ⚠ CONTRADICTION #2 — transformer feed calibration expired\n',
    '  → Flagging pg-csv-1 and pg-rt-1\n',
    '\n',
    '> Generating 5-step recovery chain...\n',
  ],
  sentiment_crisis: [
    '> Ingesting source: Brand Health Survey.pdf\n',
    '  Extracted 7 sentiment indicators\n',
    '> Ingesting source: sku_returns_q2.csv\n',
    '  144 return records, 3 SKU clusters identified\n',
    '> Ingesting source: twitter.com/trending\n',
    '  Scraped 450 mentions, sentiment: -0.67 avg\n',
    '> Ingesting source: support_ticket_log\n',
    '  Table: 89 open tickets, 12 tagged "urgent"\n',
    '> Ingesting source: Real-time Sentiment API\n',
    '  Live score: -0.42 (improving from -0.67)\n',
    '\n',
    '> Stale social data detected vs real-time sentiment\n',
    '  ⚠ CONTRADICTION — twitter scrape 48h old\n',
    '  → Flagging st-web-1 as STALE\n',
    '\n',
    '> Generating crisis response chain...\n',
  ],
};

const scenarioBeforeAfter: Record<ScenarioId, { before: Record<string, string>; after: Record<string, string> }> = {
  supply_chain: {
    before: { 'Stock Status': 'UNKNOWN', 'Supplier Alert': 'UNRESOLVED', 'Risk Level': 'HIGH', 'Monitoring': 'NONE' },
    after:  { 'Stock Status': 'VERIFIED ✓', 'Supplier Alert': 'ESCALATED ✓', 'Risk Level': 'MEDIUM', 'Monitoring': 'ACTIVE (24h)' },
  },
  power_grid: {
    before: { 'Outage Status': 'UNVERIFIED', 'Fault Ticket': 'OPEN', 'Load Balance': 'CRITICAL' },
    after:  { 'Outage Status': 'CONFIRMED', 'Fault Ticket': 'ESCALATED', 'Load Balance': 'REROUTED' },
  },
  sentiment_crisis: {
    before: { 'Root Cause': 'UNKNOWN', 'At-Risk SKUs': 'UNTRACKED', 'Monitoring': 'NONE' },
    after:  { 'Root Cause': 'IDENTIFIED', 'At-Risk SKUs': 'FLAGGED (3)', 'Monitoring': 'DAILY (7d)' },
  },
};

// ── Mock Stream Engine ────────────────────────────────────────────────────

export function startMockStream(
  scenarioId: ScenarioId,
  handlers: Partial<EventHandlers>
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  const sources = scenarioSources[scenarioId];
  const contradictions = scenarioContradictions[scenarioId];
  const chain = scenarioChains[scenarioId];
  const tokens = scenarioLLMTokens[scenarioId];
  const ba = scenarioBeforeAfter[scenarioId];

  const emit = <T extends AgentEvent>(event: T) => {
    const handler = handlers[event.type] as ((e: T) => void) | undefined;
    if (handler) handler(event);
  };

  const schedule = (ms: number, fn: () => void) => {
    timeouts.push(setTimeout(fn, ms));
  };

  // 0ms — Start ingest node
  schedule(0, () => emit({ type: 'node_start', node: 'ingest' }));

  // Sources ingested — staggered 200ms apart starting at 200ms
  sources.forEach((source, i) => {
    schedule(200 + i * 400, () => emit({ type: 'source_ingested', source }));
  });

  // 2200ms — Switch to analyze node
  schedule(2200, () => emit({ type: 'node_start', node: 'analyze' }));

  // 3000ms — Contradictions
  contradictions.forEach((c, i) => {
    schedule(3000 + i * 500, () => emit({ type: 'contradiction', data: c }));
  });

  // 3200ms–5000ms — LLM tokens
  tokens.forEach((token, i) => {
    schedule(3200 + i * 100, () => emit({ type: 'llm_token', content: token }));
  });

  // 5200ms — Switch to plan node
  schedule(5200, () => emit({ type: 'node_start', node: 'plan' }));

  // 5800ms — Action chain
  schedule(5800, () => emit({ type: 'action_chain', chain: chain.map(a => ({ ...a })) }));

  // Steps execute — step 1
  schedule(6500, () => emit({ type: 'step_start', step: 1, action: { ...chain[0], status: 'active' } }));
  schedule(7200, () => emit({
    type: 'step_complete', step: 1,
    snapshot: { snapshot_id: 'snap-1', step: 1, timestamp_ms: 7200, state_summary: {} },
  }));

  // Step 2 — this one fails
  schedule(8000, () => emit({ type: 'step_start', step: 2, action: { ...chain[1], status: 'active' } }));
  schedule(8500, () => emit({ type: 'step_failed', step: 2, error: 'Connection timeout to procurement API' }));

  // Self-heal fires
  schedule(8600, () => emit({ type: 'self_heal', tier: 1, detail: 'Retrying with exponential backoff...' }));
  schedule(9200, () => emit({ type: 'self_heal', tier: 2, detail: 'Fallback: using cached procurement endpoint' }));

  // Step 2 recovery
  schedule(9800, () => emit({ type: 'step_start', step: 2, action: { ...chain[1], status: 'active', fallback_action: 'cached_endpoint' } }));
  schedule(10200, () => emit({
    type: 'step_complete', step: 2,
    snapshot: { snapshot_id: 'snap-2', step: 2, timestamp_ms: 10200, state_summary: {} },
  }));

  // Steps 3–5
  schedule(10500, () => emit({ type: 'step_start', step: 3, action: { ...chain[2], status: 'active' } }));
  schedule(11000, () => emit({
    type: 'step_complete', step: 3,
    snapshot: { snapshot_id: 'snap-3', step: 3, timestamp_ms: 11000, state_summary: {} },
  }));

  schedule(11200, () => emit({ type: 'step_start', step: 4, action: { ...chain[3], status: 'active' } }));
  schedule(11600, () => emit({
    type: 'step_complete', step: 4,
    snapshot: { snapshot_id: 'snap-4', step: 4, timestamp_ms: 11600, state_summary: {} },
  }));

  schedule(11800, () => emit({ type: 'step_start', step: 5, action: { ...chain[4], status: 'active' } }));
  schedule(12400, () => emit({
    type: 'step_complete', step: 5,
    snapshot: { snapshot_id: 'snap-5', step: 5, timestamp_ms: 12400, state_summary: {} },
  }));

  // Complete
  schedule(13000, () => emit({
    type: 'complete',
    metrics: {
      risk_delta: 34,
      latency_ms: 13000,
      steps_completed: 5,
      steps_total: 5,
      cost_saved: 0,
      scenario_name: scenarioId.replace(/_/g, ' '),
    },
  }));

  // Cleanup function
  return () => {
    timeouts.forEach(clearTimeout);
  };
}

export { scenarioBeforeAfter };
