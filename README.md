# E-Commerce AI Agent Platform

## 1. Executive Summary

This platform is a highly autonomous, agentic supply chain intelligence engine designed to operate within multi-channel e-commerce environments. Built on the Antigravity framework, the system is engineered to function not merely as a passive dashboard, but as an active, state-aware orchestrator. It autonomously ingests heterogeneous, unstructured operational data streams (PDF reports, live web scraping, CSV dumps, and real-time feeds), categorizes them without hardcoded configurations, and cross-references signals against a 90-day baseline stored in a robust SQLite WAL-enabled data layer. The agentic loop dynamically identifies operational anomalies, calculates time-series drift, formulates execution plans, and dispatches mitigations while strictly adhering to self-adjusting operational constraints.

## 2. Architectural Migration Note

The core event-driven state machine at the heart of this system was originally conceptualized as "Grid Sentinel"—a high-throughput, real-time monitoring architecture engineered for large-scale utility telemetry and anomaly detection. To adapt to the volatility of retail supply chains, the architecture was elegantly pivoted from fixed-sensor telemetry to high-concurrency, multi-channel operational intelligence. The continuous ingestion loops, statistical anomaly detection (z-score variance), and self-healing action graphs built for grid failure have been successfully recontextualized to resolve highly mutable retail data schemas, enabling a transition from infrastructural monitoring to autonomous retail operations.

## 3. Autonomous Feature Breakdown

The platform leverages LangGraph state machines and specialized analytical queries to autonomously resolve six critical supply chain operational vectors:

- **Ghost Stock Reconciliation**: Continuously computes the delta between `units_available` and `last_physical_count`. If a discrepancy exceeds 20%, the temporal engine flags the SKU and triggers a dynamic constraint adjustment, drastically reducing the `manager_approval_threshold` to prevent automated overselling.
- **Cross-Channel Price Drift Mitigation**: Parses live pricing data across first-party channels (Web, App) and third-party aggregators (e.g., Daraz). If negative variance exceeds the 10% threshold, the agent automatically toggles competitive matching constraints and schedules synchronization pipelines.
- **Fragmented Returns Analysis**: Correlates return rates dynamically against the 90-day SQLite baseline utilizing standard deviation (`SQRT(AVG(x²) - AVG(x)²)`) inside pure SQL CTEs, immediately escalating systematic fulfillment or product quality defects before they cascade.
- **Influencer-Driven Demand Spikes**: The temporal analysis engine monitors multi-channel `order_velocity`. When rolling 7-day velocity exceeds 150% of the established baseline, the constraint builder proactively raises the `emergency_restock_budget` and accelerates `restock_lead_time_days` to prevent critical stockouts.
- **Supplier Degradation & Drift**: Continuously tracks fulfillment rates and delivery SLAs within `supplier_records`. A decaying on-time delivery rate (< 70%) or unrecorded overdue deliveries directly triggers escalation protocols, shortening contact deadlines and alerting human oversight.
- **Sentiment & Quality Disconnects**: Cross-references structured CSV summaries with real-time NLP sentiment feeds. Contradiction scoring dynamically weights real-time crisis signals over stale batch reports using decaying credibility algorithms, ensuring the agent reacts to immediate customer reality rather than outdated static dashboards!.

## 4. Technical Stack & Architecture Highlights

- **Data Layer Consistency**: Driven by an embedded SQLite architecture leveraging Write-Ahead Logging (`PRAGMA journal_mode=WAL`) for high-concurrency non-blocking reads. The baseline metrics, anomaly detection, and historical tracking are pushed down to the database layer via complex Common Table Expressions (CTEs), offloading analytical weight from the Python execution context.
- **Asynchronous State Synchronization**: Real-time event propagation utilizing `asyncio.gather` and `loop.run_in_executor` allows high-latency database queries and file parsing routines to resolve concurrently without stalling the primary agentic event loop.
- **Agentic Tool-Calling Loops**: Powered by a compiled LangGraph state machine. The orchestrator transitions through heavily defined states (`ingest` → `analyze` → `plan` → `execute` → `evaluate` → `self_heal`), passing a highly structured `AgentState` object. Temporal signals and dynamically built constraints are injected into the execution context prior to LLM evaluation, forcing the language model to abide by strict operational rules rather than generating hallucinated mitigations.
- **Dynamic Context Enrichment**: Operates completely devoid of hardcoded scenarios. A heuristic scoring classifier evaluates inbound files, routes them to the correct structural parsers, and merges the text with its corresponding SQL baseline. This creates a deeply enriched data bus that dictates the agent's behavior purely based on systemic data realities.
