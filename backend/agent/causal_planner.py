from agent.state import Action, AgentState
from agent.llm_client import call_llm_structured, PlanResult

def compute_priority_score(confidence: float, urgency: float, impact: float) -> float:
    """
    Priority = weighted combination.
    Urgency weighted highest — time-sensitive actions rank first.
    """
    return round(
        (confidence * 0.30) + 
        (urgency * 0.45) + 
        (impact * 0.25), 
        3
    )

def validate_causal_chain(actions: list[Action]) -> list[Action]:
    """
    Ensure actions are ordered by priority_score descending.
    Detect side effects: if action A modifies a resource that action B depends on,
    mark A.causes_side_effects = [B.action_id].
    Simple heuristic: actions of same action_type that share parameter keys 
    likely affect each other.
    """
    # Sort by priority descending
    actions.sort(key=lambda a: a.priority_score, reverse=True)
    
    # Detect side effects (same action_type + overlapping parameter keys)
    for i, a in enumerate(actions):
        for j, b in enumerate(actions):
            if i == j:
                continue
            if a.action_type == b.action_type:
                shared_params = set(a.parameters.keys()) & set(b.parameters.keys())
                if shared_params:
                    if b.action_id not in a.causes_side_effects:
                        a.causes_side_effects.append(b.action_id)
    
    return actions

def validate_constraints(actions: list[Action], constraints: dict) -> list[Action]:
    """
    Check each action against domain constraints.
    Modify if possible, reject if not fixable.
    Log the decision with reason in action.reasoning.
    """
    budget = constraints.get("max_budget_pkr", constraints.get("emergency_restock_budget_pkr", float("inf")))
    deadline_min = constraints.get("notification_deadline_min", float("inf"))
    
    for action in actions:
        original_reasoning = action.reasoning
        
        if action.action_type == "simulate_procurement_order":
            qty = action.parameters.get("quantity", 0)
            unit_cost = 1500  # PKR
            total_cost = qty * unit_cost
            
            if total_cost > budget:
                # Modify: reduce quantity to fit budget
                max_qty = int(budget / unit_cost)
                if max_qty > 0:
                    action.parameters["quantity"] = max_qty
                    action.status = "modified"
                    action.reasoning = (
                        f"MODIFIED: Original quantity {qty} would cost PKR {total_cost:,} "
                        f"exceeding budget PKR {budget:,}. "
                        f"Reduced to {max_qty} units (PKR {max_qty*unit_cost:,}). "
                        + original_reasoning
                    )
                else:
                    action.status = "rejected"
                    action.reasoning = (
                        f"REJECTED: Minimum viable order exceeds budget PKR {budget:,}. "
                        + original_reasoning
                    )
        
        if action.action_type == "notify_stakeholder":
            # If deadline is already expired (< 0), reject the action completely
            if deadline_min < 0:
                action.status = "rejected"
                action.reasoning = (
                    f"REJECTED: Notification deadline expired ({deadline_min} min). "
                    + original_reasoning
                )
            elif action.confidence < 0.4:
                action.status = "modified"
                action.parameters["priority"] = "low"
                action.reasoning = (
                    f"MODIFIED: Low confidence ({action.confidence:.2f}) — "
                    f"downgraded to low priority notification. "
                    + original_reasoning
                )
    
    return actions

def build_causal_summary(actions: list[Action]) -> str:
    """
    Build a human-readable causal chain summary for the demo.
    Each action shows: what triggered it, what it does, what happens if skipped.
    """
    lines = []
    for i, action in enumerate(actions, 1):
        lines.append(
            f"A{i}: {action.description} "
            f"[confidence={action.confidence:.0%}, priority={action.priority_score:.2f}]"
        )
        if action.triggered_by:
            lines.append(f"     ↳ Triggered by insight: '{action.triggered_by}'")
        if action.causes_side_effects:
            lines.append(f"     ↳ Affects: {', '.join(action.causes_side_effects)}")
        if action.what_if_skipped:
            lines.append(f"     ↳ If skipped: {action.what_if_skipped}")
    return "\n".join(lines)
