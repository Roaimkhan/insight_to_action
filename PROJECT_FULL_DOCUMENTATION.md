# SupplyAI — Project Full Documentation

Version: 1.0.0
Last updated: 2026-05-21

Overview
--------

This document is a comprehensive, professional, and actionable reference for the SupplyAI "Insight to Action" project. It covers the repository structure, architecture, setup and run instructions, component and animation systems, backend notes, testing and verification procedures, deployment steps, design system, developer guidelines, and a prioritized roadmap for future improvements.

Use this file as the single source-of-truth for onboarding engineers, designers, QA, and DevOps teams.

Repository root
----------------

Top-level structure (paths are workspace-relative):

- `insight_to_action/`
  - `API_DOCS.md`
  - `FRONTEND_HANDOFF.md`
  - `HOW_TO_RUN.md`
  - `MASTER_CONTEXT_BRIEF.md`
  - `README.md`
  - `package.json`
  - `backend/` — Python async agent, ingestion, routers, agent engine
  - `frontend/` — React + TypeScript + Vite frontend app
  - `mobile/` — React Native / Expo mobile app

This documentation focuses on explaining every component and the practical steps necessary to run, maintain, and extend the project.

Goals and Scope
---------------

Primary goal: Provide an autonomous content-to-action platform enabling ingestion of heterogeneous sources (PDF, CSV, web, real-time feeds), semantic analysis, contradiction detection, and automated action chain generation and execution.

This documentation covers:
- Project architecture and data flow
- Setup, local development, and production build steps
- Detailed frontend architecture, components, styling, and animation system
- Mobile project layout and animation strategy
- Backend overview and known caveats (external dependencies)
- Testing, CI, and deployment notes
- Developer conventions and recommendations
- Troubleshooting guide and frequently encountered issues

Architecture Overview
---------------------

High-level architecture (three layers):

1. Frontend (React + Vite)
   - Presents dashboards, agent UI, upload flows and metrics
   - Uses `framer-motion` for web animations
   - Uses `zustand` for client state management

2. Backend (Python async services)
   - Data ingestion pipelines (CSV, PDF, web parser, realtime feed)
   - Semantic analysis & agent reasoning pipeline
   - Routers expose REST endpoints for upload/ingestion and agent control

3. Mobile (React Native + Expo)
   - Provides a subset of functionality for mobile operators
   - Uses `react-native-reanimated` for gesture and animation handling

Data flow
---------

1. User uploads files or selects a scenario in the frontend.
2. Frontend hits ingestion API endpoints under `backend/routers/ingest.py`.
3. Backend ingestion pipeline parses files (CSV, PDF, table, web) and normalizes documents to a canonical internal representation.
4. Documents are processed by the agent (semantic analyzer, source classifier) and signals are extracted.
5. The agent executes the causal planner + execution timeline to generate an action chain.
6. Frontend displays results in `Agent` page and `Metrics` with animated gauges and action stepper.

Repository Contents — Detailed
-----------------------------

Note: When mentioning files below, refer to the workspace paths present in this repository.

1) `frontend/` — Web application

- `frontend/package.json` — Frontend npm scripts and dependencies.
- `frontend/vite.config.ts` — Vite build configuration.
- `frontend/tsconfig.json` — TypeScript config used by the frontend.
- `frontend/src/` — Primary source folder
  - `src/App.tsx`, `src/main.tsx` — App entry, router and providers
  - `src/pages/` — Pages: `Home`, `Agent`, `Comparison`, `Metrics`, `Login`
  - `src/components/` — Reusable components (Card, Badge, MetricGauge, TerminalBlock, ActionStepper, SourceCard, Modal etc.)
  - `src/constants/` — `colors.ts`, `typography.ts`, `spacing.ts`, `animation.ts`
  - `src/services/mockStream.ts` — Mock stream for local testing of agent token streaming
  - `src/store/agentStore.ts` — Zustand store for agent state
  - `src/index.css` — Global CSS variables and glassmorphism tokens

Important frontend files to review:
- `frontend/src/constants/animation.ts` — central source-of-truth for all animation variants used across the app. Contains variants for page entrance, button hover, input focus, background glows, spinner, gauge needle and many others.
- `frontend/src/components/MetricGauge/MetricGauge.tsx` — animated gauge component using SVG plus Framer Motion + useSpring utilities.
- `frontend/src/components/Card/Card.tsx` — glass card with spotlight border and hover animation.

2) `mobile/` — Mobile application (Expo)

- `mobile/app.json`, `mobile/package.json` — Expo config and dependencies
- `mobile/tsconfig.json` — Mobile TypeScript config
- `mobile/src/app/` — App entry points and router
- `mobile/src/components/` — Mobile components, many mirror the web components but implemented with React Native API and `react-native-reanimated`

3) `backend/` — Python services

- `backend/main.py` — Backend application entry
- `backend/agent/` — Agent modules: `anomaly_detector.py`, `causal_planner.py`, `constraint_builder.py`, `context_enricher.py`, `execution_timeline.py`, `graph.py`, `llm_client.py`, `nodes.py`, `prompts.py`, `semantic_analyzer.py`, `source_classifier.py`, `state.py`, `temporal_engine.py`, `tools.py`
- `backend/ingestion/` — Parsers: `csv_parser.py`, `pdf_parser.py`, `web_parser.py`, `table_parser.py`, `realtime_feed.py`
- `backend/routers/` — `ingest.py`, `agent.py` — FastAPI/Flask-like route handlers for actions and ingestion
- `backend/database/` — `schema.py`, `queries.py`, `seeder.py`

Important backend notes:
- A missing runtime dependency `langgraph` was detected during the import checks; install required packages listed in `backend/requirements.txt` before running backend services.
- Backend is intentionally left as-is per current instruction; this doc documents the known caveats.

Setup & Run Instructions
------------------------

This section provides step-by-step instructions for setting up the development environment and running the web and mobile apps locally. The backend instructions are included but marked optional since the user requested leaving the backend as-is.

Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- Python 3.10+ (optional for backend)
- Expo CLI (for mobile development)

Frontend — Local Dev

1. Navigate to the frontend directory:

```bash
cd insight_to_action/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the Vite dev server (runs on `http://localhost:5174` by default):

```bash
npm run dev
```

4. TypeScript check (fast):

```bash
npx tsc --noEmit
```

5. Production build:

```bash
npm run build
```

Mobile — Local Dev (Expo)

1. Change to the mobile folder:

```bash
cd insight_to_action/mobile
```

2. Install dependencies:

```bash
npm install
```

3. Start Expo in dev mode:

```bash
npx expo start
```

4. TypeScript check:

```bash
npx tsc --noEmit
```

Backend — Local Dev (optional)

> Note: Backend is intentionally left as-is; install dependencies only if you want to run it.

1. Create and activate a Python venv (Windows example):

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

2. Install requirements:

```powershell
pip install -r backend/requirements.txt
```

3. Run a syntax check:

```bash
python -m py_compile backend/*.py
```

4. Launch the backend (example with uvicorn):

```bash
uvicorn backend.main:app --reload --port 8000
```

If an import error arises for `langgraph` or any other module, install it with `pip install langgraph` or add a fallback import in `backend/agent/graph.py`.

Project Technical Deep Dive
----------------------------

Frontend architecture
^^^^^^^^^^^^^^^^^^^^^

- React + TypeScript app bootstrapped for Vite. Uses functional components and hooks.
- Global state: `zustand` (`frontend/src/store/agentStore.ts`) stores agent status and selections, feeding many pages.
- Routing: React Router (file-based routing via `main.tsx` / `App.tsx`).
- Styling: CSS variables (`src/index.css`) implement the design system tokens (colors, glass surfaces, shadows). Components use utility CSS classes and component-specific `.css` files.
- Animations: Centralized in `src/constants/animation.ts`. All motion configurations are typed and exported as reusable variants for Framer Motion. This avoids duplication and enforces a consistent motion system.

Key front-end components
^^^^^^^^^^^^^^^^^^^^^^^^^

- `Card` — Reusable glass panel providing mouse spotlight, hover lift, status border and status color maps.
- `MetricGauge` — SVG-based circular gauge with a dual-arc track, using `motion.circle` for animated stroke-dashoffset and `useSpring` for smooth value transitions. The display number uses a spring-based count animation.
- `ActionStepper` — Stepper UI for visualizing the action chain with per-step animation and status states.
- `TerminalBlock` — High-fidelity terminal UI rendering agent logs. It includes a canvas-based grid and animation-ready layout.
- `Modal` — New modal wrapper component with backdrop, focus rings, and spring entrance animation.

Animation & Motion System
^^^^^^^^^^^^^^^^^^^^^^^^^

All animations are defined in `frontend/src/constants/animation.ts`. This file contains the entire set of standard variants:

- Entrance & layout: `pageEntranceVariant`, `fadeUpVariant`, `staggerContainer`, `sectionStaggerContainer`
- Micro-interaction: `buttonHoverVariant`, `cardHoverVariant`, `tapRippleVariant`
- Inputs: `inputLabelVariant`, `inputFocusVariant` (floating labels + focus glow)
- Backgrounds: `pulseGlowVariant`, `gradientShiftVariant`, `floatingVariant`
- Loading & success: `spinnerVariant`, `successCheckmarkVariant`, `bounceInVariant`
- Data visuals: `chartBarVariant`, `numberCounterVariant`, `gaugeNeedleVariant`, `dataPointStaggerVariant`
- Overlay & modals: `backdropVariant`, `modalVariant`, `overlaySlideVariant`
- Accessibility: `reducedMotionVariant`, `focusIndicatorVariant`

This design ensures:
- Single source of truth for durations, springs, and easings
- Easy updates to motion language across the app
- Accessibility toggles (reduced motion) are available and should be respected by components

Design System
^^^^^^^^^^^^^

Design tokens live in:
- `frontend/src/constants/colors.ts`
- `frontend/src/constants/typography.ts`
- `frontend/src/constants/spacing.ts`

Key tokens:
- Brand color: `--brand` (#1848C8)
- Glass surfaces: `--glass-1`, `--glass-2`, ... with defined blur levels
- Shadow scale: `--shadow-xs` → `--shadow-xl`
- Animation timing: `fast (150ms)`, `normal (300ms)`, `slow (600ms)`
- Spring physics standard: damping `20`, stiffness `180` (organic feel)

Accessibility
^^^^^^^^^^^^^

- `reducedMotionVariant` exists — components should conditionally disable non-essential motion when `prefers-reduced-motion` is detected (CSS or JS media query).
- All interactive elements have keyboard focus states and additional `focusIndicatorVariant` for animated focus rings.
- Color contrasts were chosen to meet minimum AA contrast ratios for primary text and UI elements (where possible). Please test with end-users and automated contrast tools.

Mobile architecture
^^^^^^^^^^^^^^^^^^^

- Built with Expo + React Native.
- Uses `react-native-reanimated` for gestures and animations; many animation patterns from web are replicated using reanimated primitives (`withSpring`, `withTiming`, shared values) in `mobile/src/components/`.
- Navigation uses file-based routing similar to `expo-router`.

Backend overview (read-only / left as-is)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- The backend provides ingestion endpoints and agent orchestration functions.
- Important backend modules live under `backend/agent/` and `backend/ingestion/`.
- Known issue: missing external dependency `langgraph` detected in `backend/agent/graph.py`. If you plan to run the backend, install dependencies in `backend/requirements.txt`.

Testing & Verification
----------------------

Automated checks to run locally (recommended as part of CI):

Frontend (npm):

```bash
cd insight_to_action/frontend
# TypeScript check
npx tsc --noEmit
# Lint (if configured)
npm run lint
# Run unit tests (if present)
npm test
# Build
npm run build
```

Mobile (expo):

```bash
cd insight_to_action/mobile
npx tsc --noEmit
npx expo start
```

Backend (python, optional):

```bash
cd insight_to_action/backend
python -m py_compile backend/*.py
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

CI Recommendations
^^^^^^^^^^^^^^^^^^
- Run TypeScript checks (`npx tsc --noEmit`) and linting on PRs.
- Run unit tests and integration tests in parallel.
- Run `npm run build` in the build pipeline and fail on warnings or errors (this project uses a zero-warnings policy for production readiness).
- For backend, run `python -m py_compile` and install dependencies before running integration tests.

Performance & Profiling
-----------------------
- Frontend: Vite provides fast HMR in development. Use LightHouse audits to track performance regressions.
- Avoid heavy synchronous operations on the main thread. Offload expensive tasks to web workers if needed for large file parsing on the client.

Deployment
----------
Recommended production deployment for the web app:
1. Build the frontend:

```bash
cd insight_to_action/frontend
npm run build
```

2. Upload `dist/` to a static hosting provider (Netlify, Vercel, S3 + CloudFront).
3. For dynamic backend operations, deploy Python services to a container platform (AWS ECS, Kubernetes) or serverless platform with proper VPC and secret management.

Security Considerations
-----------------------
- Keep secrets out of the repository — use environment variables or secret stores.
- Validate and sanitize all uploaded files on the server side before parsing.
- Use HTTPS and secure cookies for authentication tokens.
- Rate-limit ingestion endpoints to avoid abuse.

Onboarding & Developer Guide
----------------------------
Quick start (web developer):

```bash
# from repo root
cd insight_to_action/frontend
npm install
npm run dev
# Visit http://localhost:5174
```

Code style & PR expectations:
- Follow existing code style in the repository (TypeScript strict mode is enabled).
- Keep changes scoped and create focused PRs per feature.
- Add unit tests and update relevant docs.

Component Guidelines
--------------------
- Use `framer-motion` for all web component-level animations.
- Import variants from `frontend/src/constants/animation.ts`; do not inline animation objects unless necessary.
- Use design tokens from `frontend/src/constants/colors.ts` and `typography.ts`.
- Prefer composition over inheritance for UI components.

Troubleshooting
---------------
Common issues and fixes:
- `npm run dev` fails with ENOENT: ensure you're in `insight_to_action/frontend` and that `package.json` exists.
- TypeScript errors: run `npx tsc --noEmit` and fix the reported issues.
- Backend import error (`langgraph`): install via `pip install langgraph` or add a try/except fallback in `backend/agent/graph.py`.

Examples — Quick debugging commands

```bash
# Frontend TypeScript check
cd insight_to_action/frontend
npx tsc --noEmit

# Frontend build
npm run build

# Mobile TypeScript check
cd ../mobile
npx tsc --noEmit

# Backend syntax test
cd ../backend
python -m py_compile backend/*.py
```

Contributing
------------
- Fork the repo, create a feature branch, write tests, open a PR.
- Tag issues with component areas and animation phases.

Roadmap & Next Steps
--------------------
- PHASE 7-12 extras (if desired) are already implemented in `animation.ts`.
- Improve backend dependency management and CI testing for Python services.
- Add E2E tests for critical flows (login, file upload, scenario run).
- Add performance budgets and monitor via Lighthouse in CI.

Appendix — Important File Map
----------------------------
- Frontend entry: `frontend/src/main.tsx` and `frontend/src/App.tsx`
- Animation constants: `frontend/src/constants/animation.ts`
- Design tokens: `frontend/src/constants/colors.ts`, `typography.ts`, `spacing.ts`
- Metric gauge component: `frontend/src/components/MetricGauge/MetricGauge.tsx`
- Card component: `frontend/src/components/Card/Card.tsx`
- Modal component: `frontend/src/components/Modal/Modal.tsx`
- Mobile entry: `mobile/src/app/index.tsx`
- Backend entry: `backend/main.py`

Contact / Maintainers
---------------------
- Primary author: (project team)
- For urgent backend issues contact the backend owner listed in repository metadata.

---

This document captures the full project surface and the practical steps you need to run, maintain, and extend the product. If you want, I can now:

- Expand specific sections (e.g., full API spec listing every endpoint and payload) — tell me which area to expand.
- Generate a shorter `README.md` or `HOW_TO_RUN.md` derived from this doc for onboarding.
- Create CI YAML configuration for GitHub Actions to automate the checks described above.

Would you like me to expand any sections into more granular sub-documents? 
