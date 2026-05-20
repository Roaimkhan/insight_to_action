# E-Commerce AI Agent Platform — API Endpoint Documentation

Welcome to the autonomous backend, Frontend team! 🚀

This guide outlines the endpoints you'll use to interface with the Antigravity-powered AI orchestrator. The platform autonomously resolves core retail pain points (ghost stock, price drift, fragmented returns, supplier delays, influencer spikes, and sentiment disconnects) by streaming real-time agentic states directly to your UI.

---

## 1. Data Ingestion & Source Upload

These endpoints allow the frontend to upload unstructured data (PDFs, CSVs, live reports). This triggers the backend's `SourceClassifier` to automatically deduce the context, identify SKUs, and cross-reference them against the 90-day SQLite baseline (mitigating **ghost stock** and **supplier drift**).

### `POST /api/ingest/upload`
**Description:** Upload 1 to 5 heterogeneous operational files. If fewer than 5 files are uploaded, the backend autonomously queries the database (e.g., pulling recent price contradictions) to guarantee a rich context for the agent.

- **Content-Type:** `multipart/form-data`
- **Body:**
  - `files`: `List[File]` (Supported: `.pdf`, `.csv`, `.json`, `.html`, `.txt`)

**Success Response (200 OK):**
```json
{
  "session_id": "a1b2c3d4-5678-90ef-gh12-34567890abcd",
  "sources_uploaded": 2,
  "sources_auto_filled": 3,
  "total_sources": 5,
  "ready_to_run": true,
  "source_summaries": [
    {
      "filename": "warehouse_report.csv",
      "source_type": "csv",
      "auto_generated": false,
      "label": "Uploaded: warehouse_report.csv",
      "word_count": 452,
      "credibility_score": 0.85,
      "detected_category": "pending_classification"
    }
  ],
  "message": "Uploaded 2 source(s). Auto-filled 3 source(s) from store database. Connect WebSocket then POST /api/agent/run-upload."
}
```

### `GET /api/ingest/session/{session_id}`
**Description:** Fetch the metadata of an active upload session before execution.

- **Response (200 OK):**
```json
{
  "source_summaries": [ ... ],
  "auto_filled": 3,
  "status": "ready"
}
```

### `DELETE /api/ingest/session/{session_id}`
**Description:** Cleanly wipe upload session states and temporary files from the server.

---

## 2. Agent Orchestration

These endpoints trigger the autonomous LangGraph state machine. The agent evaluates the enriched temporal signals (resolving **influencer demand spikes** and **pricing drift**) and formulates mitigations under dynamic constraints.

### `POST /api/agent/run`
**Description:** Launches the agent orchestrator for a specific operational scenario. The graph executes asynchronously in the background.

- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "scenario": "supply_chain" // Also supports: "power_grid", "sentiment_crisis"
}
```

**Success Response (200 OK):**
```json
{
  "session_id": "f5e6d7c8-1234-5678-90ab-cdef12345678",
  "status": "started"
}
```

### `GET /api/session/{session_id}`
**Description:** Poll the full serialized state of the execution graph (useful if the WebSocket drops). Contains all raw sources, contradiction resolutions, temporal insights, and the final action plan.

- **Response (200 OK):**
```json
{
  "session_id": "f5e6d7c8...",
  "domain_config": { ... },
  "filtered_sources": [ ... ],
  "insights": {
    "temporal_signals": [
      {
        "signal_type": "inventory_decline",
        "sku": "SKU-003",
        "urgency": "critical",
        "interpretation": "SKU-003: inventory decline detected. Current 35.1 vs baseline 225.0 (-84.4% change, -12.05%/day velocity)"
      }
    ]
  },
  "action_plan": [ ... ],
  "outcome": { ... }
}
```

---

## 3. Real-Time State Streaming

Resolving **sentiment disconnects** requires real-time UI updates. Instead of stale dashboards, use this WebSocket to stream state transitions exactly as the LLM orchestrates them.

### `WebSocket /ws/{session_id}`
**Description:** Subscribes the client to live node-by-node state transitions of the LangGraph execution. Connect to this *before* hitting `/api/agent/run`.

- **Event Example (Transition):**
```json
{
  "type": "transition",
  "node": "analyze",
  "trace": {
    "node": "analyze",
    "event": "temporal_signals_detected",
    "count": 1
  },
  "current_state_summary": {
    "raw_sources_count": 5,
    "filtered_sources_count": 5,
    "contradictions_count": 0,
    "action_plan_count": 0,
    "retry_count": 0,
    "errors_count": 0
  }
}
```

- **Event Example (Complete):**
```json
{
  "type": "complete",
  "metrics": {
    "mitigations_executed": 3,
    "final_severity": "resolved"
  },
  "timestamp": "2026-05-20T22:30:00Z"
}
```

---

## 4. Anomaly Simulation (Demo APIs)

Use these endpoints to manually force the backend into anomalous states for testing real-time reactive capabilities.

### `POST /api/demo/spike/{session_id}`
**Description:** Injects an artificial 6.0x event-rate spike into a live session's real-time feed.

- **Response (200 OK):**
```json
{
  "status": "spike_injected",
  "new_window_count": 120,
  "detector_status": {
    "anomalies_detected": 1,
    "current_rate": 120
  }
}
```

### `GET /api/health`
**Description:** Standard infrastructure health verification.

- **Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-05-20T22:30:00Z"
}
```
