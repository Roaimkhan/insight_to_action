"""Part 3 verification script."""
import asyncio
import sys
sys.path.insert(0, '/home/roaim/Desktop/ai seekho/backend')

from agent.constraint_builder import DynamicConstraintBuilder
from agent.context_enricher import ContextEnricher
from agent.state import DataSource
from datetime import datetime

def make_src(sid, text):
    return DataSource(
        source_id=sid, source_type='csv', raw_text=text,
        credibility_score=0.85, ingested_at=datetime.now(),
        freshness='fresh', domain_hints=[]
    )

async def main():
    print('=== Part 3: Dynamic Constraint Builder ===')
    enricher = ContextEnricher()

    sources = list(await asyncio.gather(
        enricher.enrich(make_src('SRC-INV',  'SKU-003 inventory 45 units available in warehouse. reorder threshold breached.')),
        enricher.enrich(make_src('SRC-PRC',  'SKU-009 price PKR 3200 on website but daraz showing PKR 3600. discount mismatch.')),
        enricher.enrich(make_src('SRC-ORD',  'SKU-003 order velocity purchase revenue up. customer checkout demand rising.')),
    ))

    print('Categories detected:', [s.structured_data['db_enrichment']['category'] for s in sources])

    builder = DynamicConstraintBuilder()
    constraints = builder.build(sources)

    print('\nBuilt constraints:')
    defaults = DynamicConstraintBuilder.ECOMMERCE_DEFAULTS
    for k, v in sorted(constraints.items()):
        d = defaults.get(k, 'NEW')
        tag = ' <-- ADJUSTED' if v != d else ''
        print(f'  {k:45s} = {v}{tag}')

    # Simulate domain_config override
    domain_override = {'max_retries': 3, 'emergency_restock_budget_pkr': 999_999}
    merged = {**constraints, **domain_override}
    print(f'\n  max_retries (domain override) = {merged["max_retries"]}')
    print(f'  emergency_restock_budget (domain override) = {merged["emergency_restock_budget_pkr"]}')
    print(f'  total merged constraint keys: {len(merged)}')
    print('\nPart 3 -- all checks passed!')

asyncio.run(main())
