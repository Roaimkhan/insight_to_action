"""
agent/tools.py
--------------
Implementation of the 14 LangChain tools representing ingestion,
analysis, action execution, and self-healing systems.
"""

import json
import random
import re
from datetime import datetime, timedelta
from uuid import uuid4
from langchain_core.tools import BaseTool, tool

# ──────────────────────────────────────────────────────────────────────
# INGESTION TOOLS
# ──────────────────────────────────────────────────────────────────────

@tool
async def fetch_pdf_content(path: str) -> str:
    """
    Parses a PDF report at the given local file path page-by-page.
    Extracts publication date, word counts, and scores credibility.
    """
    from ingestion.pdf_parser import parse_pdf
    res = await parse_pdf(path)
    return json.dumps(res, default=str)

@tool
async def fetch_web_article(url: str) -> str:
    """
    Scrapes and parses a web article or page at the given URL using httpx and BeautifulSoup.
    Cleans tags, extracts published dates, and computes decaying credibility.
    """
    from ingestion.web_parser import parse_web
    res = await parse_web(url)
    return json.dumps(res, default=str)

@tool
async def fetch_csv_json(path: str) -> str:
    """
    Reads structured CSV or JSON files using pandas.
    Extracts summary statistics, row counts, and provides sample data.
    """
    from ingestion.csv_parser import parse_csv
    res = await parse_csv(path)
    return json.dumps(res, default=str)

@tool
async def fetch_table_dashboard(url_or_html: str) -> str:
    """
    Extracts tabular statistics from raw HTML or web URLs using pandas.read_html().
    Returns numeric summaries, row counts, and sample row lists.
    """
    from ingestion.table_parser import parse_table
    res = await parse_table(url_or_html)
    return json.dumps(res, default=str)

@tool
async def fetch_realtime_feed(scenario: str) -> str:
    """
    Fetches dynamic events from a mock real-time operational stream.
    Simulates active time-variant signals and global complaint counters.
    """
    from ingestion.realtime_feed import parse_realtime
    res = await parse_realtime(scenario)
    return json.dumps(res, default=str)


# ──────────────────────────────────────────────────────────────────────
# ANALYSIS TOOLS
# ──────────────────────────────────────────────────────────────────────

@tool
def detect_contradiction(source_a_json: str, source_b_json: str) -> str:
    """
    Compares two DataSource sources to check for conflicting claims on the same metrics.
    Calculates conflict score and proposes which source is disputed based on credibility and recency weights.
    """
    try:
        a = json.loads(source_a_json)
        b = json.loads(source_b_json)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse source inputs: {str(e)}"})
        
    source_a_id = a.get("source_id", "A")
    source_b_id = b.get("source_id", "B")
    
    val_a = None
    val_b = None
    metric = "general"
    
    a_struct = a.get("structured_data", {}) or {}
    b_struct = b.get("structured_data", {}) or {}
    
    # Try direct numeric comparison of keys
    for key in ["stock_level", "complaint_count", "load_shed_mw", "active_feeders", "quantity"]:
        if key in a_struct and key in b_struct:
            val_a = a_struct[key]
            val_b = b_struct[key]
            metric = key
            break
            
    # Calculate conflict score
    if val_a is not None and val_b is not None:
        try:
            num_a = float(val_a)
            num_b = float(val_b)
            max_val = max(num_a, num_b)
            if max_val > 0:
                conflict_score = abs(num_a - num_b) / max_val
            else:
                conflict_score = 0.0
        except ValueError:
            val_a = None
            val_b = None
            
    if val_a is None or val_b is None:
        # Compare raw_text word overlap (Jaccard distance)
        words_a = set(a.get("raw_text", "").lower().split())
        words_b = set(b.get("raw_text", "").lower().split())
        if not words_a or not words_b:
            conflict_score = 0.0
        else:
            intersection = len(words_a.intersection(words_b))
            union = len(words_a.union(words_b))
            jaccard = intersection / union
            conflict_score = 1.0 - jaccard
            metric = "textual_overlap"
            
    # Compute recency
    now = datetime.now()
    def get_recency(source_dict):
        ingested = source_dict.get("ingested_at")
        if not ingested:
            return 0.5
        try:
            if isinstance(ingested, str):
                dt = datetime.fromisoformat(ingested.replace("Z", "+00:00"))
            else:
                dt = ingested
            diff_seconds = abs((now - dt.replace(tzinfo=None)).total_seconds())
            # Scale: decays to 0.10 over 24 hours
            return max(0.1, 1.0 - (diff_seconds / 86400.0))
        except Exception:
            return 0.5
            
    rec_a = get_recency(a)
    rec_b = get_recency(b)
    
    cred_a = float(a.get("credibility_score", 0.70))
    cred_b = float(b.get("credibility_score", 0.70))
    
    weight_a = cred_a * 0.4 + rec_a * 0.6
    weight_b = cred_b * 0.4 + rec_b * 0.6
    
    if weight_a >= weight_b:
        disputed_source_id = source_b_id
        winner_id = source_a_id
        rational = f"Source {source_a_id} has higher weight ({weight_a:.2f} vs {weight_b:.2f}) due to higher credibility/recency."
    else:
        disputed_source_id = source_a_id
        winner_id = source_b_id
        rational = f"Source {source_b_id} has higher weight ({weight_b:.2f} vs {weight_a:.2f}) due to higher credibility/recency."
        
    resolution_note = (
        f"Contradiction found on metric '{metric}' with conflict score {conflict_score:.2f}. "
        f"Resolution: Marked {disputed_source_id} as disputed and prioritized {winner_id}. {rational}"
    )
    
    return json.dumps({
        "conflict_score": round(conflict_score, 4),
        "disputed_source_id": disputed_source_id,
        "resolution_note": resolution_note
    })

@tool
def score_source_credibility(source_json: str) -> str:
    """
    Evaluates credibility score of a source by applying temporal decay based on type and age.
    """
    try:
        source = json.loads(source_json)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse source input: {str(e)}"})
        
    source_type = source.get("source_type", "pdf")
    base_score = float(source.get("credibility_score", 0.70))
    ingested_str = source.get("ingested_at")
    
    now = datetime.now()
    decay_applied = 0.0
    
    if ingested_str:
        try:
            if isinstance(ingested_str, str):
                dt = datetime.fromisoformat(ingested_str.replace("Z", "+00:00")).replace(tzinfo=None)
            else:
                dt = ingested_str.replace(tzinfo=None)
                
            time_diff = now - dt
            days_diff = time_diff.days
            
            if source_type == "web" and days_diff > 0:
                decay_applied = 0.05 * days_diff
            elif source_type == "pdf" and days_diff > 0:
                decay_applied = 0.02 * days_diff
            elif source_type == "realtime":
                minutes_diff = time_diff.total_seconds() / 60.0
                if minutes_diff > 5.0:
                    decay_applied = 0.05 * ((minutes_diff - 5.0) / 5.0)
        except Exception:
            pass
            
    final_score = max(0.10, base_score - decay_applied)
    
    if final_score >= 0.70:
        freshness = "fresh"
    elif final_score >= 0.50:
        freshness = "stale"
    else:
        freshness = "expired"
        
    return json.dumps({
        "final_score": round(final_score, 4),
        "decay_applied": round(decay_applied, 4),
        "freshness": freshness
    })

@tool
def extract_temporal_signals(sources_json: str, metric_key: str) -> str:
    """
    Groups, sorts, and analyzes time-variant metrics across historical sources.
    Determines trajectory direction (rising/falling/stable) and velocity of change.
    """
    try:
        sources = json.loads(sources_json)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse sources input: {str(e)}"})
        
    data_points = []
    
    for s in sources:
        ingested_str = s.get("ingested_at")
        struct = s.get("structured_data", {}) or {}
        val = None
        
        if metric_key in struct:
            val = struct[metric_key]
        elif isinstance(struct, dict):
            # Check inside nested dictionary
            col_sums = struct.get("column_summaries", {})
            if metric_key in col_sums:
                val = col_sums[metric_key].get("mean")
            else:
                val = struct.get(metric_key)
                
        # Regex search inside flat raw text if not structured
        if val is None:
            raw_text = s.get("raw_text", "")
            match = re.search(rf"\b{metric_key}[:=]\s*([+-]?\d+(?:\.\d+)?)\b", raw_text, re.IGNORECASE)
            if match:
                val = float(match.group(1))
                
        if val is not None and ingested_str:
            try:
                dt = datetime.fromisoformat(ingested_str.replace("Z", "+00:00")).replace(tzinfo=None)
                data_points.append({
                    "timestamp": dt,
                    "value": float(val)
                })
            except Exception:
                continue
                
    if len(data_points) < 2:
        serializable_points = [
            {"timestamp": dp["timestamp"].isoformat(), "value": dp["value"]}
            for dp in data_points
        ]
        return json.dumps({
            "metric_key": metric_key,
            "direction": "insufficient_data",
            "velocity": 0.0,
            "data_points": serializable_points
        })
        
    # Sort by timestamp ascending
    data_points.sort(key=lambda x: x["timestamp"])
    
    first = data_points[0]
    last = data_points[-1]
    
    val_diff = last["value"] - first["value"]
    time_diff_hours = (last["timestamp"] - first["timestamp"]).total_seconds() / 3600.0
    
    if time_diff_hours > 0:
        velocity = val_diff / time_diff_hours
    else:
        velocity = 0.0
        
    if abs(val_diff) < 0.01:
        direction = "stable"
    elif val_diff > 0:
        direction = "rising"
    else:
        direction = "falling"
        
    serializable_points = [
        {"timestamp": dp["timestamp"].isoformat(), "value": dp["value"]}
        for dp in data_points
    ]
    
    return json.dumps({
        "metric_key": metric_key,
        "direction": direction,
        "velocity": round(velocity, 4),
        "data_points": serializable_points
    })

@tool
def filter_noise(data_bus_json: str) -> str:
    """
    Filters raw sources out based on low credibility (<0.50), expired status, or extremely low words (<20 words).
    """
    try:
        sources = json.loads(data_bus_json)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse sources input: {str(e)}"})
        
    kept = []
    removed = []
    
    for s in sources:
        source_id = s.get("source_id", "unknown")
        cred = float(s.get("credibility_score", 1.0))
        fresh = s.get("freshness", "fresh")
        text = s.get("raw_text", "")
        word_count = len(text.split())
        
        reasons = []
        if cred < 0.50:
            reasons.append(f"Credibility too low ({cred:.2f} < 0.50)")
        if fresh == "expired":
            reasons.append("Source has expired")
        if word_count < 20:
            reasons.append(f"Insufficient content length ({word_count} words < 20)")
            
        if reasons:
            removed.append({
                "source_id": source_id,
                "reasons": reasons
            })
        else:
            kept.append(source_id)
            
    return json.dumps({
        "kept_source_ids": kept,
        "removed_sources": removed
    })


# ──────────────────────────────────────────────────────────────────────
# ACTION EXECUTION TOOLS
# ──────────────────────────────────────────────────────────────────────

@tool
def notify_stakeholder(channel: str, message: str, priority: str) -> str:
    """
    Dispatches warning alerts to channels (email/slack/sms) with high-priority tracking.
    Simulates a 90% success rate.
    """
    if random.random() < 0.1:
        return json.dumps({
            "status": "failed",
            "error": "Notification gateway timeout"
        })
        
    return json.dumps({
        "status": "sent",
        "channel": channel,
        "delivery_ms": random.randint(200, 800)
    })

@tool
def update_system_record(system_id: str, payload_json: str) -> str:
    """
    Updates the database logs or central system values with the final resolved state.
    Simulates a 95% success rate.
    """
    if random.random() < 0.05:
        return json.dumps({
            "status": "failed",
            "error": "Transaction timeout due to concurrent locks"
        })
        
    return json.dumps({
        "status": "updated",
        "record_id": system_id,
        "timestamp": datetime.now().isoformat()
    })

@tool
def simulate_procurement_order(item: str, quantity: int, budget_pkr: float) -> str:
    """
    Simulates placing a procurement request under budget parameters (default item cost: 1500 PKR).
    """
    unit_cost = 1500.0
    total_cost = quantity * unit_cost
    
    if total_cost > budget_pkr:
        return json.dumps({
            "status": "rejected",
            "reason": f"Required budget {total_cost:.2f} PKR exceeds constraint threshold {budget_pkr:.2f} PKR"
        })
        
    return json.dumps({
        "status": "ordered",
        "item": item,
        "quantity": quantity,
        "cost_pkr": total_cost,
        "eta_hours": 48
    })

@tool
def schedule_monitoring(target: str, interval_minutes: int) -> str:
    """
    Schedules future health monitoring checks for anomaly persistence.
    """
    next_check = datetime.now() + timedelta(minutes=interval_minutes)
    
    return json.dumps({
        "status": "scheduled",
        "target": target,
        "interval_minutes": interval_minutes,
        "next_check": next_check.isoformat()
    })

@tool
def escalate_issue(severity: str, assignee: str, context: str) -> str:
    """
    Escalates serious unmitigated errors to humans. Returns ticket details.
    """
    eta = 15 if severity.lower() == "critical" else 60
    
    return json.dumps({
        "status": "escalated",
        "ticket_id": str(uuid4()),
        "severity": severity,
        "assignee": assignee,
        "eta_response_min": eta
    })
