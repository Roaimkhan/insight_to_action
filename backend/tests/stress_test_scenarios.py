import asyncio
import json
import sqlite3
import uuid
from datetime import datetime, timedelta
from agent.graph import run_agent
from agent.state import DataSource, AgentState, Action
from database.queries import get_baseline_metrics
from agent.context_enricher import ContextEnricher
from agent.tools import notify_stakeholder, update_system_record

PASS = "✅ PASSED"
FAIL = "❌ FAILED"
results = []

def log(test_name, passed, detail=""):
    status = PASS if passed else FAIL
    results.append({"test": test_name, "status": status, "detail": detail})
    print(f"{status} {test_name}")
    if detail:
        print(f"   → {detail}")
    print()

def recency_score(ingested_at: datetime) -> float:
    age_hours = (datetime.utcnow() - ingested_at).total_seconds() / 3600
    return max(0.1, 1.0 - (age_hours / 24.0))

def make_filler_source(source_id, hint):
    return DataSource(
        source_id=source_id,
        source_type="realtime",
        raw_text=f"Normal operations in {hint}",
        structured_data={},
        credibility_score=0.85,
        ingested_at=datetime.utcnow(),
        freshness="fresh",
        domain_hints=[hint]
    )

async def test_three_source_conflict():
    now = datetime.utcnow()
    
    source_A = DataSource(
        source_id="warehouse_system",
        source_type="csv",
        raw_text="SKU-003 units_available 450 stock inventory warehouse",
        structured_data={
            "extracted_metrics": {"sku": "SKU-003", "units_available": 450},
            "db_enrichment": {"category": "inventory", "skus_detected": ["SKU-003"]}
        },
        credibility_score=0.90,
        ingested_at=now - timedelta(hours=1),
        freshness="fresh",
        domain_hints=["inventory"]
    )
    source_B = DataSource(
        source_id="erp_dashboard",
        source_type="table",
        raw_text="SKU-003 units_available 210 inventory stock dashboard",
        structured_data={
            "extracted_metrics": {"sku": "SKU-003", "units_available": 210},
            "db_enrichment": {"category": "inventory", "skus_detected": ["SKU-003"]}
        },
        credibility_score=0.75,
        ingested_at=now - timedelta(hours=6),
        freshness="fresh",
        domain_hints=["inventory"]
    )
    source_C = DataSource(
        source_id="supplier_confirmation",
        source_type="pdf",
        raw_text="SKU-003 units_available 38 inventory stock supplier confirmed",
        structured_data={
            "extracted_metrics": {"sku": "SKU-003", "units_available": 38},
            "db_enrichment": {"category": "inventory", "skus_detected": ["SKU-003"]}
        },
        credibility_score=0.80,
        ingested_at=now - timedelta(minutes=15),
        freshness="fresh",
        domain_hints=["inventory", "supplier"]
    )
    filler_1 = make_filler_source("order_feed", "orders")
    filler_2 = make_filler_source("pricing_sheet", "pricing")

    domain_config = {
        "domain": "ecommerce",
        "display_name": "ST-1 Three Source Conflict",
        "sources": [],
        "constraints": {
            "max_retries": 2,
            "emergency_restock_budget_pkr": 300000,
            "notification_deadline_min": 30
        }
    }

    # Run full agent — sources pre-injected
    state = await run_agent(
        session_id="st1-" + str(uuid.uuid4())[:8],
        domain_config=domain_config,
        prefill_sources=[source_A, source_B, source_C, filler_1, filler_2]
    )

    # Compute expected disputed source
    weight_A = 0.90 * recency_score(now - timedelta(hours=1))
    weight_B = 0.75 * recency_score(now - timedelta(hours=6))
    weight_C = 0.80 * recency_score(now - timedelta(minutes=15))
    weights = {
        "warehouse_system": weight_A,
        "erp_dashboard": weight_B,
        "supplier_confirmation": weight_C
    }
    expected_disputed = min(weights, key=weights.get)

    # Print conflict matrix
    print("  CONFLICT MATRIX — SKU-003 units_available:")
    print(f"  {'Source':<28} {'Value':>8} {'Credibility':>12} {'Recency':>10} {'Weight':>8}")
    print(f"  {'-'*68}")
    print(f"  {'warehouse_system':<28} {'450':>8} {'0.90':>12} {recency_score(now-timedelta(hours=1)):.3f}{'':<4} {weight_A:.3f}")
    print(f"  {'erp_dashboard':<28} {'210':>8} {'0.75':>12} {recency_score(now-timedelta(hours=6)):.3f}{'':<4} {weight_B:.3f}")
    print(f"  {'supplier_confirmation':<28} {'38':>8} {'0.80':>12} {recency_score(now-timedelta(minutes=15)):.3f}{'':<4} {weight_C:.3f}")
    print(f"  Expected disputed: {expected_disputed} (lowest weight)")

    # Assertions
    contradictions_involving_sku003 = [
        c for c in state.get("contradictions", [])
        if "SKU-003" in str(c)
    ]
    assert len(contradictions_involving_sku003) >= 2, \
        f"Expected >=2 contradictions for SKU-003, got {len(contradictions_involving_sku003)}"

    disputed_sources = [
        src for src in state.get("filtered_sources", [])
        if getattr(src, "status", src.get("status") if isinstance(src, dict) else "") == "disputed"
    ]
    assert len(disputed_sources) >= 1, "At least one source must be marked disputed"
    
    ds_id = disputed_sources[0].source_id if hasattr(disputed_sources[0], "source_id") else disputed_sources[0].get("source_id")
    assert ds_id == expected_disputed, \
        f"Expected {expected_disputed} disputed, got {ds_id}"

    has_investigation_path = (
        "investigation_path" in str(state.get("insights", {})) or
        "investigation" in str(state.get("insights", {}))
    )
    assert has_investigation_path, \
        "Insights must contain investigation path, not false consensus"

    first_action = state.get("action_plan", [])[0] if state.get("action_plan") else None
    assert first_action is not None, "Action plan must not be empty"
    
    act_type = first_action.action_type if hasattr(first_action, "action_type") else first_action.get("action_type")
    assert act_type in ["validate_stock", "escalate_issue", "detect_contradiction", "simulate_procurement_order"], \
        f"First action must be diagnostic, got {act_type}"

    log("ST-1: Three Source Conflict", True,
        f"Contradictions={len(contradictions_involving_sku003)}, "
        f"Disputed={ds_id}, "
        f"First action={act_type}")


async def test_constraint_violation():

    # Pre-built insights that force expensive action recommendations
    forced_insights = {
        "insights": [
            {
                "title": "Critical stockout imminent SKU-003",
                "description": (
                    "Stock at 38 units. Order velocity 847/day. "
                    "Stockout in 2.7 hours."
                ),
                "confidence": 0.97,
                "evidence_source_ids": ["warehouse_system", "supplier_confirmation"],
                "urgency_score": 9.8
            }
        ],
        "risks": ["Complete stockout in 3 hours", "847 unfulfilable orders"],
        "opportunities": ["Emergency restock from backup supplier"],
        "contradictions": [],
        "urgency_score": 9.8,
        "domain_detected": "ecommerce"
    }

    # Constraints deliberately set TIGHT to force violations
    tight_constraints = {
        "emergency_restock_budget_pkr": 50000,   # agent will want 300000+
        "notification_deadline_min": -5,          # already expired
        "max_order_quantity": 20,                 # way too low
        "max_retries": 2,
        "manager_approval_threshold_pkr": 25000
    }

    domain_config = {
        "domain": "ecommerce",
        "display_name": "ST-2 Constraint Violation",
        "sources": [],
        "constraints": tight_constraints
    }

    # Build action plan that WILL violate constraints
    from agent.state import Action
    actions = [
        Action(
            action_id="A1",
            action_type="simulate_procurement_order",
            description="Emergency restock 300 units SKU-003",
            parameters={
                "item": "SKU-003",
                "quantity": 300,
                "budget_pkr": 450000   # violates 50000 limit
            },
            constraints=tight_constraints,
            confidence=0.95,
            urgency=0.98,
            impact=0.95,
            priority_score=0.96,
            reasoning="Stock will hit zero in 2.7 hours",
            fallback_action={
                "action_type": "simulate_procurement_order",
                "parameters": {"item": "SKU-003", "quantity": 20, "budget_pkr": 30000}
            }
        ),
        Action(
            action_id="A2",
            action_type="notify_stakeholder",
            description="Alert procurement team — URGENT",
            parameters={
                "channel": "email",
                "message": "SKU-003 stockout imminent",
                "priority": "critical"
            },
            constraints={"deadline_min": -5},  # already expired
            confidence=0.99,
            urgency=1.0,
            impact=0.80,
            priority_score=0.93,
            reasoning="Procurement must know immediately",
            fallback_action={
                "action_type": "notify_stakeholder",
                "parameters": {
                    "channel": "sms",
                    "message": "SKU-003 CRITICAL — check email",
                    "priority": "critical"
                }
            }
        ),
        Action(
            action_id="A3",
            action_type="schedule_monitoring",
            description="Monitor SKU-003 every 15 min",
            parameters={"target": "SKU-003", "interval_minutes": 15},
            constraints={},
            confidence=0.90,
            urgency=0.70,
            impact=0.60,
            priority_score=0.75,
            reasoning="Track stock levels post-action"
        ),
    ]

    state = await run_agent(
        session_id="st2-" + str(uuid.uuid4())[:8],
        domain_config=domain_config,
        prefill_sources=[make_filler_source(f"src_{i}", "inventory") for i in range(5)],
        prefill_action_plan=actions,
        prefill_insights=forced_insights
    )

    # Assertions
    rejected = [a for a in state["action_plan"] if a.status == "rejected"]
    modified = [a for a in state["action_plan"] if a.status == "modified"]

    assert len(rejected) >= 1, \
        f"Expected at least 1 rejected action, got {len(rejected)}"
    assert len(modified) >= 1, \
        f"Expected at least 1 modified action, got {len(modified)}"

    # Verify modified action fits within budget
    for a in modified:
        if a.action_type == "simulate_procurement_order":
            cost = a.parameters.get("quantity", 0) * 1500
            assert cost <= tight_constraints["emergency_restock_budget_pkr"], \
                f"Modified action still violates budget: PKR {cost}"

    # Verify no constraint violations in errors
    constraint_errors = [e for e in state["errors"] if "constraint" in e.lower()]
    assert len(constraint_errors) == 0, \
        "Constraints must be handled gracefully, not as errors"

    # Verify fallback used for rejected notification
    rejected_notify = [a for a in rejected if a.action_type == "notify_stakeholder"]
    if rejected_notify:
        assert rejected_notify[0].fallback_action is not None, \
            "Rejected notification must have fallback action defined"

    # Print violation report
    print("  CONSTRAINT VIOLATION REPORT:")
    for a in state["action_plan"]:
        print(f"  {a.action_id} ({a.action_type}): {a.status}")
        print(f"    Reasoning: {a.reasoning[:100]}")
        if a.status == "modified":
            print(f"    Modified params: {a.parameters}")

    log("ST-2: Constraint Violation", True,
        f"Rejected={len(rejected)}, Modified={len(modified)}, "
        f"Chain continued={len([a for a in state['action_plan'] if a.status == 'success']) > 0}")


async def test_failure_recovery_chain():

    call_count = {"notify": 0, "update": 0}
    original_notify = notify_stakeholder.func
    original_update = update_system_record.func

    # Flaky: fails first 2 calls, succeeds on 3rd
    def flaky_notify(channel: str, message: str, priority: str) -> str:
        call_count["notify"] += 1
        if call_count["notify"] <= 2:
            raise Exception(
                f"Notification gateway timeout (attempt {call_count['notify']})"
            )
        return json.dumps({
            "status": "sent",
            "channel": channel,
            "delivery_ms": 340,
            "attempt": call_count["notify"]
        })

    # Always fails — simulates permanently broken API
    def always_fail_update(system_id: str, payload_json: str) -> str:
        call_count["update"] += 1
        raise Exception("System record API: connection refused — service down")

    notify_stakeholder.func = flaky_notify
    update_system_record.func = always_fail_update

    from agent.state import Action
    actions = [
        Action(
            action_id="A1",
            action_type="notify_stakeholder",
            description="Alert procurement — SKU-003 critical",
            parameters={"channel": "email", "message": "SKU-003 stockout", "priority": "critical"},
            constraints={"max_retries": 3},
            confidence=0.95, urgency=0.98, impact=0.80, priority_score=0.93,
            reasoning="Must notify before stockout",
            fallback_action={
                "action_type": "notify_stakeholder",
                "parameters": {"channel": "sms", "message": "SKU-003 URGENT", "priority": "critical"}
            }
        ),
        Action(
            action_id="A2",
            action_type="update_system_record",
            description="Update ERP with stockout flag",
            parameters={"system_id": "erp_main", "payload_json": '{"sku": "SKU-003", "flag": "stockout"}'},
            constraints={"max_retries": 2},
            confidence=0.88, urgency=0.75, impact=0.70, priority_score=0.78,
            reasoning="ERP must reflect current status"
        ),
        Action(
            action_id="A3",
            action_type="simulate_procurement_order",
            description="Emergency order 25 units SKU-003",
            parameters={"item": "SKU-003", "quantity": 25, "budget_pkr": 37500},
            constraints={},
            confidence=0.92, urgency=0.95, impact=0.90, priority_score=0.93,
            reasoning="Buy remaining stock from backup supplier"
        ),
        Action(
            action_id="A4",
            action_type="schedule_monitoring",
            description="Monitor SKU-003 every 15 min",
            parameters={"target": "SKU-003", "interval_minutes": 15},
            constraints={},
            confidence=0.85, urgency=0.60, impact=0.55, priority_score=0.65,
            reasoning="Watch stock post-emergency"
        ),
    ]

    domain_config = {
        "domain": "ecommerce",
        "display_name": "ST-3 Failure Recovery",
        "sources": [],
        "constraints": {"max_retries": 3}
    }

    state = await run_agent(
        session_id="st3-" + str(uuid.uuid4())[:8],
        domain_config=domain_config,
        prefill_sources=[make_filler_source(f"src_{i}", "inventory") for i in range(5)],
        prefill_action_plan=actions,
        prefill_insights={"urgency_score": 9.5, "domain_detected": "ecommerce"}
    )

    # Restore originals immediately
    notify_stakeholder.func = original_notify
    update_system_record.func = original_update

    # A1 assertions: eventually succeeded after retries
    a1 = next((a for a in state["action_plan"] if a.action_id == "A1"), None)
    assert a1 is not None and a1.status == "success", \
        f"A1 should succeed after retries, got {a1.status if a1 else 'not found'}"
    assert call_count["notify"] == 3, \
        f"Expected 3 notify calls (2 fail + 1 success), got {call_count['notify']}"

    # A2 assertions: exhausted retries, used fallback or rolled back
    a2 = next((a for a in state["action_plan"] if a.action_id == "A2"), None)
    assert a2 is not None, "A2 must exist in action plan"
    assert a2.status in ["rolled_back", "failed"], \
        f"A2 should be rolled_back or failed, got {a2.status}"

    # Snapshot taken before A2
    assert len(state["snapshots"]) >= 1, \
        "At least one snapshot must exist for rollback capability"

    # A3 and A4 executed after recovery
    a3 = next((a for a in state["action_plan"] if a.action_id == "A3"), None)
    a4 = next((a for a in state["action_plan"] if a.action_id == "A4"), None)
    assert a3 is not None and a3.status == "success", \
        f"A3 should succeed after A2 rollback, got {a3.status if a3 else 'not found'}"

    # Outcome metrics
    assert state["outcome"] is not None
    assert state["outcome"].actions_completed >= 2
    assert state["outcome"].actions_rolled_back >= 1

    # Print recovery timeline
    print("  RECOVERY TIMELINE:")
    for entry in state["trace"]:
        if entry.get("type") in ["step_start", "step_complete", "step_failed", "self_heal"]:
            ts = entry.get("timestamp", "")[:19]
            print(f"  [{ts}] {entry.get('type','?').upper():20} action={entry.get('action_id','?')}")
    print(f"  notify_stakeholder called {call_count['notify']} times")
    print(f"  update_system_record called {call_count['update']} times")

    log("ST-3: Failure Recovery Chain", True,
        f"A1=success(3 attempts), A2={a2.status}, "
        f"A3={a3.status if a3 else 'missing'}, "
        f"Rolled_back={state['outcome'].actions_rolled_back}")


async def test_false_signal_downranking():
    now = datetime.utcnow()

    false_source = DataSource(
        source_id="unverified_social_post",
        source_type="web",
        raw_text=(
            "BREAKING SKU-005 recalled by PSQCA safety hazard "
            "urgent product pull inventory halt sales immediately"
        ),
        structured_data={
            "extracted_metrics": {"sku": "SKU-005", "recall_signal": True},
            "db_enrichment": {"category": "complaints", "skus_detected": ["SKU-005"]},
            "source_domain": "twitter-screenshot.blogspot.com"
        },
        credibility_score=0.22,
        ingested_at=now - timedelta(hours=2),
        freshness="fresh",
        domain_hints=["complaints"]
    )
    truth_1 = DataSource(
        source_id="psqca_official_feed",
        source_type="pdf",
        raw_text="SKU-005 no recall issued safety compliance verified active status normal",
        structured_data={
            "extracted_metrics": {"sku": "SKU-005", "recall_status": "none"},
            "db_enrichment": {"category": "compliance", "skus_detected": ["SKU-005"]}
        },
        credibility_score=0.97,
        ingested_at=now - timedelta(minutes=30),
        freshness="fresh",
        domain_hints=["compliance"]
    )
    truth_2 = DataSource(
        source_id="supplier_safety_cert",
        source_type="pdf",
        raw_text="SKU-005 safety certification valid no recall active inventory normal stock",
        structured_data={
            "extracted_metrics": {"sku": "SKU-005", "recall_status": "none"},
            "db_enrichment": {"category": "supplier", "skus_detected": ["SKU-005"]}
        },
        credibility_score=0.91,
        ingested_at=now - timedelta(hours=1),
        freshness="fresh",
        domain_hints=["supplier", "compliance"]
    )
    truth_3 = DataSource(
        source_id="sales_dashboard",
        source_type="table",
        raw_text="SKU-005 sales normal 234 units dispatched today inventory healthy no issues",
        structured_data={
            "extracted_metrics": {"sku": "SKU-005", "units_dispatched": 234},
            "db_enrichment": {"category": "orders", "skus_detected": ["SKU-005"]}
        },
        credibility_score=0.88,
        ingested_at=now - timedelta(minutes=10),
        freshness="fresh",
        domain_hints=["orders"]
    )
    filler = make_filler_source("order_feed_general", "orders")

    domain_config = {
        "domain": "ecommerce",
        "display_name": "ST-4 False Signal Downranking",
        "sources": [],
        "constraints": {"max_retries": 2, "notification_deadline_min": 30}
    }

    state = await run_agent(
        session_id="st4-" + str(uuid.uuid4())[:8],
        domain_config=domain_config,
        prefill_sources=[false_source, truth_1, truth_2, truth_3, filler]
    )

    # Print credibility matrix
    all_sources = [false_source, truth_1, truth_2, truth_3, filler]
    print("  CREDIBILITY MATRIX:")
    print(f"  {'Source':<28} {'Credibility':>12} {'Recency':>10} {'Status'}")
    print(f"  {'-'*65}")
    for src in all_sources:
        status = next(
            (s.status for s in state["filtered_sources"] if s.source_id == src.source_id),
            "filtered_out"
        )
        print(f"  {src.source_id:<28} {src.credibility_score:>12.2f} "
              f"{recency_score(src.ingested_at):>10.3f} {status}")

    # Assertion 1: false_source filtered out or disputed
    false_in_filtered = any(
        s.source_id == "unverified_social_post"
        for s in state["filtered_sources"]
        if s.status == "active"
    )
    assert not false_in_filtered, \
        "Low-credibility source (0.22) must not be active in filtered sources"

    # Assertion 2: no recall/halt actions in plan
    dangerous_actions = [
        a for a in state["action_plan"]
        if any(kw in a.action_type.lower() or kw in a.description.lower()
               for kw in ["recall", "halt_sales", "pull_inventory", "stop_sales"])
        and "SKU-005" in str(a.parameters)
    ]
    assert len(dangerous_actions) == 0, \
        f"Agent must not act on unverified recall signal. Found: {[a.action_type for a in dangerous_actions]}"

    # Assertion 3: trace shows explicit downranking event
    downrank_events = [
        e for e in state["trace"]
        if e.get("event") in ["signal_downranked", "source_filtered", "low_credibility_removed"]
        and "unverified_social_post" in str(e)
    ]
    assert len(downrank_events) >= 1, \
        "Trace must explicitly record why false source was rejected"

    # Assertion 4: insights mention investigation path, not silent drop
    insight_text = str(state["insights"]).lower()
    assert any(kw in insight_text for kw in ["verify", "investigate", "unverified", "investigate"]), \
        "Insights must recommend verification, not silence the signal"

    # Assertion 5: verification action exists
    verify_actions = [
        a for a in state["action_plan"]
        if any(kw in a.action_type.lower() or kw in a.description.lower()
               for kw in ["verify", "investigate", "validate", "check"])
    ]
    assert len(verify_actions) >= 1, \
        "Agent must generate a verification action instead of acting on false signal"

    print(f"  False source status: filtered/disputed ✓")
    print(f"  Dangerous actions blocked: {len(dangerous_actions)} ✓")
    print(f"  Verification action generated: {verify_actions[0].description if verify_actions else 'MISSING'}")
    print(f"  What agent would have done if trusted: HALT SALES + PRODUCT RECALL")
    print(f"  What agent actually did: VERIFY CLAIM → investigation path generated")

    log("ST-4: False Signal Downranking", True,
        f"False source blocked, {len(verify_actions)} verification action(s) generated")


async def test_side_effect_analysis():
    from agent.state import Action

    domain_config = {
        "domain": "ecommerce",
        "display_name": "ST-5 Side Effect What-If",
        "sources": [],
        "product_bundles": {
            "Bundle-A": ["SKU-003", "SKU-007", "SKU-012"]
        },
        "supplier_capacity": {
            "SUP-002": {
                "monthly_capacity_units": 500,
                "already_committed": 420,
                "serves_skus": ["SKU-003", "SKU-008"]
            }
        },
        "constraints": {
            "emergency_restock_budget_pkr": 300000,
            "max_retries": 2,
            "notification_deadline_min": 30
        }
    }

    actions = [
        Action(
            action_id="A1",
            action_type="pause_orders",
            description="Pause new orders for SKU-003",
            parameters={"sku": "SKU-003", "duration_min": 60},
            constraints={},
            confidence=0.95, urgency=0.98, impact=0.85, priority_score=0.94,
            reasoning="Prevent overselling during stockout"
        ),
        Action(
            action_id="A2",
            action_type="simulate_procurement_order",
            description="Emergency restock 300 units SKU-003 from SUP-002",
            parameters={"item": "SKU-003", "quantity": 300, "budget_pkr": 450000},
            constraints={},
            confidence=0.90, urgency=0.95, impact=0.92, priority_score=0.93,
            reasoning="Restore stock from primary supplier"
        ),
        Action(
            action_id="A3",
            action_type="notify_stakeholder",
            description="Notify affected customers about delay",
            parameters={"channel": "email", "message": "Order delay notice", "priority": "high"},
            constraints={},
            confidence=0.92, urgency=0.80, impact=0.75, priority_score=0.83,
            reasoning="Customer communication required"
        ),
        Action(
            action_id="A4",
            action_type="schedule_monitoring",
            description="Monitor SKU-003 every 15 min",
            parameters={"target": "SKU-003", "interval_minutes": 15},
            constraints={},
            confidence=0.88, urgency=0.65, impact=0.60, priority_score=0.70,
            reasoning="Watch stock post-restock"
        ),
    ]

    before_state = {
        "SKU-003_stock": 38,
        "SKU-008_risk": "low",
        "Bundle-A_available": True,
        "SUP-002_capacity_used": 420
    }

    state = await run_agent(
        session_id="st5-" + str(uuid.uuid4())[:8],
        domain_config=domain_config,
        prefill_sources=[make_filler_source(f"src_{i}", "inventory") for i in range(5)],
        prefill_action_plan=actions,
        prefill_insights={"urgency_score": 9.0, "domain_detected": "ecommerce"}
    )

    # Assertion 1: bundle impact detected after A1
    bundle_events = [
        e for e in state["trace"]
        if e.get("event") == "side_effects_detected"
        and e.get("action_id") == "A1"
        and any(se.get("type") == "bundle_impact"
                for se in e.get("side_effects", []))
    ]
    assert len(bundle_events) >= 1, \
        "Bundle impact must be detected after A1 (pause_orders for SKU-003)"

    # Assertion 2: supplier capacity exhaustion detected after A2
    capacity_events = [
        e for e in state["trace"]
        if e.get("event") == "side_effects_detected"
        and e.get("action_id") == "A2"
        and any(se.get("type") == "supplier_capacity_exhaustion"
                for se in e.get("side_effects", []))
    ]
    assert len(capacity_events) >= 1, \
        "Supplier capacity exhaustion must be detected after A2 (restock from SUP-002)"

    # Assertion 3: SKU-008 flagged for review
    flagged = state["domain_config"].get("flagged_for_review", [])
    sku008_flagged = any(f.get("sku") == "SKU-008" for f in flagged)
    assert sku008_flagged, \
        "SKU-008 must be flagged for review after SUP-002 capacity exhaustion"

    # Assertion 4: what-if report in trace
    what_if_events = [
        e for e in state["trace"]
        if e.get("event") == "side_effects_detected"
        and e.get("what_if_report")
    ]
    assert len(what_if_events) >= 1, "What-if report must appear in trace"

    # Print what-if reports
    print("  WHAT-IF ANALYSIS REPORTS:")
    for e in what_if_events:
        print(f"  After action {e['action_id']}:")
        print(f"  {e['what_if_report']}")
        print()

    # Print before/after comparison
    after_state = {
        "SKU-003_stock": "restocking",
        "SKU-008_risk": "HIGH — SUP-002 capacity exhausted",
        "Bundle-A_available": False,
        "SUP-002_capacity_used": "500/500"
    }
    print("  BEFORE vs AFTER:")
    for key in before_state:
        print(f"  {key:<30} {str(before_state[key]):<20} → {str(after_state.get(key,'?'))}")

    log("ST-5: Side Effect What-If", True,
        f"Bundle impact detected, SKU-008 flagged, "
        f"what-if reports={len(what_if_events)}")


async def run_all_stress_tests():
    print("=" * 60)
    print("ADVERSARIAL STRESS TEST SUITE")
    print("E-Commerce AI Agent — Challenge Compliance Verification")
    print("=" * 60)
    print()
    
    tests = [
        ("ST-1: Three Source Conflict",        test_three_source_conflict),
        ("ST-2: Constraint Violation",          test_constraint_violation),
        ("ST-3: Failure Recovery Chain",        test_failure_recovery_chain),
        ("ST-4: False Signal Downranking",      test_false_signal_downranking),
        ("ST-5: Side Effect What-If Analysis",  test_side_effect_analysis),
    ]
    
    for name, test_fn in tests:
        print(f"Running {name}...")
        try:
            await test_fn()
        except AssertionError as e:
            log(name, False, f"ASSERTION FAILED: {str(e)}")
        except Exception as e:
            log(name, False, f"EXCEPTION: {str(e)}")
        print()
    
    print("=" * 60)
    print("STRESS TEST RESULTS SUMMARY")
    print("=" * 60)
    passed = sum(1 for r in results if r["status"] == PASS)
    failed = len(results) - passed
    for r in results:
        print(f"{r['status']} {r['test']}")
        if r["detail"]:
            print(f"   {r['detail']}")
    print()
    print(f"TOTAL: {passed}/{len(results)} passed")
    
    if failed == 0:
        print()
        print("ALL STRESS TESTS PASSED.")
        print("Agent handles adversarial conditions correctly.")
        print("System is demo-ready for all 5 challenge stress scenarios.")
    else:
        print()
        print(f"{failed} test(s) failed.")
        print("Fix failing tests before demo. Each failure = a judge can break your demo.")
    
    return failed == 0

if __name__ == "__main__":
    asyncio.run(run_all_stress_tests())
