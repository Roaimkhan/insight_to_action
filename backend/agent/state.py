"""
agent/state.py
--------------
All data models and the central AgentState TypedDict for the
Autonomous Content-to-Action Agent.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal, Optional, TypedDict

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
# 1. DataSource
# ─────────────────────────────────────────────

class DataSource(BaseModel):
    """Represents one ingested input source after parsing."""

    source_id: str
    source_type: Literal["pdf", "web", "csv", "table", "realtime"]
    raw_text: str
    structured_data: Optional[dict] = None
    credibility_score: Annotated[float, Field(ge=0.0, le=1.0)]
    ingested_at: datetime
    freshness: Literal["fresh", "stale", "expired"]
    domain_hints: list[str]
    status: Literal["active", "disputed", "stale"] = "active"


# ─────────────────────────────────────────────
# 2. Contradiction
# ─────────────────────────────────────────────

class Contradiction(BaseModel):
    """A detected conflict between two data sources on a shared metric."""

    source_a_id: str
    source_b_id: str
    metric: str                  # e.g. "stock_level", "zone_status"
    conflict_score: float        # 0.0–1.0; higher = more contradictory
    resolution: str              # human-readable resolution rationale
    disputed_source_id: str      # the source marked as less credible / stale


# ─────────────────────────────────────────────
# 3. Action
# ─────────────────────────────────────────────

class Action(BaseModel):
    """One step in the agent's generated action chain."""

    action_id: str
    action_type: str             # e.g. "notify_stakeholder", "simulate_order"
    description: str
    parameters: dict             # tool call arguments
    constraints: dict            # budget, rate_limit, timeout, etc.
    status: Literal["pending","success","failed","modified","rejected","rolled_back"] = "pending"
    fallback_action: Optional[dict] = None
    result: Optional[dict] = None
    latency_ms: Optional[int] = None
    
    # Causal chain fields — NEW
    triggered_by: Optional[str] = None     # insight title that caused this action
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    urgency: float = Field(default=0.5, ge=0.0, le=1.0)
    impact: float = Field(default=0.5, ge=0.0, le=1.0)
    priority_score: float = Field(default=0.0, ge=0.0, le=1.0)
    reasoning: str = ""
    
    # Execution tracking — NEW
    causes_side_effects: list[str] = Field(default_factory=list)    # action_ids affected by this action
    what_if_skipped: str = ""              # consequence if this action is not taken



# ─────────────────────────────────────────────
# 4. StateSnapshot
# ─────────────────────────────────────────────

class StateSnapshot(BaseModel):
    """A point-in-time capture of the system state, used for rollback."""

    snapshot_id: str
    timestamp: datetime
    state_data: dict             # serialised key metrics at this moment


# ─────────────────────────────────────────────
# 5. ImpactMetrics
# ─────────────────────────────────────────────

class ImpactMetrics(BaseModel):
    """Aggregated outcome metrics computed after the action chain completes."""

    actions_completed: int
    actions_failed: int
    actions_rolled_back: int
    total_latency_ms: int
    cost_usd: float
    risk_delta: str              # e.g. "HIGH → LOW", "87 → 23"
    before_state: dict
    after_state: dict
    timeline: list[dict] = Field(default_factory=list)         # per-action WS events
    causal_chain_summary: list[dict] = Field(default_factory=list)  # step-by-step causal trace


# ─────────────────────────────────────────────
# 6. AgentState  (LangGraph TypedDict)
# ─────────────────────────────────────────────

class AgentState(TypedDict):
    """
    Central state object passed between every LangGraph node.
    All fields are optional at initialisation; nodes populate them
    progressively as the graph executes.
    """

    # ── Session ──────────────────────────────
    session_id: str
    domain_config: dict          # scenario metadata / user-supplied config

    # ── Ingestion ────────────────────────────
    raw_sources: list[DataSource]       # all ingested sources, unfiltered
    filtered_sources: list[DataSource]  # after noise / staleness filtering

    # ── Analysis ─────────────────────────────
    contradictions: list[Contradiction]
    insights: dict               # {insight_type: [str, ...], risk_level: float, ...}

    # ── Planning ─────────────────────────────
    action_plan: list[Action]    # ordered, constraint-validated action chain

    # ── Execution ────────────────────────────
    execution_log: list[dict]    # one entry per step: action_id, result, latency_ms
    snapshots: list[StateSnapshot]

    # ── Outcome ──────────────────────────────
    outcome: Optional[ImpactMetrics]

    # ── Recovery & Meta ──────────────────────
    errors: list[str]
    retry_count: int
    trace: list[dict]            # full agent reasoning trace for audit export

    # ── Before / After ───────────────────────
    before_state: dict           # captured just before first execution step
    after_state: dict            # updated after each step; final = outcome
