"""
agent/source_classifier.py
--------------------------
Auto-detects the e-commerce category of any uploaded DataSource using
keyword scoring, extracts SKU identifiers, and maps each category to
the correct database enrichment queries.

No hardcoded scenario names — works on any e-commerce data the user uploads.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.state import DataSource


class SourceClassifier:
    """
    Classifies an ingested DataSource into one of five e-commerce
    categories by scoring keyword presence in the source's raw text.
    """

    ECOMMERCE_SIGNALS: dict[str, list[str]] = {
        "inventory": [
            "sku", "stock", "units", "warehouse", "inventory",
            "available", "quantity", "reorder",
        ],
        "orders": [
            "order", "purchase", "sale", "revenue", "transaction",
            "checkout", "customer", "dispatch",
        ],
        "complaints": [
            "complaint", "return", "refund", "issue", "problem",
            "review", "rating", "negative", "defective",
        ],
        "supplier": [
            "supplier", "vendor", "delivery", "shipment", "lead time",
            "procurement", "wholesale", "manufacturer",
        ],
        "pricing": [
            "price", "discount", "offer", "pkr", "cost", "margin",
            "competitor", "sale price", "mrp",
        ],
    }

    # ── Classification ────────────────────────────────────────────────

    def classify(self, source: "DataSource") -> str:
        """
        Detect the e-commerce category of a source from its raw text.

        Scoring: count how many category keywords appear in the lowercased
        raw_text, then pick the highest scorer.

        Returns:
            One of "inventory" | "orders" | "complaints" |
            "supplier" | "pricing" | "unknown"
        """
        text_lower = source.raw_text.lower()
        scores: dict[str, int] = {}

        for category, keywords in self.ECOMMERCE_SIGNALS.items():
            scores[category] = sum(1 for kw in keywords if kw in text_lower)

        best = max(scores, key=scores.get)  # type: ignore[arg-type]
        return best if scores[best] > 0 else "unknown"

    # ── SKU extraction ────────────────────────────────────────────────

    def extract_skus(self, source: "DataSource") -> list[str]:
        """
        Extract SKU identifiers from source content.

        Primary pattern  : SKU-XXX (e.g. SKU-003, SKU-012)
        Generic fallback : 2–4 uppercase letters + hyphen + 3–6 digits
                           (e.g. PROD-00145, IT-9923)
        """
        pattern = r"\b[A-Z]{2,4}-\d{3,6}\b"
        found = re.findall(pattern, source.raw_text.upper())
        return list(dict.fromkeys(found))   # deduplicate, preserve order

    # ── Enrichment query map ──────────────────────────────────────────

    def get_enrichment_query(
        self, category: str, detected_skus: list[str]
    ) -> dict:
        """
        Return the set of database query function names to execute for
        this category so that the ContextEnricher knows what historical
        baseline to pull.

        All values are names of functions exported from database.queries.
        """
        enrichment_map: dict[str, dict] = {
            "inventory": {
                "query": "get_inventory_trend",
                "baseline": "get_baseline_metrics",
                "contradiction_check": "get_ghost_stock_candidates",
            },
            "orders": {
                "query": "get_order_velocity",
                "baseline": "get_baseline_metrics",
                "anomaly_check": "get_anomalous_skus",
            },
            "complaints": {
                "query": "get_complaint_rate",
                "baseline": "get_baseline_metrics",
                "spike_check": "get_anomalous_skus",
            },
            "supplier": {
                "query": "get_supplier_performance",
                "overdue_check": "get_overdue_suppliers",
            },
            "pricing": {
                "query": "get_price_comparison",
                "contradiction_check": "get_price_contradictions",
            },
        }
        return enrichment_map.get(category, {})
