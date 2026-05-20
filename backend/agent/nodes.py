"""
agent/nodes.py
--------------
Implementation of the 7 LangGraph async node functions:
ingest, analyze, plan, execute_step, evaluate, self_heal, and finalize.
"""

import asyncio
import json
import re
import time
from datetime import datetime
from uuid import uuid4
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from agent.state import AgentState, DataSource, Action, Contradiction, StateSnapshot, ImpactMetrics
from agent.prompts import SYSTEM_PROMPT, ANALYZE_PROMPT, PLAN_PROMPT, SELF_HEAL_PROMPT
from agent.tools import (
    fetch_pdf_content, fetch_web_article, fetch_csv_json, fetch_table_dashboard, fetch_realtime_feed,
    detect_contradiction, score_source_credibility, extract_temporal_signals, filter_noise,
    notify_stakeholder, update_system_record, simulate_procurement_order, schedule_monitoring, escalate_issue
)

# Load environment configurations
load_dotenv()

# Prevent validation error on ChatGoogleGenerativeAI import/creation if key is missing
import os
if "GOOGLE_API_KEY" not in os.environ and "GEMINI_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = "mock_key"

# Initialize Gemini 2.5 Flash operational model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-preview-05-20",
    temperature=0
)

async def resilient_llm_invoke(messages, is_planning=False, is_self_heal=False, domain="supply_chain", action_type=""):
    """
    Gracefully invokes ChatGoogleGenerativeAI.
    If the API key is invalid/missing or the API is unreachable, provides a high-fidelity
    offline simulated operational responder to ensure end-to-end execution.
    """
    try:
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key or api_key == "mock_key":
            raise ValueError("No active Gemini API Key configured in env.")
            
        if not is_planning and not is_self_heal:
            llm_with_tools = llm.bind_tools([
                detect_contradiction, score_source_credibility, extract_temporal_signals, filter_noise
            ])
            return await llm_with_tools.ainvoke(messages)
        else:
            return await llm.ainvoke(messages)
    except Exception as e:
        # Create an AIMessage shape
        class MockAIMessage:
            def __init__(self, content, tool_calls=None):
                self.content = content
                self.tool_calls = tool_calls or []
                
        if is_self_heal:
            mock_content = json.dumps({
                "decision": "retry",
                "modified_parameters": {},
                "reason": f"Transient connection lapse during execution of {action_type}. Triggering system self-heal retry."
            })
            return MockAIMessage(mock_content)
            
        elif is_planning:
            if domain == "power_grid":
                mock_content = json.dumps({
                    "action_chain": [
                        {
                            "action_id": "ACT-01",
                            "action_type": "notify_stakeholder",
                            "description": "Alert cantt grid operators of tripped F-47 feeder.",
                            "parameters": {"channel": "slack", "message": "Tripped feeder F-47 exceeded 6.2 hours.", "priority": "critical"},
                            "constraints": {},
                            "fallback_action": {"action_type": "escalate_issue", "parameters": {"severity": "critical", "assignee": "chief_engineer", "context": "Grid notification failed."}}
                        }
                    ]
                })
            elif domain == "sentiment_crisis":
                mock_content = json.dumps({
                    "action_chain": [
                        {
                            "action_id": "ACT-01",
                            "action_type": "notify_stakeholder",
                            "description": "Inform customer success team of checkout reviews drop.",
                            "parameters": {"channel": "email", "message": "High negative reviews checkout crash.", "priority": "high"},
                            "constraints": {},
                            "fallback_action": {"action_type": "escalate_issue", "parameters": {"severity": "high", "assignee": "success_lead", "context": "Success alert failed."}}
                        }
                    ]
                })
            else: # supply_chain
                mock_content = json.dumps({
                    "action_chain": [
                        {
                            "action_id": "ACT-01",
                            "action_type": "simulate_procurement_order",
                            "description": "Emergency procurement order of 150 units of Heavy Duty Bearings from Local Bearing World.",
                            "parameters": {"item": "Heavy Duty Bearings", "quantity": 150, "budget_pkr": 300000.0, "eta_hours": 12.0},
                            "constraints": {"budget_pkr": 500000.0},
                            "fallback_action": {"action_type": "escalate_issue", "parameters": {"severity": "critical", "assignee": "supply_chain_head", "context": "Emergency bearing procurement order failed."}}
                        },
                        {
                            "action_id": "ACT-02",
                            "action_type": "notify_stakeholder",
                            "description": "Alert supply chain department of valves labor halt delay.",
                            "parameters": {"channel": "email", "message": "Valves supplier halted. Delaying deliveries.", "priority": "high"},
                            "constraints": {},
                            "fallback_action": {"action_type": "escalate_issue", "parameters": {"severity": "high", "assignee": "ops_director", "context": "Notification failed."}}
                        },
                        {
                            "action_id": "ACT-03",
                            "action_type": "update_system_record",
                            "description": "Record valve delays status in global system record.",
                            "parameters": {"system_id": "SYS-DASH-992", "payload_json": "{\"valve_status\":\"delayed\"}"},
                            "constraints": {},
                            "fallback_action": {"action_type": "schedule_monitoring", "parameters": {"target": "SYS-DASH-992", "interval_minutes": 10}}
                        }
                    ]
                })
            return MockAIMessage(mock_content)
            
        else:
            # Turn based multi-turn analysis tool caller simulation
            has_tool_call = False
            for m in messages:
                if hasattr(m, "tool_calls") and m.tool_calls:
                    has_tool_call = True
                elif isinstance(m, dict) and m.get("role") == "tool":
                    has_tool_call = True
                    
            if not has_tool_call:
                # Turn 1: trigger detect_contradiction tool call
                tool_calls = [{
                    "id": f"call-{uuid4().hex[:4]}",
                    "name": "detect_contradiction",
                    "args": {
                        "source_a_json": json.dumps({"source_id": "SRC-REALTIME", "raw_text": "complaint count has reached 120 per hour due to bearing checkout crashes"}),
                        "source_b_json": json.dumps({"source_id": "SRC-CSV", "raw_text": "complaint count is 10 per hour based on last week's CSV summary"})
                    }
                }]
                return MockAIMessage("", tool_calls=tool_calls)
            else:
                # Turn 2: return final analysis JSON matching domain
                if domain == "power_grid":
                    mock_content = json.dumps({
                        "insights": [{"insight_id": "INS-01", "summary": "Feeder F-47 tripped outage.", "supporting_sources": ["SRC-CSV"], "severity": "critical"}],
                        "risks": [], "opportunities": [], "contradictions": [], "urgency_score": 9, "domain_detected": "power_grid"
                    })
                elif domain == "sentiment_crisis":
                    mock_content = json.dumps({
                        "insights": [{"insight_id": "INS-01", "summary": "Checkout crash complaints spike.", "supporting_sources": ["SRC-CSV"], "severity": "critical"}],
                        "risks": [], "opportunities": [], "contradictions": [], "urgency_score": 9, "domain_detected": "sentiment_crisis"
                    })
                else: # supply_chain
                    mock_content = json.dumps({
                        "insights": [
                            {"insight_id": "INS-01", "summary": "Valve inventory levels are depleted.", "supporting_sources": ["SRC-CSV"], "severity": "critical"},
                            {"insight_id": "INS-02", "summary": "Valves & Actuators Ltd halted operations.", "supporting_sources": ["SRC-TABLE"], "severity": "high"},
                            {"insight_id": "INS-03", "summary": "Customer complaint rates are rising.", "supporting_sources": ["SRC-REALTIME"], "severity": "medium"},
                            {"insight_id": "INS-04", "summary": "Port congestion delaying web updates.", "supporting_sources": ["SRC-WEB"], "severity": "medium"},
                            {"insight_id": "INS-05", "summary": "Friction brake pads are below operating thresholds.", "supporting_sources": ["SRC-CSV"], "severity": "medium"}
                        ],
                        "risks": [{"description": "Stockout of compressor valves.", "impact": "Production shutdown penalties.", "source_ids": ["SRC-CSV"]}],
                        "opportunities": [{"description": "Replenish bearings.", "value_add": "Prevent impending stockout.", "source_ids": ["SRC-CSV"]}],
                        "contradictions": [
                            {
                                "metric": "complaint_count",
                                "source_a_id": "SRC-REALTIME",
                                "source_b_id": "SRC-CSV",
                                "conflict_score": 0.85,
                                "resolution": "Prioritized live customer complaints over stale weekly CSV reports.",
                                "disputed_source_id": "SRC-CSV",
                                "investigation_path": ["Check active CRM backlog logs."]
                            }
                        ],
                        "urgency_score": 9,
                        "domain_detected": "supply_chain"
                    })
                return MockAIMessage(mock_content)


# ──────────────────────────────────────────────────────────────────────
# NODE 1 — ingest
# ──────────────────────────────────────────────────────────────────────
async def ingest(state: AgentState) -> AgentState:
    """
    Ingests all heterogeneous sources in parallel using asyncio.gather.
    Auto-detects format from config paths/URLs, parses, and populates data bus.
    """
    sources_config = state.get("domain_config", {}).get("sources", {})
    tasks = []
    source_types = []
    
    # Check pdf path
    if "pdf" in sources_config:
        tasks.append(fetch_pdf_content.ainvoke(sources_config["pdf"]))
        source_types.append("pdf")
    # Check web url
    if "web" in sources_config:
        tasks.append(fetch_web_article.ainvoke(sources_config["web"]))
        source_types.append("web")
    # Check csv path
    if "csv" in sources_config:
        tasks.append(fetch_csv_json.ainvoke(sources_config["csv"]))
        source_types.append("csv")
    # Check table html or url
    if "table" in sources_config:
        tasks.append(fetch_table_dashboard.ainvoke(sources_config["table"]))
        source_types.append("table")
    # Check realtime scenario
    if "realtime" in sources_config:
        tasks.append(fetch_realtime_feed.ainvoke(sources_config["realtime"]))
        source_types.append("realtime")
        
    # Execute in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    data_sources = []
    now_dt = datetime.now()
    
    for idx, res_str in enumerate(results):
        source_type = source_types[idx]
        source_id = f"SRC-{source_type.upper()}"
        
        # Handle exceptions gracefully
        if isinstance(res_str, Exception):
            data_sources.append(DataSource(
                source_id=source_id,
                source_type=source_type,
                raw_text=f"Ingestion failed with error: {str(res_str)}",
                credibility_score=0.0,
                ingested_at=now_dt,
                freshness="expired",
                domain_hints=[state.get("domain_config", {}).get("domain", "generic")],
                status="stale"
            ))
            continue
            
        try:
            res_dict = json.loads(res_str)
        except Exception as e:
            res_dict = {"error": f"Failed to parse tool JSON response: {str(e)}", "raw_text": str(res_str)}
            
        if "error" in res_dict:
            data_sources.append(DataSource(
                source_id=source_id,
                source_type=source_type,
                raw_text=res_dict.get("raw_text", res_dict["error"]),
                credibility_score=0.0,
                ingested_at=now_dt,
                freshness="expired",
                domain_hints=[],
                status="stale"
            ))
        else:
            # Auto-assign freshness based on credibility if missing
            cred = float(res_dict.get("credibility_score", 0.70))
            fresh = res_dict.get("freshness")
            if not fresh:
                fresh = "fresh" if cred >= 0.70 else ("stale" if cred >= 0.50 else "expired")
                
            # Domain hints extraction from text
            text_lower = res_dict.get("raw_text", "").lower()
            hints = []
            if any(k in text_lower for k in ["stock", "warehouse", "delivery", "supplier", "procurement"]):
                hints.append("supply_chain")
            if any(k in text_lower for k in ["feeder", "grid", "outage", "voltage", "blackout", "lesco"]):
                hints.append("power_grid")
            if any(k in text_lower for k in ["sentiment", "review", "complaint", "customer", "terrible"]):
                hints.append("sentiment_crisis")
                
            data_sources.append(DataSource(
                source_id=source_id,
                source_type=source_type,
                raw_text=res_dict.get("raw_text", ""),
                structured_data=res_dict.get("structured_data"),
                credibility_score=cred,
                ingested_at=now_dt,
                freshness=fresh,
                domain_hints=hints,
                status="active"
            ))
            
    state["raw_sources"] = data_sources
    # Exclude stales immediately for noise filtering
    state["filtered_sources"] = [s for s in data_sources if s.status == "active"]

    # ── DB Enrichment: attach historical context to every source ──────
    from agent.context_enricher import ContextEnricher
    enricher = ContextEnricher()

    enrichment_tasks = [enricher.enrich(src) for src in state["raw_sources"]]
    state["raw_sources"] = list(await asyncio.gather(*enrichment_tasks))

    # Refresh filtered_sources with enriched versions (status unchanged)
    state["filtered_sources"] = [s for s in state["raw_sources"] if s.status == "active"]

    state["trace"].append({
        "node": "ingest",
        "event": "enrichment_complete",
        "sources_enriched": len(state["raw_sources"]),
        "categories_detected": list(set(
            src.structured_data["db_enrichment"]["category"]
            for src in state["raw_sources"]
            if src.structured_data and "db_enrichment" in src.structured_data
        )),
    })
    # ─────────────────────────────────────────────────────────────────

    # Capture before_state snapshot
    source_statuses = {s.source_id: s.status for s in state["filtered_sources"]}
    state["before_state"] = {
        "sources_count": len(state["filtered_sources"]),
        "status": "pre_agent",
        "source_statuses": source_statuses
    }
    
    # --- Anomaly Detector Status ---
    from agent.anomaly_detector import get_detector
    detector = get_detector(state["session_id"])
    anomaly_status = detector.get_status()
    
    state["trace"].append({
        "node": "ingest",
        "event": "anomaly_detector_status",
        "type": "realtime_stats",
        **anomaly_status
    })
    
    # Flag anomaly on realtime sources so analyzer can weight it
    if anomaly_status.get("anomalies_detected", 0) > 0:
        for src in state["raw_sources"]:
            if src.source_type == "realtime":
                src.domain_hints.append("ANOMALY_DETECTED")
                src.credibility_score = min(src.credibility_score + 0.05, 1.0)
    
    state["trace"].append({
        "node": "ingest",
        "status": "complete",
        "source_count": len(state["filtered_sources"]),
        "timestamp": now_dt.isoformat()
    })
    
    return state


# ──────────────────────────────────────────────────────────────────────
# NODE 2 — analyze
# ──────────────────────────────────────────────────────────────────────
async def analyze(state: AgentState) -> AgentState:
    """
    Feeds ingested data bus into Gemini to analyze.
    Invokes contradiction analysis and scoring dynamically in a turn loop.
    """
    # ── Temporal Analysis ─────────────────────────────────────────────
    from agent.temporal_engine import TemporalEngine
    temporal = TemporalEngine()
    temporal_signals = temporal.detect_all_signals(state["filtered_sources"])
    
    if temporal_signals:
        state["insights"]["temporal_signals"] = temporal_signals
        state["trace"].append({
            "node": "analyze",
            "event": "temporal_signals_detected",
            "count": len(temporal_signals),
            "signals": [s["interpretation"] for s in temporal_signals]
        })
    # ─────────────────────────────────────────────────────────────────

    sources_summary = ""
    for s in state["filtered_sources"]:
        sources_summary += (
            f"Source ID: {s.source_id}\n"
            f"Type: {s.source_type}\n"
            f"Credibility Score: {s.credibility_score:.2f}\n"
            f"Ingested At: {s.ingested_at.isoformat()}\n"
            f"Content Summary: {s.raw_text[:250]}...\n"
            f"----------------------------------------\n"
        )
        
    if temporal_signals:
        sources_summary += "\n=== TEMPORAL SIGNALS DETECTED ===\n"
        for sig in temporal_signals:
            sources_summary += f"- {sig['interpretation']} (Urgency: {sig['urgency']})\n"
        sources_summary += "=================================\n\n"

    prompt = ANALYZE_PROMPT.format(
        source_count=len(state["filtered_sources"]),
        sources_summary=sources_summary
    )
    
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if api_key and api_key != "mock_key":
        # Use instructor wrapper for guaranteed validation
        from agent.llm_client import call_llm_structured, AnalysisResult
        try:
            result: AnalysisResult = call_llm_structured(
                prompt=prompt,
                response_model=AnalysisResult,
                max_retries=3
            )
            analysis_data = result.model_dump()
        except Exception as e:
            analysis_data = {
                "insights": {"error": f"Instructor call failed: {str(e)}"},
                "contradictions": [],
                "risks": [],
                "opportunities": [],
                "urgency_score": 5,
                "domain_detected": "generic"
            }
    else:
        # Fall back to high-fidelity offline simulation loop
        # Bind analysis tools to Gemini model
        llm_with_tools = llm.bind_tools([
            detect_contradiction, score_source_credibility, extract_temporal_signals, filter_noise
        ])
        
        messages = [
            ("system", SYSTEM_PROMPT),
            ("human", prompt)
        ]
        
        # Execute tool loops inside node (up to 5 turns)
        for _ in range(5):
            response = await resilient_llm_invoke(
                messages,
                domain=state.get("domain_config", {}).get("domain", "supply_chain")
            )
            if not response.tool_calls:
                break
                
            messages.append(response)
            
            for tc in response.tool_calls:
                tool_name = tc["name"]
                tool_args = tc["args"]
                
                # Resolve tool
                tool_obj = None
                for t in [detect_contradiction, score_source_credibility, extract_temporal_signals, filter_noise]:
                    if t.name == tool_name:
                        tool_obj = t
                        break
                        
                if tool_obj:
                    # Invoke tool synchronously
                    tool_res = tool_obj.invoke(tool_args)
                    messages.append({
                        "role": "tool",
                        "name": tool_name,
                        "tool_call_id": tc["id"],
                        "content": tool_res
                    })
                else:
                    messages.append({
                        "role": "tool",
                        "name": tool_name,
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"error": f"Tool {tool_name} not found"})
                    })
                    
        # Parse final response content as JSON
        content_str = response.content
        match = re.search(r"```json\s*(.*?)\s*```", content_str, re.DOTALL)
        if match:
            content_str = match.group(1)
        else:
            match_curly = re.search(r"\{.*\}", content_str, re.DOTALL)
            if match_curly:
                content_str = match_curly.group(0)
                
        try:
            analysis_data = json.loads(content_str)
        except Exception as e:
            analysis_data = {
                "insights": {"error": f"Failed to parse JSON response: {str(e)}", "raw_response": response.content},
                "contradictions": [],
                "risks": [],
                "opportunities": [],
                "urgency_score": 5,
                "domain_detected": "generic"
            }
        
    state["insights"] = analysis_data
    
    # Parse contradictions into Contradiction objects
    contradiction_objs = []
    
    # In instructor mode, analysis_data["contradictions"] is a list of dicts/ContradictionItems
    for c in analysis_data.get("contradictions", []):
        contradiction_objs.append(Contradiction(
            source_a_id=c.get("source_a_id", ""),
            source_b_id=c.get("source_b_id", ""),
            metric=c.get("metric", "unknown"),
            conflict_score=float(c.get("conflict_score", 0.0)),
            resolution=c.get("resolution", "unresolved"),
            disputed_source_id=c.get("disputed_source_id", "")
        ))
    state["contradictions"] = contradiction_objs
    
    # Mark disputed sources in state
    disputed_ids = {c.disputed_source_id for c in contradiction_objs if c.disputed_source_id}
    for s in state["filtered_sources"]:
        if s.source_id in disputed_ids:
            s.status = "disputed"
            
    # --- Semantic Contradiction Detection ---
    from agent.semantic_analyzer import (
        detect_semantic_contradictions, 
        format_contradiction_for_display
    )
    
    # Run semantic contradiction detection on filtered sources
    semantic_contradictions = await detect_semantic_contradictions(
        state["filtered_sources"],
        topic_threshold=0.25,
        similarity_threshold=0.55
    )
    
    # Merge with numeric contradictions (avoid duplicates by source pair)
    existing_pairs = {
        (c.source_a_id, c.source_b_id) 
        for c in state["contradictions"]
    }
    for sc in semantic_contradictions:
        pair = (sc.source_a_id, sc.source_b_id)
        if pair not in existing_pairs:
            state["contradictions"].append(sc)
            # Mark disputed source
            for src in state["filtered_sources"]:
                if src.source_id == sc.disputed_source_id:
                    src.status = "disputed"
    
    # Broadcast each contradiction to mobile in real time
    for c in state["contradictions"]:
        state["trace"].append({
            "node": "analyze",
            "event": "contradiction_found",
            **format_contradiction_for_display(c)
        })
            
    state["trace"].append({
        "node": "analyze",
        "status": "complete",
        "contradictions_found": len(state["contradictions"]),
        "detected_domain": analysis_data.get("domain_detected", "generic"),
        "timestamp": datetime.now().isoformat()
    })
    
    return state



# ──────────────────────────────────────────────────────────────────────
# NODE 3 — plan
# ──────────────────────────────────────────────────────────────────────
async def plan(state: AgentState) -> AgentState:
    """
    Generates a prioritized multi-step action chain.
    Runs analytical verification against local constraints.
    Constraints are built dynamically from enriched source signals;
    any explicit domain_config constraints are merged on top.
    """
    # ── Dynamic constraint construction ───────────────────────────────
    from agent.constraint_builder import DynamicConstraintBuilder
    builder = DynamicConstraintBuilder()
    dynamic_constraints = builder.build(state["filtered_sources"])

    # domain_config constraints win on conflict (explicit user overrides)
    merged_constraints = {
        **dynamic_constraints,
        **state["domain_config"].get("constraints", {}),
    }
    state["domain_config"]["constraints"] = merged_constraints

    state["trace"].append({
        "node": "plan",
        "event": "constraints_built",
        "dynamic_keys": list(dynamic_constraints.keys()),
        "final_constraint_count": len(merged_constraints),
    })
    # ─────────────────────────────────────────────────────────────────

    analysis_result_json = json.dumps(state["insights"])
    constraints_json = json.dumps(merged_constraints)
    
    prompt = PLAN_PROMPT.format(
        analysis_result=analysis_result_json,
        constraints=constraints_json
    )
    
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if api_key and api_key != "mock_key":
        from agent.llm_client import call_llm_structured, PlanResult
        try:
            result: PlanResult = call_llm_structured(
                prompt=prompt,
                response_model=PlanResult,
                max_retries=3
            )
            plan_data = result.model_dump()
        except Exception as e:
            plan_data = {
                "action_chain": [{
                    "action_id": "ACT-01",
                    "action_type": "escalate_issue",
                    "description": f"Planning failed with instructor: {str(e)}",
                    "parameters": {"severity": "critical", "assignee": "ops_director", "context": f"Instructor error: {str(e)}"},
                    "constraints": {}
                }]
            }
    else:
        # Call Gemini (no tools needed for planning reasoning)
        response = await resilient_llm_invoke([
            ("system", SYSTEM_PROMPT),
            ("human", prompt)
        ], is_planning=True, domain=state.get("domain_config", {}).get("domain", "supply_chain"))
        
        content_str = response.content
        match = re.search(r"```json\s*(.*?)\s*```", content_str, re.DOTALL)
        if match:
            content_str = match.group(1)
        else:
            match_curly = re.search(r"\{.*\}", content_str, re.DOTALL)
            if match_curly:
                content_str = match_curly.group(0)
                
        try:
            plan_data = json.loads(content_str)
        except Exception as e:
            plan_data = {
                "action_chain": [{
                    "action_id": "ACT-01",
                    "action_type": "escalate_issue",
                    "description": f"Planning failed to generate valid JSON: {str(e)}",
                    "parameters": {"severity": "critical", "assignee": "ops_director", "context": response.content},
                    "constraints": {}
                }]
            }
        
    action_plan_objs = []
    for a in plan_data.get("action_chain", []):
        action_id = a.get("action_id", f"ACT-{uuid4().hex[:4].upper()}")
        action_type = a.get("action_type", "escalate_issue")
        description = a.get("description", "")
        params = a.get("parameters", {})
        action_constraints = a.get("constraints", {})
        fallback = a.get("fallback_action")
        
        triggered_by = a.get("triggered_by")
        confidence = float(a.get("confidence", 0.8))
        urgency = float(a.get("urgency", 0.7))
        impact = float(a.get("impact", 0.8))
        what_if_skipped = a.get("what_if_skipped", "")
        
        action_plan_objs.append(Action(
            action_id=action_id,
            action_type=action_type,
            description=description,
            parameters=params,
            constraints=action_constraints,
            fallback_action=fallback,
            triggered_by=triggered_by,
            confidence=confidence,
            urgency=urgency,
            impact=impact,
            what_if_skipped=what_if_skipped
        ))
        
    state["action_plan"] = action_plan_objs
    
    from agent.causal_planner import (
        compute_priority_score, 
        validate_causal_chain,
        validate_constraints,
        build_causal_summary
    )
    
    # Attach insights as causal triggers
    insights = state["insights"].get("insights", [])
    for action in state["action_plan"]:
        # Link action to highest-confidence relevant insight
        if insights:
            best_insight = max(insights, key=lambda i: i.get("confidence", 0))
            if action.triggered_by is None:
                action.triggered_by = best_insight.get("title", "")
        
        # Compute priority score from confidence + urgency + impact
        action.priority_score = compute_priority_score(
            action.confidence, action.urgency, action.impact
        )
    
    # Validate causal chain (sort + detect side effects)
    state["action_plan"] = validate_causal_chain(state["action_plan"])
    
    # Validate constraints (modify/reject infeasible actions)
    state["action_plan"] = validate_constraints(
        state["action_plan"],
        state["domain_config"].get("constraints", {})
    )
    
    # Build causal summary for trace
    causal_summary = build_causal_summary(state["action_plan"])
    state["trace"].append({
        "node": "plan",
        "event": "causal_chain_built",
        "action_count": len(state["action_plan"]),
        "causal_summary": causal_summary,
        "plan_confidence": sum(a.confidence for a in state["action_plan"]) / max(len(state["action_plan"]), 1)
    })
    
    state["trace"].append({
        "node": "plan",
        "status": "complete",
        "action_count": len(state["action_plan"]),
        "timestamp": datetime.now().isoformat()
    })
    
    return state



# ──────────────────────────────────────────────────────────────────────
# NODE 4 — execute_step
# ──────────────────────────────────────────────────────────────────────
async def execute_step(state: AgentState) -> AgentState:
    """
    Executes the next pending action step in the generated chain.
    Captures StateSnapshots and measures latency parameters.
    """
    from agent.execution_timeline import TimelineEntry, link_causal_chain
    
    # Initialize timeline in state if not present
    if "timeline" not in state:
        state["timeline"] = []
    
    # Find first pending action
    action = None
    for a in state["action_plan"]:
        if a.status == "pending":
            action = a
            break
            
    if not action:
        return state
        
    # Take serialised snapshot before execution for recovery state mapping
    grid_status = {s.source_id: s.status for s in state["filtered_sources"]}
    snapshot = StateSnapshot(
        snapshot_id=f"SNAP-{uuid4().hex[:6].upper()}",
        timestamp=datetime.now(),
        state_data={
            "source_status": grid_status,
            "action_statuses": {a.action_id: a.status for a in state["action_plan"]},
            "retry_count": state.get("retry_count", 0),
            "error_count": len(state["errors"]),
            "completed_actions": [a.action_id for a in state["action_plan"] if a.status == "success"]
        }
    )
    state["snapshots"].append(snapshot)
    
    # Create timeline entry
    entry = TimelineEntry(action=action, snapshot_before=snapshot)
    
    # Broadcast step_start to mobile
    state["trace"].append({
        "type": "step_start",
        "node": "execute_step",
        "action_id": action.action_id,
        "description": action.description,
        "confidence": action.confidence,
        "triggered_by": action.triggered_by
    })
    
    # Tool mapping
    tool_map = {
        "notify_stakeholder": notify_stakeholder,
        "update_system_record": update_system_record,
        "simulate_procurement_order": simulate_procurement_order,
        "schedule_monitoring": schedule_monitoring,
        "escalate_issue": escalate_issue
    }
    
    tool_obj = tool_map.get(action.action_type)
    start_time = time.time()
    
    if tool_obj:
        try:
            # Execute tool call synchronously
            tool_res_str = tool_obj.invoke(action.parameters)
            tool_res = json.loads(tool_res_str)
            
            latency = int((time.time() - start_time) * 1000)
            action.latency_ms = latency
            action.result = tool_res
            
            if tool_res.get("status") == "failed":
                action.status = "failed"
                state["errors"].append(f"Action {action.action_id} failed: {tool_res.get('error')}")
                entry.fail(str(tool_res.get("error", "tool returned failed status")), latency)
            else:
                action.status = "success"
                state_after = {"action_statuses": {a.action_id: a.status for a in state["action_plan"]}, "error_count": len(state["errors"])}
                entry.complete(tool_res, latency, snapshot.state_data, state_after)
                
            # Log execution
            state["execution_log"].append({
                "action_id": action.action_id,
                "action_type": action.action_type,
                "status": action.status,
                "latency_ms": latency,
                "result": tool_res
            })
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            action.latency_ms = latency
            action.status = "failed"
            state["errors"].append(f"Action {action.action_id} threw an exception: {str(e)}")
            state["execution_log"].append({
                "action_id": action.action_id,
                "action_type": action.action_type,
                "status": "failed",
                "latency_ms": latency,
                "error": str(e)
            })
            entry.fail(str(e), latency)
    else:
        action.status = "failed"
        state["errors"].append(f"Matching execution tool not found for action type '{action.action_type}'")
        entry.fail(f"Tool not found: {action.action_type}", 0)
    
    state["timeline"].append(entry)
    
    # Link causal chain after each step
    state["timeline"] = link_causal_chain(state["timeline"])
    
    # Broadcast timeline event to mobile via trace
    state["trace"].append(entry.to_ws_event())
    
    return state


# ──────────────────────────────────────────────────────────────────────
# NODE 5 — evaluate
# ──────────────────────────────────────────────────────────────────────
async def evaluate(state: AgentState) -> AgentState:
    """
    A placeholder node returning the state.
    Graph traversal routing logic itself lives in the conditional routing edge function.
    """
    has_failed = any(a.status == "failed" for a in state["action_plan"])
    pending = [a for a in state["action_plan"] if a.status == "pending"]
    
    routing = "execute_step"
    if has_failed:
        routing = "self_heal"
    elif not pending:
        routing = "finalize"
        
    state["trace"].append({
        "node": "evaluate",
        "status": "complete",
        "next_route": routing,
        "timestamp": datetime.now().isoformat()
    })
    return state


# ──────────────────────────────────────────────────────────────────────
# NODE 6 — self_heal
# ──────────────────────────────────────────────────────────────────────
async def self_heal(state: AgentState) -> AgentState:
    """
    Automated 3-tier failure recovery: retry, fallback, or safe rollback.
    Calls Gemini SELF_HEAL_PROMPT to log recovery decisions.
    """
    failed_idx = -1
    for idx, a in enumerate(state["action_plan"]):
        if a.status == "failed":
            failed_idx = idx
            break
            
    if failed_idx == -1:
        return state
        
    failed_action = state["action_plan"][failed_idx]
    constraints_manifest = state.get("domain_config", {}).get("constraints", {})
    max_retries = int(constraints_manifest.get("max_retries", 3))
    
    decision = "none"
    reason = ""
    
    # TIER 1: Retry with same or altered parameters
    if state["retry_count"] < max_retries:
        state["retry_count"] += 1
        failed_action.status = "pending"
        decision = "retry"
        reason = f"Initiated execution retry attempt #{state['retry_count']} under max_retries constraint threshold ({max_retries})."
        if state["errors"]:
            state["errors"].pop() # Clear last error for retry
            
    # TIER 2: Execute Fallback Action
    elif failed_action.fallback_action:
        fb_dict = failed_action.fallback_action
        fallback_act = Action(
            action_id=f"{failed_action.action_id}-FB",
            action_type=fb_dict.get("action_type", "escalate_issue"),
            description=f"Fallback recovery for {failed_action.description}",
            parameters=fb_dict.get("parameters", {}),
            constraints=failed_action.constraints,
            status="pending"
        )
        # Inject fallback step directly into action chain
        state["action_plan"].insert(failed_idx + 1, fallback_act)
        failed_action.status = "failed" # Set failed but mitigated
        decision = "fallback"
        reason = "Execution retries exhausted. Injecting pre-planned fallback action to mitigate failure."
        if state["errors"]:
            state["errors"].pop()
            
    # TIER 3: Rollback State
    else:
        decision = "rollback"
        reason = "Execution retries exhausted and no fallback recovery defined. Restoring state from last snapshot."
        failed_action.status = "rolled_back"
        
        # Recover status metrics from the last snapshot
        if state["snapshots"]:
            last_snap = state["snapshots"][-1]
            source_status_restore = last_snap.state_data.get("source_status", {})
            for s in state["filtered_sources"]:
                if s.source_id in source_status_restore:
                    s.status = source_status_restore[s.source_id]
                    
    # Invoke Gemini to audit and log recovery rationale
    failed_act_json = json.dumps(failed_action.model_dump(), default=str)
    last_err = state["errors"][-1] if state["errors"] else "Unknown execution error"
    
    prompt = SELF_HEAL_PROMPT.format(
        failed_action=failed_act_json,
        error=last_err
    )
    
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if api_key and api_key != "mock_key":
        from agent.llm_client import call_llm_structured, SelfHealDecision
        try:
            result: SelfHealDecision = call_llm_structured(
                prompt=prompt,
                response_model=SelfHealDecision,
                max_retries=3
            )
            commentary = result.reason
        except Exception as e:
            commentary = f"Instructor self-heal call failed: {str(e)}"
    else:
        try:
            response = await resilient_llm_invoke([
                ("system", SYSTEM_PROMPT),
                ("human", prompt)
            ], is_self_heal=True, action_type=failed_action.action_type)
            commentary = response.content
        except Exception as e:
            commentary = f"Self-heal LLM auditing failed: {str(e)}"
        
    state["trace"].append({
        "node": "self_heal",
        "decision": decision,
        "reason": reason,
        "commentary": commentary,
        "timestamp": datetime.now().isoformat()
    })
    
    return state


# ──────────────────────────────────────────────────────────────────────
# NODE 7 — finalize
# ──────────────────────────────────────────────────────────────────────
async def finalize(state: AgentState) -> AgentState:
    """
    Finalizes the execution, captures after_state values,
    and computes complete impact metrics.
    """
    after_status = {s.source_id: s.status for s in state["filtered_sources"]}
    state["after_state"] = {
        "sources_count": len(state["filtered_sources"]),
        "status": "complete",
        "source_statuses": after_status
    }
    
    successes = sum(1 for a in state["action_plan"] if a.status == "success")
    failures = sum(1 for a in state["action_plan"] if a.status == "failed")
    rollbacks = sum(1 for a in state["action_plan"] if a.status == "rolled_back")
    
    total_latency = sum(a.latency_ms for a in state["action_plan"] if a.latency_ms is not None)
    
    # Calculate costs: 0.001 USD per tool execution logged + 0.015 USD base LLM token cost
    tool_calls_count = len(state["execution_log"])
    cost_usd = tool_calls_count * 0.001 + 0.015
    
    # Compute operational risk reduction
    urgency = state["insights"].get("urgency_score", 5) if isinstance(state["insights"], dict) else 5
    before_risk = "HIGH" if urgency >= 7 else ("MEDIUM" if urgency >= 4 else "LOW")
    after_risk = "LOW" if failures == 0 and rollbacks == 0 else "MEDIUM"
    risk_delta = f"{before_risk} → {after_risk}"
    
    metrics = ImpactMetrics(
        actions_completed=successes,
        actions_failed=failures,
        actions_rolled_back=rollbacks,
        total_latency_ms=total_latency,
        cost_usd=round(cost_usd, 5),
        risk_delta=risk_delta,
        before_state=state["before_state"],
        after_state=state["after_state"]
    )
    
    state["outcome"] = metrics
    
    # Attach full causal timeline to outcome for mobile rendering
    state["outcome"].timeline = [
        e.to_ws_event() for e in state.get("timeline", [])
    ]
    state["outcome"].causal_chain_summary = [
        {
            "step": i + 1,
            "action": e.action_id,
            "triggered_by": e.triggered_by,
            "caused_next": e.caused_next_action,
            "status": e.status,
            "latency_ms": e.latency_ms
        }
        for i, e in enumerate(state.get("timeline", []))
    ]
    
    state["trace"].append({
        "node": "finalize",
        "status": "complete",
        "impact": f"Completed: {successes}, Failed: {failures}, Rolled Back: {rollbacks}. Total Latency: {total_latency}ms. Risk: {risk_delta}",
        "timeline_entries": len(state.get("timeline", [])),
        "timestamp": datetime.now().isoformat()
    })
    
    return state
