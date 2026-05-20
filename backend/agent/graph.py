"""
agent/graph.py
--------------
LangGraph StateGraph machine definition and orchestrator logic.
Sets up states, entry points, conditional routing, checkpointers, and run interface.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from agent.state import AgentState
from agent.nodes import ingest, analyze, plan, execute_step, evaluate, self_heal, finalize

# ──────────────────────────────────────────────────────────────────────
# INLINE NOISE FILTER WRAPPER
# ──────────────────────────────────────────────────────────────────────
async def ingest_with_noise_filter(state: AgentState) -> AgentState:
    """
    Ingests raw inputs and filters out sources with credibility scores below 0.50
    before transitioning downstream to the analysis phase.
    """
    # Call core ingestion
    state = await ingest(state)
    
    # Filter sources with credibility < 0.50
    state["filtered_sources"] = [
        s for s in state["raw_sources"] 
        if s.credibility_score >= 0.50 and s.status == "active"
    ]
    
    # Trace log update
    state["trace"].append({
        "step": "ingest_noise_filter",
        "status": "complete",
        "filtered_count": len(state["filtered_sources"]),
        "original_count": len(state["raw_sources"])
    })
    
    return state


# ──────────────────────────────────────────────────────────────────────
# GRAPH DEFINITION
# ──────────────────────────────────────────────────────────────────────
graph = StateGraph(AgentState)

# Add all 7 nodes
graph.add_node("ingest", ingest_with_noise_filter)
graph.add_node("analyze", analyze)
graph.add_node("plan", plan)
graph.add_node("execute_step", execute_step)
graph.add_node("evaluate", evaluate)
graph.add_node("self_heal", self_heal)
graph.add_node("finalize", finalize)

# Set entry point
graph.set_entry_point("ingest")

# Define simple sequential edges
graph.add_edge("ingest", "analyze")
graph.add_edge("analyze", "plan")
graph.add_edge("plan", "execute_step")
graph.add_edge("execute_step", "evaluate")
graph.add_edge("self_heal", "execute_step")
graph.add_edge("finalize", END)


# ──────────────────────────────────────────────────────────────────────
# CONDITIONAL ROUTING EDGE
# ──────────────────────────────────────────────────────────────────────
def route_evaluate(state: AgentState) -> str:
    """
    Conditional routing edge function evaluation.
    Determines if graph should repeat execute_step, initiate self_heal, or finalize.
    """
    has_failed = any(a.status == "failed" for a in state.get("action_plan", []))
    pending_actions = [a for a in state.get("action_plan", []) if a.status == "pending"]
    
    constraints_manifest = state.get("domain_config", {}).get("constraints", {})
    max_retries = int(constraints_manifest.get("max_retries", 3))
    retry_count = state.get("retry_count", 0)
    
    if has_failed:
        if retry_count < max_retries:
            return "self_heal"
        else:
            return "finalize"
    elif pending_actions:
        return "execute_step"
    else:
        return "finalize"

# Link conditional evaluation routes
graph.add_conditional_edges(
    "evaluate",
    route_evaluate,
    {
        "self_heal": "self_heal",
        "finalize": "finalize",
        "execute_step": "execute_step"
    }
)


# ──────────────────────────────────────────────────────────────────────
# COMPILE GRAPH WITH CHECKPOINTER
# ──────────────────────────────────────────────────────────────────────
checkpointer = MemorySaver()
agent_graph = graph.compile(checkpointer=checkpointer)


# ──────────────────────────────────────────────────────────────────────
# EXPORTED RUN AGENT FUNCTION
# ──────────────────────────────────────────────────────────────────────
async def run_agent(session_id: str, domain_config: dict) -> AgentState:
    """
    Orchestrator runner that initializes fresh state schemas and invokes the compiled graph.
    Maintains full step-wise persistence using thread-id config parameters.
    """
    initial_state: AgentState = {
        "session_id": session_id,
        "domain_config": domain_config,
        "raw_sources": [],
        "filtered_sources": [],
        "contradictions": [],
        "insights": {},
        "action_plan": [],
        "snapshots": [],
        "outcome": None,
        "retry_count": 0,
        "errors": [],
        "execution_log": [],
        "trace": [],
        "before_state": {},
        "after_state": {}
    }
    
    # Run Compiled StateGraph asynchronously
    final_state = await agent_graph.ainvoke(
        initial_state,
        config={"configurable": {"thread_id": session_id}}
    )
    
    return final_state
