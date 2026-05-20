"""
agent/prompts.py
----------------
Defines production-quality, unambiguous prompts and JSON schemas used by the
Autonomous Content-to-Action Agent for Ingestion, Analysis, Planning, and Self-Healing.
"""

# ──────────────────────────────────────────────────────────────────────
# 1. SYSTEM PROMPT
# ──────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are Grid Sentinel - an elite autonomous operations analyst and orchestrator.
Your goal is to parse multi-source input streams, extract key trends, resolve contradictions,
and generate constraint-bounded multi-step action chains.

You have access to 14 specialized operational tools spanning Ingestion, Analysis, and Action Execution.

CRITICAL INSTRUCTIONS:
1. ALWAYS return a valid, well-formed JSON object when requested. Do not wrap responses in conversational text, markdown outside of json code blocks, or preamble.
2. NEVER merge conflicting data into false consensus. When sources disagree, explicitly surface the conflict, evaluate credibility and recency weights, and define an investigation path.
3. ALWAYS check actions against active real-world constraints (budget, rate-limits, urgency, and deadlines) before recommending them.
4. Maintain a precise, highly analytical, and objective tone. Keep summaries factual and trace every single insight back to its origin source ID.
"""

# ──────────────────────────────────────────────────────────────────────
# 2. ANALYZE PROMPT
# ──────────────────────────────────────────────────────────────────────
ANALYZE_PROMPT = """
### Operational Data Ingestion & Analysis Request
You have successfully ingested {source_count} heterogeneous data sources.

Here is the unified data bus summary representing the current state of the organization:
---
{sources_summary}
---

Your task is to analyze these inputs and return a strict JSON output matching the schema below.

### Key Guidelines:
1. EXTRACT exactly 5 high-fidelity operational insights as a JSON array. Back each insight with specific metrics and source IDs.
2. DETECT CONTRADICTIONS: Look for any two sources reporting conflicting metrics (e.g. source A says normal, source B says trip; or inventory stock counts mismatch).
   - If two sources discuss the same metric and report conflicting claims, you must call the `detect_contradiction` tool to compute conflict scores and identify the disputed source.
3. CHECK FRESHNESS: If any source has an unknown freshness, stale data, or is missing a clear timeline, call the `score_source_credibility` tool to verify its temporal decay.
4. FILTER NOISE: Exclude spam, stale, or low-credibility sources using the `filter_noise` tool if they do not meet operational standards.

Your final output must be a strict JSON block with NO extra commentary:
{{
  "insights": [
    {{
      "insight_id": "INS-01",
      "summary": "Short description of the trend, risk, or opportunity",
      "supporting_sources": ["SRC-01", "SRC-03"],
      "severity": "critical" | "high" | "medium" | "low"
    }}
  ],
  "risks": [
    {{
      "description": "Systemic risk description",
      "impact": "Description of operational impact",
      "source_ids": ["SRC-02"]
    }}
  ],
  "opportunities": [
    {{
      "description": "Optimization opportunity identified",
      "value_add": "Expected operational or financial return",
      "source_ids": ["SRC-04"]
    }}
  ],
  "contradictions": [
    {{
      "metric": "Key operational metric in conflict",
      "source_a_id": "SRC-01",
      "source_b_id": "SRC-02",
      "conflict_score": 0.0,
      "resolution": "Which source was disputed/marked stale and why",
      "investigation_path": [
        "First step of resolution path",
        "Second step of resolution path"
      ]
    }}
  ],
  "urgency_score": 8, // Integer value between 0 and 10 representing urgency
  "domain_detected": "supply_chain" | "power_grid" | "sentiment_crisis" | "generic"
}}
"""

# ──────────────────────────────────────────────────────────────────────
# 3. PLAN_PROMPT
# ──────────────────────────────────────────────────────────────────────
PLAN_PROMPT = """
### Operational Action Planning Request
You have completed the system analysis.

Analysis Result JSON:
---
{analysis_result}
---

Active Constraints Manifest:
---
{constraints}
---

Your task is to generate a coordinated sequence of 3 to 5 interconnected actions (the Action Chain) to mitigate the risks and capitalize on the insights identified.

### Planning Rules:
1. Priority: All actions must be ordered logically and ranked by Urgency × Impact.
2. Constraint Compliance: For every proposed action, you must check its parameters against the constraints manifest (e.g. emergency order budget limits, API timeouts, notification rate limits).
   - Analytically verify constraint compatibility. If an action breaches a constraint (e.g. cost exceeds budget limit), you must reject the action or mutate it (e.g. reduce order quantity) to fit within parameters.
3. Resilience: Every single action in the chain must define a concrete, actionable `fallback_action` to activate in case of execution failure.
4. Action IDs: Action IDs must follow a strict sequence (e.g. ACT-01, ACT-02, etc.).

Return the final action chain as a strict JSON block matching the schema below:
{{
  "action_chain": [
    {{
      "action_id": "ACT-01",
      "action_type": "notify_stakeholder" | "update_system_record" | "simulate_procurement_order" | "schedule_monitoring" | "escalate_issue",
      "description": "Factual description of this step in the chain",
      "parameters": {{
        // Specific arguments for the corresponding tool call (e.g. channel, quantity, target, etc.)
      }},
      "constraints": {{
        // The specific constraints checked (e.g. "budget_pkr": 100000.0)
      }},
      "fallback_action": {{
        "action_type": "The fallback tool type to run if this fails",
        "parameters": {{
          // Fallback arguments (e.g. fallback channel, manual alert queue details)
        }}
      }}
    }}
  ]
}}
"""

# ──────────────────────────────────────────────────────────────────────
# 4. SELF_HEAL_PROMPT
# ──────────────────────────────────────────────────────────────────────
SELF_HEAL_PROMPT = """
### System Self-Healing & Failure Recovery Request
An error was encountered during the execution of the action chain.

Failed Action:
---
{failed_action}
---

Encountered Error Message:
---
{error}
---

Your task is to analyze this operational failure and decide on the optimal recovery strategy to prevent state corruption.

### Recovery Strategies:
1. RETRY: If the failure was a transient error (e.g., rate limits or minor network timeouts), recommend a retry with modified or reduced parameters (e.g. smaller payload, different channel).
2. FALLBACK: If the target system is completely unresponsive or budget is permanently exhausted, recommend executing the defined `fallback_action`.
3. ROLLBACK: If proceeding will lead to inconsistent state or cascading failures, recommend rolling back the system state completely using the last safe StateSnapshot.

Your final output must be a strict JSON block matching the schema below:
{{
  "decision": "retry" | "fallback" | "rollback",
  "modified_parameters": {{
    // New parameters if retrying, otherwise empty
  }},
  "reason": "Clear analytical rationale behind the recovery decision"
}}
"""
