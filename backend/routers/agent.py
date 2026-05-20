"""
routers/agent.py
----------------
Defines real-time WebSockets streaming manager, scenario runners, health checkers,
and API session query handlers for the Autonomous Content-to-Action agent.
"""

import asyncio
from datetime import datetime
import json
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

from agent.graph import agent_graph
from scenarios.supply_chain import get_supply_chain_scenario
from scenarios.power_grid import get_power_grid_scenario
from scenarios.sentiment_crisis import get_sentiment_scenario

router = APIRouter()

# Global session memory store
session_store = {}

# ──────────────────────────────────────────────────────────────────────
# WEBSOCKET CONNECTION MANAGER
# ──────────────────────────────────────────────────────────────────────
class ConnectionManager:
    """Manages active WebSockets connections and broadcasts streaming states."""
    
    def __init__(self):
        # Maps session_id: list of WebSockets for multi-client support
        self.active_connections: dict[str, list[WebSocket]] = {}
        
    async def connect(self, session_id: str, websocket: WebSocket):
        """Accepts and registers an incoming WebSocket connection."""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        
    def disconnect(self, session_id: str, websocket: WebSocket):
        """Deregisters a disconnected WebSocket connection."""
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                
    async def broadcast(self, session_id: str, event_dict: dict):
        """Converts message dict to JSON and broadcasts to all session clients."""
        if session_id in self.active_connections:
            event_json = json.dumps(event_dict, default=str)
            for ws in list(self.active_connections[session_id]):
                try:
                    await ws.send_text(event_json)
                except Exception:
                    self.disconnect(session_id, ws)

manager = ConnectionManager()


# ──────────────────────────────────────────────────────────────────────
# WEBSOCKET ENDPOINT
# ──────────────────────────────────────────────────────────────────────
@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    Subscribes client to real-time operational state transition updates.
    Keeps connection alive until explicit disconnection or termination.
    """
    await manager.connect(session_id, websocket)
    try:
        while True:
            # Maintain active connection keepalive loop
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception:
        manager.disconnect(session_id, websocket)


# ──────────────────────────────────────────────────────────────────────
# BACKGROUND AGENT RUNNER TASK
# ──────────────────────────────────────────────────────────────────────
async def run_agent_background(session_id: str, domain_config: dict):
    """
    Asynchronous runner executing agent nodes incrementally via astream.
    Broadcasts state transition trace data in real-time.
    """
    initial_state = {
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
    
    current_state = initial_state
    session_store[session_id] = current_state
    
    await manager.broadcast(session_id, {
        "type": "status",
        "node": "init",
        "status": "started",
        "timestamp": datetime.now().isoformat()
    })
    
    try:
        # Stream the compiled LangGraph execution node-by-node
        async for event in agent_graph.astream(
            initial_state,
            config={"configurable": {"thread_id": session_id}}
        ):
            # Extract current node name and yielded updates
            node_name = list(event.keys())[0]
            node_output = event[node_name]
            
            # Merge updates into current operational state
            current_state.update(node_output)
            session_store[session_id] = current_state
            
            # Grab last trace entry
            last_trace = None
            if current_state.get("trace"):
                last_trace = current_state["trace"][-1]
                
            # Broadcast transition update
            await manager.broadcast(session_id, {
                "type": "transition",
                "node": node_name,
                "trace": last_trace,
                "current_state_summary": {
                    "raw_sources_count": len(current_state.get("raw_sources", [])),
                    "filtered_sources_count": len(current_state.get("filtered_sources", [])),
                    "contradictions_count": len(current_state.get("contradictions", [])),
                    "action_plan_count": len(current_state.get("action_plan", [])),
                    "retry_count": current_state.get("retry_count", 0),
                    "errors_count": len(current_state.get("errors", []))
                }
            })
            
            # Introduce a mild operational breathing delay for visual transitions
            await asyncio.sleep(0.8)
            
        # Extract outcome metrics
        outcome = current_state.get("outcome")
        outcome_dict = outcome.model_dump() if outcome else {}
        
        # Broadcast final completion parameters
        await manager.broadcast(session_id, {
            "type": "complete",
            "metrics": outcome_dict,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        await manager.broadcast(session_id, {
            "type": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })


# ──────────────────────────────────────────────────────────────────────
# REST ENDPOINTS
# ──────────────────────────────────────────────────────────────────────
class RunRequest(BaseModel):
    scenario: str

@router.post("/api/agent/run")
async def run_agent_endpoint(request: RunRequest):
    """
    Launches an operational scenario monitor.
    Initializes configuration maps and starts agent runner in background.
    """
    scenario_map = {
        "supply_chain": get_supply_chain_scenario,
        "power_grid": get_power_grid_scenario,
        "sentiment_crisis": get_sentiment_scenario
    }
    
    scenario_func = scenario_map.get(request.scenario.lower())
    if not scenario_func:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario name. Supported: {list(scenario_map.keys())}"
        )
        
    # Generate unique operational session
    session_id = str(uuid4())
    domain_config = scenario_func()
    
    # Fire off background agent runner execution task
    asyncio.create_task(run_agent_background(session_id, domain_config))
    
    return {
        "session_id": session_id,
        "status": "started"
    }

@router.get("/api/session/{session_id}")
async def get_session_state(session_id: str):
    """Retrieves the full live or finalized serialised state of a session."""
    if session_id not in session_store:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found."
        )
    return session_store[session_id]

@router.get("/api/health")
async def health_check():
    """Service health verification endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }


# ──────────────────────────────────────────────────────────────────────
# ANOMALY DETECTION DEMO ENDPOINTS
# ──────────────────────────────────────────────────────────────────────
@router.post("/api/demo/spike/{session_id}")
async def trigger_anomaly_spike(session_id: str):
    """
    DEMO: Inject an artificial event-rate spike for a session.
    Triggers anomaly detection on the next ingest cycle.
    """
    from agent.anomaly_detector import get_detector
    detector = get_detector(session_id)
    detector.inject_spike(multiplier=6.0)
    status = detector.get_status()
    return {
        "status": "spike_injected",
        "new_window_count": detector.current_window_count,
        "detector_status": status
    }

@router.get("/api/demo/anomaly-status/{session_id}")
async def get_anomaly_status(session_id: str):
    """Return current anomaly detector status for a session (for mobile polling)."""
    from agent.anomaly_detector import get_detector
    detector = get_detector(session_id)
    return detector.get_status()

