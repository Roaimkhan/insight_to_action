"""
test_e2e.py
-----------
End-to-end integration test validating the autonomous agent state machine.
Directly executes the LangGraph orchestration flow and verifies all outcomes.
"""

import asyncio
import os
import sys

# Ensure current directory is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scenarios.supply_chain import get_supply_chain_scenario
from agent.graph import run_agent

async def main():
    print("==================================================")
    print("STARTING END-TO-END SYSTEM INTEGRATION TEST")
    print("==================================================")
    
    # 1. Load domain configuration
    domain_config = get_supply_chain_scenario()
    print(f"Loaded scenario: {domain_config['display_name']}")
    
    # 2. Run agent directly (not via HTTP API)
    session_id = "test-session-001"
    print(f"Executing agent state machine for session: {session_id}...")
    
    try:
        state = await run_agent(session_id, domain_config)
    except Exception as e:
        print(f"\n[FATAL ERROR] Agent execution failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    print("\nAGENT RUN COMPLETE. RUNNING STATUS ASSERTIONS...")
    
    # 3. Perform assertions
    try:
        assert len(state["raw_sources"]) == 5, f"Expected 5 raw sources, got {len(state['raw_sources'])}"
        assert len(state["filtered_sources"]) >= 1, f"Expected at least 1 filtered source, got {len(state['filtered_sources'])}"
        assert isinstance(state["insights"], dict) and state["insights"], "Expected non-empty insights dictionary"
        assert len(state["action_plan"]) >= 3, f"Expected at least 3 actions in plan, got {len(state['action_plan'])}"
        assert state["outcome"] is not None, "Expected metrics outcome to be populated"
        assert len(state["trace"]) >= 7, f"Expected at least 7 trace entries, got {len(state['trace'])}"
        print("\n>>> ALL E2E ASSERTIONS PASSED SUCCESSFULLY! <<<\n")
    except AssertionError as e:
        print(f"\n[ASSERTION FAILURE] {str(e)}")
        sys.exit(1)
        
    # 4. Print Summary
    raw_count = len(state["raw_sources"])
    contradictions_count = len(state["contradictions"])
    plan_count = len(state["action_plan"])
    successes = sum(1 for a in state["action_plan"] if a.status == "success")
    trace_count = len(state["trace"])
    outcome = state["outcome"]
    
    print("==================================================")
    print("OPERATIONAL RUN SUMMARY")
    print("==================================================")
    print(f"- Sources Ingested:       {raw_count}")
    print(f"- Contradictions Found:   {contradictions_count}")
    print(f"- Actions In Plan:        {plan_count}")
    print(f"- Actions Succeeded:      {successes}")
    print(f"- Total Trace Entries:    {trace_count}")
    print("\nImpact Metrics Outcome:")
    print(f"  * Cost (USD):           ${outcome.cost_usd}")
    print(f"  * Total Latency (ms):   {outcome.total_latency_ms}ms")
    print(f"  * Risk Delta:           {outcome.risk_delta}")
    print(f"  * Completed Actions:    {outcome.actions_completed}")
    print(f"  * Failed Actions:       {outcome.actions_failed}")
    print(f"  * Rolled Back Actions:  {outcome.actions_rolled_back}")
    print("==================================================")

if __name__ == "__main__":
    # Configure key placeholder if missing to allow standard imports
    if "GOOGLE_API_KEY" not in os.environ and "GEMINI_API_KEY" not in os.environ:
        os.environ["GOOGLE_API_KEY"] = "mock_key"
        
    asyncio.run(main())
