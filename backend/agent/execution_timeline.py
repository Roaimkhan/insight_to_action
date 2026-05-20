from datetime import datetime
from agent.state import Action, StateSnapshot
from typing import Optional
import uuid

class TimelineEntry:
    def __init__(self, action: Action, snapshot_before: StateSnapshot):
        self.entry_id = str(uuid.uuid4())[:8]
        self.action_id = action.action_id
        self.action_type = action.action_type
        self.description = action.description
        self.triggered_by = action.triggered_by
        self.causes_side_effects = action.causes_side_effects
        self.confidence = action.confidence
        self.priority_score = action.priority_score
        self.snapshot_id_before = snapshot_before.snapshot_id
        self.started_at = datetime.utcnow().isoformat()
        self.completed_at: Optional[str] = None
        self.status: str = "running"
        self.result: Optional[dict] = None
        self.latency_ms: Optional[int] = None
        self.caused_next_action: Optional[str] = None
        self.state_delta: dict = {}

    def complete(self, result: dict, latency_ms: int, state_before: dict, state_after: dict):
        self.completed_at = datetime.utcnow().isoformat()
        self.status = "success"
        self.result = result
        self.latency_ms = latency_ms
        self.state_delta = compute_state_delta(state_before, state_after)

    def fail(self, error: str, latency_ms: int):
        self.completed_at = datetime.utcnow().isoformat()
        self.status = "failed"
        self.result = {"error": error}
        self.latency_ms = latency_ms

    def to_ws_event(self) -> dict:
        """Format for WebSocket broadcast to mobile."""
        return {
            "type": "step_complete",
            "entry_id": self.entry_id,
            "action_id": self.action_id,
            "description": self.description,
            "status": self.status,
            "triggered_by": self.triggered_by,
            "causes_side_effects": self.causes_side_effects,
            "caused_next_action": self.caused_next_action,
            "confidence": self.confidence,
            "priority_score": self.priority_score,
            "latency_ms": self.latency_ms,
            "state_delta": self.state_delta,
            "result_summary": str(self.result)[:200] if self.result else None
        }

def compute_state_delta(before: dict, after: dict) -> dict:
    """
    Compute what changed between two state snapshots.
    Returns dict of {key: {before: val, after: val}} for changed keys only.
    Only checks top-level numeric/string values for simplicity.
    """
    delta = {}
    all_keys = set(before.keys()) | set(after.keys())
    for key in all_keys:
        v_before = before.get(key)
        v_after = after.get(key)
        if v_before != v_after:
            if isinstance(v_before, (int, float, str)) or isinstance(v_after, (int, float, str)):
                delta[key] = {"before": v_before, "after": v_after}
    return delta

def link_causal_chain(timeline: list[TimelineEntry]) -> list[TimelineEntry]:
    """
    For each entry, if a side effect action_id matches the next entry's action_id,
    set caused_next_action to show the causal link.
    """
    for i, entry in enumerate(timeline):
        if i + 1 < len(timeline):
            next_entry = timeline[i + 1]
            if next_entry.action_id in entry.causes_side_effects:
                entry.caused_next_action = next_entry.action_id
            else:
                entry.caused_next_action = next_entry.action_id  # sequential causal link
    return timeline
