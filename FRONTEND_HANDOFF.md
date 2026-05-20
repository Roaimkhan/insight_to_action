# E-Commerce AI Agent Platform — Frontend Integration & Technical Handoff

## 1. Project Overview

**What the system does:**
This is an autonomous, agentic supply chain intelligence platform designed for multi-channel e-commerce. It moves beyond passive dashboards by actively orchestrating data ingestion, temporal analysis, constraint building, and LLM-driven mitigation strategies using LangGraph.

**Main business logic:**
The system ingests unstructured retail signals (PDFs, CSVs, live HTML feeds), automatically classifies them without hardcoded configurations, cross-references these signals against a 90-day SQLite historical baseline, and detects temporal anomalies (e.g., ghost stock, demand spikes, price drift). It then passes this highly enriched context to an AI state machine to dynamically formulate and simulate operational interventions (e.g., slashing budgets, alerting human managers).

**Overall Architecture:**
- **Backend:** FastAPI, Python 3.11+, LangGraph, SQLite3 (WAL mode).
- **Architecture Pattern:** Event-Driven Agentic State Machine.
- **Design Patterns:** Strategy Pattern (Parser routing), Factory (DB connections), State Machine (LangGraph).
- **Database Strategy:** Embedded SQLite optimized with `PRAGMA journal_mode=WAL` for high-concurrency non-blocking reads. Pure SQL CTEs handle heavy statistical computations (z-score, standard deviations) natively.
- **Real-time Systems:** FastAPI WebSockets (`/ws/{session_id}`) broadcast node-by-node execution traces to the frontend UI as the LLM processes data.
- **File Storage:** Temporary local file storage in `/tmp/` during the ingestion phase, which is purged via lifecycle hooks.

---

## 2. High-Level Architecture

### Flow Explanations

- **Request Lifecycle:** HTTP requests hit FastAPI routers -> validate via Pydantic models -> dispatched to background `asyncio` tasks -> response returns immediately while processing continues -> UI listens via WebSocket for trace updates.
- **Service Layer Flow:** Ingestion pipeline parses data -> `SourceClassifier` identifies domain -> `ContextEnricher` runs async thread-pool DB queries to fetch baseline -> `TemporalEngine` analyzes time-series drift -> `DynamicConstraintBuilder` adjusts strict operational rules -> Data passed to LangGraph orchestrator.
- **Database Flow:** Read-heavy. Heavy analytical queries use `asyncio.gather` wrapping `loop.run_in_executor` to prevent blocking the async event loop.
- **Auth Flow:** *Not currently implemented.* The backend runs locally/internally without JWT/Session guardrails.
- **Error Handling:** Graceful state machine degradation. If a tool fails, LangGraph retries up to `max_retries` (dynamically adjusted), then enters a `self_heal` node, and finally transitions to `finalize` with a failed state.

### System Architecture Diagram
```text
[Frontend React App]
       │    ▲
 HTTP  │    │ WebSocket (Real-time tracing)
       ▼    │
[ FastAPI Application Server ]
       │
       ├─► [ Ingestion Pipeline ] ──► (Parsers: PDF, CSV, HTML, TXT)
       │          ▼
       ├─► [ Context Enricher ] ◄──► [ SQLite store.db (WAL) ]
       │          ▼
       ├─► [ Temporal Engine ] (Drift & Z-Score Analysis)
       │          ▼
       ├─► [ Constraint Builder ] (Dynamic operational limits)
       │          ▼
       └─► [ LangGraph Orchestrator ] ◄──► [ Google Gemini LLM API ]
                  (ingest -> analyze -> plan -> execute -> evaluate)
```

---

## 3. Folder & Codebase Structure

### `/backend/routers/` (Controllers)
- **`ingest.py`**: Handles multipart file uploads, parser routing, temp file management, and DB auto-fill fallbacks. Exposes REST endpoints to generate `session_id`.
- **`agent.py`**: Handles the LangGraph initiation (`/run`), the WebSocket connection manager, and the background asynchronous agent loop (`run_agent_background`).

### `/backend/agent/` (Service Layer / State Machine)
- **`graph.py`**: The LangGraph compilation file. Defines nodes, conditional edges, and the orchestrator loop.
- **`nodes.py`**: Individual graph steps (`ingest`, `analyze`, `plan`, `execute_step`, `evaluate`, `self_heal`).
- **`state.py`**: Pydantic/TypedDict schemas representing the immutable `AgentState` passed through the graph.
- **`tools.py`**: The 14 LangChain tools that the LLM invokes to fetch realtime data or simulate actions.
- **`source_classifier.py`**: Heuristic keyword scorer to detect payload domains without hardcoding.
- **`context_enricher.py`**: Orchestrates thread-pooled database queries to append historical baselines.
- **`temporal_engine.py`**: Compares 7-day rolling metrics to 90-day baselines to calculate velocity and drift urgency.
- **`constraint_builder.py`**: Mutates system parameters (e.g., reducing `approval_threshold`) based on temporal signals.

### `/backend/database/` (Data Layer)
- **`schema.py`**: DDL definitions and PRAGMA settings.
- **`seeder.py`**: Deterministic (`random.seed(42)`) generator for 90 days of e-commerce data containing deliberate anomalies.
- **`queries.py`**: Pure SQL logic leveraging complex CTEs for z-score anomaly detection.

### `/backend/ingestion/` (Parsers)
- **`csv_parser.py`, `pdf_parser.py`, `table_parser.py`, `web_parser.py`**: Extract raw text, word counts, and assign initial decaying credibility scores.

---

## 4. API Documentation

### 1. Upload Operational Sources
#### `POST /api/ingest/upload`
**Purpose**: Intakes 1 to 5 data sources, classifies them, auto-fills missing slots from DB anomalies, and initializes a session.
**Auth**: None.
**Headers**: `Content-Type: multipart/form-data`
**Body**:
- `files`: `array[File]` (Required)
**Success Response** (200):
```json
{
  "session_id": "uuid-1234",
  "sources_uploaded": 2,
  "sources_auto_filled": 3,
  "total_sources": 5,
  "ready_to_run": true,
  "source_summaries": [{ "filename": "data.csv", "credibility_score": 0.85 }]
}
```
**Frontend Notes**: Use a `<input type="file" multiple>` restricted to max 5 files. Show a progress bar. Cache the `session_id` in React state.

### 2. Stream Agent State (WebSocket)
#### `WS /ws/{session_id}`
**Purpose**: Streams real-time trace events from the LangGraph execution.
**Frontend Notes**: Establish this connection *immediately* after receiving the `session_id` from upload, *before* triggering the run endpoint. Listen for `{"type": "transition"}` and `{"type": "complete"}`. Store transition logs in an array in global state to render a live "terminal" or timeline view.

### 3. Trigger Agent Orchestration
#### `POST /api/agent/run`
**Purpose**: Starts the background agent graph execution.
**Body Schema**:
- `scenario`: `string` (Required. e.g., "supply_chain")
**Success Response** (200):
```json
{ "session_id": "uuid-1234", "status": "started" }
```
**Frontend Notes**: Do not await completion here. Once 200 OK is received, rely entirely on the WebSocket to update the UI. Provide visual "Thinking..." states.

### 4. Fetch Final State
#### `GET /api/session/{session_id}`
**Purpose**: Retrieve the full, final serialized agent state graph.
**Frontend Notes**: Call this if the WebSocket sends a `{"type": "complete"}` message or if the client disconnects and needs to hydrate the dashboard with the final mitigation plans.

---

## 5. Authentication & Authorization

**Current Implementation**: NO AUTHENTICATION.
The platform is designed as an internal tool/prototype running on trusted local networks.

**Frontend Instructions for AI Generator**:
- DO NOT build complex JWT refresh interceptors or Login/Signup pages unless specifically requested by the user later.
- If a mock user is needed for UI purposes, hardcode a dummy context provider (e.g., `UserContext` yielding `{ name: "Admin", role: "superadmin" }`).
- Assume all `/api/` endpoints are unprotected and do not require `Authorization` headers.

---

## 6. Database Documentation

The embedded SQLite database (`store.db`) acts as the "historical reality" of the e-commerce company.

### Tables
1. **`order_history`**: (4200+ rows) Tracks order velocity, status, and pricing.
   - Indexes on `sku`, `order_timestamp`.
   - Used to detect demand spikes and abnormal return rates.
2. **`inventory_log`**: Daily snapshots of stock capacity.
   - Crucial fields: `units_available`, `last_physical_count`.
   - Used to identify "Ghost Stock" (when system stock > physical count).
3. **`supplier_records`**: Fulfillment reliability.
   - Crucial fields: `next_scheduled_date`, `last_delivery_date`.
4. **`complaint_log`**: Customer sentiment tracking.
   - Crucial fields: `severity`, `complaint_type`.
5. **`price_history`**: Multi-channel pricing records (Web, App, Daraz).
   - Used to track >10% variance (Price Contradictions).

**Query Patterns**: The backend heavily relies on `asyncio.gather` to run synchronous SQLite queries inside thread pools. Frontend components do not query these tables directly; they only view the aggregated `insights` returned by the agent state.

---

## 7. Frontend Integration Guide

### Recommended Frontend Architecture
- **Framework**: Next.js 14+ (App Router) or Vite + React 18.
- **Styling**: TailwindCSS with `framer-motion` for complex timeline animations.
- **State Management**: `zustand` for global session state.
- **Data Fetching**: `React Query` (TanStack) for REST endpoints; native `WebSocket` API with a custom hook (`useAgentSocket`) for streaming.

### Suggested Component Hierarchy
- `DashboardLayout` (Main container)
  - `UploadZone` (Drag-and-drop file uploader → calls `POST /api/ingest/upload`)
  - `AgentTerminal` (Animated terminal displaying WebSocket `trace` events in real-time)
  - `InsightGrid` (Cards displaying `temporal_signals` and `contradictions`)
  - `MitigationPlan` (Interactive table showing the LLM's final `action_plan`)

### Optimistic Updates & Loading
- The primary UX hurdle is the 10–30 second delay while the LLM orchestrates.
- **Strategy**: Mask the latency by rendering a rich, animated timeline using the WebSocket trace events. Every time a new node (e.g., `ContextEnricher`) finishes, light up a node in an SVG graph diagram on the UI.

---

## 8. Real User Workflow (Simulation)

**Step 1: The Crisis**
- User drags a "Q3 Warehouse Report.csv" into the `UploadZone`.
- **API**: `POST /api/ingest/upload` fires.
- **Backend**: Parses CSV, identifies SKU-003, realizes it's missing 4 sources, auto-generates price and supplier reports to fill the context. Returns `session_id`.

**Step 2: Connection**
- Frontend immediately connects to `ws://localhost:8000/ws/{session_id}`.
- Frontend calls `POST /api/agent/run` with scenario `"supply_chain"`.

**Step 3: Orchestration (Live UI Update)**
- WebSocket emits `{"node": "ingest", "status": "enrichment_complete"}`. UI lights up the "Data Ingested" step.
- WebSocket emits `{"node": "analyze", "event": "temporal_signals_detected"}`. UI reveals a warning card: "Ghost Stock Detected on SKU-003".

**Step 4: Resolution**
- WebSocket emits `{"type": "complete"}`.
- Frontend calls `GET /api/session/{session_id}` to hydrate the final state.
- UI renders the Mitigation Plan: "Reduced Restock Deadline to 3 Days. Authorized 500K PKR emergency budget."

---

## 9. Error Handling

**Global Errors**: Handled by FastAPI `HTTPException`. Frontend should catch 400/500 errors and display toast notifications.
**Agent Failures**: If the LLM hallucinates or a tool fails, the WebSocket will emit a trace event in the `self_heal` node. The frontend should visualize this as the agent "correcting itself" (a great UX moment showing autonomous resilience).
**Timeouts**: If the WebSocket dies or no messages arrive for 45 seconds, the frontend should fall back to polling `GET /api/session/{session_id}` to see if the run completed silently.

---

## 10. Environment Variables & Deployment

- `GEMINI_API_KEY`: Required. Drives the LangGraph orchestrator.
- `PORT`: (Optional) Defaults to 8000.
- `FRONTEND_URL`: For CORS configuration in production.

**Local Setup**:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 11. Security Review

- **CORS**: Currently unrestricted for local development. In production, configure FastAPI CORSMiddleware to only allow the Next.js domain.
- **Input Sanitization**: Pydantic handles basic type enforcement. The LLM `ANALYZE_PROMPT` is strictly formatted to prevent prompt injection from malicious uploaded text, but raw text should still be sanitized before rendering on the DOM to prevent XSS.
- **Rate Limiting**: Not implemented.

---

## 12. Frontend AI Handoff Section (CRITICAL)

**Dear Claude / AI Frontend Generator:**

You are building the UI for an Autonomous Agentic E-Commerce Platform. You do not need to build complex backends or databases; your job is to build a beautiful, reactive, dark-mode dashboard that consumes the APIs listed above.

### ALL Pages Needed:
1. `/` (Landing / Upload Interface)
2. `/session/[id]` (Live Agent Orchestration Dashboard)

### ALL Components Needed:
1. `DragDropUploader`: Handles 1-5 files, hits `/api/ingest/upload`.
2. `LiveTerminal`: A stylized console window rendering WebSocket text streams.
3. `ArchitectureGraph`: An interactive DAG diagram highlighting the current active node (`ingest` -> `analyze` -> `plan` -> `execute`).
4. `InsightsWidget`: Renders `temporal_signals` (e.g., Ghost Stock alerts) dynamically.
5. `ActionPlanTable`: Renders the `action_plan` array (status, tool used, outcome).

### Frontend Build Order:
1. Scaffold Next.js + Tailwind + Lucide Icons + Framer Motion.
2. Build global Zustand store `useAgentStore` holding `session_id`, `traceLogs[]`, `finalState`.
3. Build the `DragDropUploader` and wire it to `/api/ingest/upload`.
4. Build the `useAgentSocket` hook to establish the WebSocket connection and push events into `traceLogs[]`.
5. Build the `/session/[id]` UI layout (Terminal on left, Visual Graph on right).
6. Implement the `ActionPlanTable` for the final state hydration.

### Technical Constraints:
- **No Auth**: Skip login screens entirely.
- **Dark Mode Default**: This is a premium intelligence tool; use slate/zinc dark themes with vibrant accents (emerald for success, rose for anomalies).
- **Socket Resilience**: Always include a `useEffect` cleanup to close the WebSocket when unmounting.
- **Loading States**: Use glowing skeleton loaders while waiting for the LLM to complete its reasoning loop. Avoid static spinners; use progressive loading bars based on graph nodes.
