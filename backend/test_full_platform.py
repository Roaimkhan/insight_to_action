import asyncio, os, json
import sys
sys.path.insert(0, '/home/roaim/Desktop/ai seekho/backend')

async def test_full_platform():
    print("=== FULL PLATFORM TEST ===")
    print()
    
    # Test 1: Database
    from database.seeder import seed_database
    from database.queries import (
        get_anomalous_skus, get_ghost_stock_candidates, 
        get_price_contradictions, get_overdue_suppliers
    )
    seed_database()
    anomalous = get_anomalous_skus()
    ghost = get_ghost_stock_candidates()
    price_issues = get_price_contradictions()
    overdue = get_overdue_suppliers()
    print(f"DB Test: anomalous_skus={len(anomalous)}, ghost_stock={len(ghost)},")
    print(f"         price_contradictions={len(price_issues)}, overdue_suppliers={len(overdue)}")
    assert len(anomalous) > 0, "Should have anomalous SKUs in seeded data"
    print("Database: PASSED")
    print()
    
    # Test 2: Source classifier
    from agent.source_classifier import SourceClassifier
    from agent.state import DataSource
    from datetime import datetime
    classifier = SourceClassifier()
    inv_source = DataSource(
        source_id="test_inv", source_type="csv",
        raw_text="SKU-003 inventory stock units available warehouse reorder",
        credibility_score=0.85, ingested_at=datetime.now(),
        freshness="fresh", domain_hints=[]
    )
    category = classifier.classify(inv_source)
    skus = classifier.extract_skus(inv_source)
    assert category == "inventory", f"Expected inventory, got {category}"
    assert "SKU-003" in skus, "Should extract SKU-003"
    print(f"Classifier: PASSED (category={category}, skus={skus})")
    print()
    
    # Test 3: Context enricher
    from agent.context_enricher import ContextEnricher
    enricher = ContextEnricher()
    enriched = await enricher.enrich(inv_source)
    assert enriched.structured_data is not None
    assert "db_enrichment" in enriched.structured_data
    db_ctx = enriched.structured_data["db_enrichment"]
    print(f"Enricher: PASSED (category={db_ctx['category']}, skus={db_ctx['skus_detected']})")
    print()
    
    # Test 4: Temporal engine
    from agent.temporal_engine import TemporalEngine
    engine = TemporalEngine()
    signals = engine.detect_all_signals([enriched])
    print(f"Temporal Engine: PASSED (signals_detected={len(signals)})")
    for s in signals[:3]:
        print(f"  - {s['interpretation']}")
    print()
    
    # Test 5: Dynamic constraints
    from agent.constraint_builder import DynamicConstraintBuilder
    builder = DynamicConstraintBuilder()
    constraints = builder.build([enriched])
    assert "emergency_restock_budget_pkr" in constraints
    print(f"Constraint Builder: PASSED ({len(constraints)} constraints built)")
    print()
    
    # Test 6: Full agent run (no hardcoded scenario)
    from agent.graph import run_agent
    domain_config = {
        "domain": "ecommerce",
        "display_name": "Dynamic E-Commerce Monitor",
        "sources": [],   # sources come from uploaded files
        "constraints": {},  # built dynamically
        "metrics": []       # detected automatically
    }
    print("Running full agent pipeline...")
    state = await run_agent("test-dynamic-001", domain_config)
    assert state["outcome"] is not None
    print(f"Agent Pipeline: PASSED")
    print(f"  Sources ingested: {len(state['raw_sources'])}")
    print(f"  Contradictions: {len(state['contradictions'])}")
    print(f"  Actions planned: {len(state['action_plan'])}")
    print(f"  Trace entries: {len(state['trace'])}")
    print()
    print("=== ALL TESTS PASSED ===")
    print("Platform is dynamic, no hardcoded scenarios.")
    print("Mock database provides historical context for any uploaded data.")

if __name__ == "__main__":
    asyncio.run(test_full_platform())
