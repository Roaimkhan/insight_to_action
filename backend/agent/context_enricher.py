"""
agent/context_enricher.py
--------------------------
Enriches every ingested DataSource with historical context pulled
from the mock SQLite database. Connects fresh user uploads to the
90-day store history so the agent can detect deviations dynamically.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import database.queries as queries
from agent.source_classifier import SourceClassifier

if TYPE_CHECKING:
    from agent.state import DataSource


class ContextEnricher:
    """
    Pipeline step that runs after raw ingestion and before analysis.

    For every DataSource it:
      1. Classifies the category (inventory/orders/complaints/supplier/pricing)
      2. Extracts any SKU identifiers present in the text
      3. Queries the SQLite database for historical baseline metrics
      4. Appends a ``db_enrichment`` key to source.structured_data
      5. Adds detected category tags to source.domain_hints
    """

    def __init__(self) -> None:
        self.classifier = SourceClassifier()

    # ── Public entry point ─────────────────────────────────────────────

    async def enrich(self, source: "DataSource") -> "DataSource":
        """
        Enrich a single DataSource with database context.

        All SQLite queries run in a thread-pool executor so they
        don't block the asyncio event loop.
        """
        category = self.classifier.classify(source)
        skus = self.classifier.extract_skus(source)
        enrichment_map = self.classifier.get_enrichment_query(category, skus)

        db_context: dict = {}

        if enrichment_map:
            # Limit to 5 SKUs per source to keep response sizes reasonable
            target_skus = skus[:5] if skus else []

            # Build all async tasks
            tasks = []
            task_keys: list[tuple[str, str]] = []   # (sku, context_key)

            for sku in target_skus:
                if "query" in enrichment_map:
                    fn_name = enrichment_map["query"]
                    tasks.append(self._run_sku_query(fn_name, sku, days=30))
                    task_keys.append((sku, "history"))

                if "baseline" in enrichment_map:
                    tasks.append(self._run_sku_query("get_baseline_metrics", sku))
                    task_keys.append((sku, "baseline"))

            # Global (non-SKU) checks
            global_tasks: list[tuple[str, str]] = []

            if "contradiction_check" in enrichment_map:
                global_tasks.append(
                    (enrichment_map["contradiction_check"], "contradiction_candidates")
                )
            if "anomaly_check" in enrichment_map:
                global_tasks.append(
                    (enrichment_map["anomaly_check"], "anomaly_candidates")
                )
            if "spike_check" in enrichment_map:
                global_tasks.append(
                    (enrichment_map["spike_check"], "spike_candidates")
                )
            if "overdue_check" in enrichment_map:
                global_tasks.append(
                    (enrichment_map["overdue_check"], "overdue_suppliers")
                )

            # Run all per-SKU queries concurrently
            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for (sku, ctx_key), result in zip(task_keys, results):
                    if sku not in db_context:
                        db_context[sku] = {}
                    db_context[sku][ctx_key] = (
                        result if not isinstance(result, Exception)
                        else {"error": str(result)}
                    )

            # Run all global queries concurrently
            if global_tasks:
                global_fn_names = [t[0] for t in global_tasks]
                global_ctx_keys = [t[1] for t in global_tasks]
                global_results = await asyncio.gather(
                    *[self._run_global_query(fn) for fn in global_fn_names],
                    return_exceptions=True
                )
                global_context: dict = {}
                for ctx_key, result in zip(global_ctx_keys, global_results):
                    global_context[ctx_key] = (
                        result if not isinstance(result, Exception)
                        else {"error": str(result)}
                    )
                db_context["_global"] = global_context

        # ── Write enrichment payload into source ──────────────────────
        if source.structured_data is None:
            source.structured_data = {}

        source.structured_data["db_enrichment"] = {
            "category":           category,
            "skus_detected":      skus,
            "historical_context": db_context,
            "enriched_at":        datetime.now(timezone.utc).isoformat(),
        }

        # Merge category tags into domain_hints (deduplicated)
        new_hints = list(dict.fromkeys(
            source.domain_hints + [category, "ecommerce"]
        ))
        source.domain_hints = new_hints

        return source

    # ── Internal helpers ───────────────────────────────────────────────

    async def _run_sku_query(self, fn_name: str, sku: str, **kwargs):
        """Run a single-SKU query function in the thread-pool."""
        loop = asyncio.get_event_loop()
        fn = getattr(queries, fn_name)

        def _call():
            # Functions that accept (sku, days) vs. (sku) only
            try:
                return fn(sku, **kwargs)
            except TypeError:
                return fn(sku)

        return await loop.run_in_executor(None, _call)

    async def _run_global_query(self, fn_name: str):
        """Run a no-argument global query function in the thread-pool."""
        loop = asyncio.get_event_loop()
        fn = getattr(queries, fn_name)
        return await loop.run_in_executor(None, fn)
