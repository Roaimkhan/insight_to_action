"""Test TemporalEngine"""
import asyncio
import sys
sys.path.insert(0, '/home/roaim/Desktop/ai seekho/backend')

from agent.temporal_engine import TemporalEngine
from agent.context_enricher import ContextEnricher
from agent.state import DataSource
from datetime import datetime

async def main():
    print("=== Testing TemporalEngine ===")
    enricher = ContextEnricher()
    
    # We know SKU-003 has a demand spike and SKU-007 has a complaint spike.
    # Let's create mock sources to trigger enrichment for them.
    
    src1 = DataSource(
        source_id="S1", source_type="csv",
        raw_text="SKU-003 order and inventory log",
        credibility_score=1.0, ingested_at=datetime.now(),
        freshness="fresh", domain_hints=[]
    )
    src2 = DataSource(
        source_id="S2", source_type="csv",
        raw_text="SKU-007 complaints report",
        credibility_score=1.0, ingested_at=datetime.now(),
        freshness="fresh", domain_hints=[]
    )
    
    enriched_sources = await asyncio.gather(
        enricher.enrich(src1),
        enricher.enrich(src2)
    )
    
    engine = TemporalEngine()
    signals = engine.detect_all_signals(list(enriched_sources))
    
    for sig in signals:
        print(f"Detected: {sig['signal_type']} on {sig['sku']}")
        print(f"  -> {sig['interpretation']}")
        print(f"  -> Urgency: {sig['urgency']}")
        print()

if __name__ == "__main__":
    asyncio.run(main())
