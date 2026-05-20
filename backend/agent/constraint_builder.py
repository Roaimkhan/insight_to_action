"""
agent/constraint_builder.py
----------------------------
Builds operational constraints dynamically from what the ingested
DataSources contain, rather than relying on hardcoded scenario configs.

Priority order (lowest → highest):
  ECOMMERCE_DEFAULTS → category-derived constraints → domain_config overrides
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.state import DataSource


class DynamicConstraintBuilder:
    """
    Derives a complete constraint dictionary from enriched DataSources.

    All constraint values are drawn either from sensible e-commerce defaults
    or from signals detected inside the source content — no scenario names
    or hardcoded trigger strings anywhere.
    """

    ECOMMERCE_DEFAULTS: dict = {
        # Budget & spending
        "emergency_restock_budget_pkr":   500_000,
        "manager_approval_threshold_pkr": 100_000,
        "price_change_approval_pkr":       10_000,
        "max_discount_pct":                    35,

        # Time deadlines (minutes unless noted)
        "notification_deadline_min":           30,
        "cancellation_deadline_min":          120,
        "max_order_pause_duration_min":        60,
        "price_sync_deadline_min":             90,   # overridden if pricing detected
        "supplier_contact_deadline_hrs":        4,
        "refund_processing_deadline_hrs":      48,

        # Retry / reliability
        "max_retries":                          2,

        # Inventory
        "restock_lead_time_days":               5,
        "min_safety_stock":                   150,

        # Pricing
        "competitor_match_allowed":         False,
    }

    # ── Public API ────────────────────────────────────────────────────

    def build(self, sources: list["DataSource"]) -> dict:
        """
        Build a merged constraint dict from enriched sources.

        Algorithm:
          1. Start with ECOMMERCE_DEFAULTS.
          2. For each enriched source, check its db_enrichment category.
          3. Apply category-specific overrides based on signals in the data.
          4. Return the merged dict (caller is responsible for applying
             domain_config overrides on top).
        """
        constraints = self.ECOMMERCE_DEFAULTS.copy()

        for source in sources:
            if not source.structured_data:
                continue
            enrichment = source.structured_data.get("db_enrichment", {})
            category   = enrichment.get("category", "unknown")
            hist_ctx   = enrichment.get("historical_context", {})

            # ── Inventory signals ─────────────────────────────────────
            if category == "inventory":
                constraints["restock_lead_time_days"] = 3
                constraints["min_safety_stock"]       = 100

                # If ghost stock detected → tighten approval
                ghost = hist_ctx.get("_global", {}).get("contradiction_candidates", [])
                if isinstance(ghost, list) and len(ghost) > 0:
                    constraints["manager_approval_threshold_pkr"] = 50_000

            # ── Complaint signals ─────────────────────────────────────
            elif category == "complaints":
                # Count high/critical severity rows in sample data if present
                sample_rows = source.structured_data.get("sample_rows", [])
                high_severity = sum(
                    1 for row in sample_rows
                    if isinstance(row, dict) and row.get("severity") in ("high", "critical")
                )
                if high_severity > 5:
                    constraints["notification_deadline_min"]      = 15
                    constraints["manager_approval_threshold_pkr"] = 50_000

                # Spike candidates from db → tighten refund deadline
                spikes = hist_ctx.get("_global", {}).get("spike_candidates", [])
                if isinstance(spikes, list) and len(spikes) > 0:
                    constraints["refund_processing_deadline_hrs"] = 24

            # ── Pricing signals ───────────────────────────────────────
            elif category == "pricing":
                constraints["price_sync_deadline_min"]    = 60
                constraints["competitor_match_allowed"]   = True

                # Price contradiction detected → emergency sync budget
                contradictions = hist_ctx.get("_global", {}).get("contradiction_candidates", [])
                if isinstance(contradictions, list) and len(contradictions) > 0:
                    constraints["price_change_approval_pkr"] = 5_000   # lower threshold

            # ── Supplier signals ──────────────────────────────────────
            elif category == "supplier":
                overdue = hist_ctx.get("_global", {}).get("overdue_suppliers", [])
                if isinstance(overdue, list) and len(overdue) > 0:
                    # Overdue supplier → shrink contact deadline, increase budget
                    constraints["supplier_contact_deadline_hrs"]  = 2
                    constraints["emergency_restock_budget_pkr"]   = 750_000

            # ── Order signals ─────────────────────────────────────────
            elif category == "orders":
                anomalies = hist_ctx.get("_global", {}).get("anomaly_candidates", [])
                if isinstance(anomalies, list) and len(anomalies) > 0:
                    # Demand spike → shorten order-pause window
                    constraints["max_order_pause_duration_min"] = 30
                    constraints["emergency_restock_budget_pkr"] = 600_000

        return constraints
