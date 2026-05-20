"""
agent/temporal_engine.py
-------------------------
Evaluates time-series data from enriched DataSources to detect
temporal signals like demand spikes, complaint spikes, and inventory
declines based on 7-day recent vs 90-day baseline comparisons.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.state import DataSource


class TemporalEngine:
    """
    Detects temporal signals using DB history attached to DataSources.
    """

    SIGNAL_TYPES = {
        "demand_spike": {
            "query": "get_order_velocity",
            "threshold_multiplier": 1.5,  # 50% above baseline
            "direction": "up",
            "urgency": "high"
        },
        "inventory_decline": {
            "query": "get_inventory_trend",
            "threshold_pct": 0.30,        # below 30% threshold
            "direction": "down",
            "urgency": "critical"
        },
        "complaint_spike": {
            "query": "get_complaint_rate",
            "threshold_multiplier": 2.0,  # 2x baseline
            "direction": "up",
            "urgency": "high"
        },
        "supplier_degradation": {
            "query": "get_supplier_performance",
            "threshold_rate": 0.70,       # < 70%
            "direction": "down",
            "urgency": "medium"
        },
        "price_drift": {
            "query": "get_price_comparison",
            "threshold_variance_pct": 0.10, # >10% variance
            "direction": "diverging",
            "urgency": "medium"
        }
    }

    def detect_all_signals(self, sources: list["DataSource"]) -> list[dict]:
        """
        For each enriched source, check its historical context for temporal signals.
        Returns list of detected signals with direction, velocity, and urgency.
        """
        signals = []

        for source in sources:
            if not source.structured_data:
                continue
            enrichment = source.structured_data.get("db_enrichment", {})
            historical = enrichment.get("historical_context", {})

            for sku, context in historical.items():
                if sku == "_global":
                    continue
                
                baseline = context.get("baseline", {})
                history = context.get("history", [])

                if not baseline or not history:
                    continue

                # Check each signal type
                for signal_type, config in self.SIGNAL_TYPES.items():
                    signal = self._check_signal(
                        sku, signal_type, config, history, baseline
                    )
                    if signal:
                        signals.append(signal)

        return signals

    def _check_signal(self, sku: str, signal_type: str, config: dict, history: list, baseline: dict) -> dict | None:
        if not history or not isinstance(history, list):
            return None

        # Extract recent values from the last 7 rows
        recent_values = []
        for row in history[-7:]:
            if not isinstance(row, dict):
                continue
            
            val = None
            # Extract metric specific to the signal type's expected query
            expected_query = config.get("query")
            
            if expected_query == "get_order_velocity":
                val = row.get("order_count")
            elif expected_query == "get_inventory_trend":
                val = row.get("units_available")
            elif expected_query == "get_complaint_rate":
                val = row.get("complaint_count")
            elif expected_query == "get_price_comparison":
                val = row.get("effective_price")
            elif expected_query == "get_supplier_performance":
                val = row.get("fulfillment_rate")
            
            if val is None:
                # This history doesn't contain the required metric for this signal type
                return None
            
            try:
                recent_values.append(float(val))
            except (ValueError, TypeError):
                pass
                
        if not recent_values:
            return None

        recent_avg = sum(recent_values) / len(recent_values)
        
        # Use known baseline keys from get_baseline_metrics based on expected query
        baseline_avg = recent_avg
        if expected_query == "get_order_velocity":
            baseline_avg = float(baseline.get("avg_orders_per_day", recent_avg))
        elif expected_query == "get_complaint_rate":
            baseline_avg = float(baseline.get("avg_complaints_per_day", recent_avg))
        elif expected_query == "get_inventory_trend":
            # For inventory, the baseline doesn't return avg_inventory, it returns order rate.
            # But the user's code expects some baseline. We'll compare against max of history.
            try:
                max_hist = max(float(r.get("units_available", 0)) for r in history if isinstance(r, dict))
                baseline_avg = max_hist if max_hist > 0 else recent_avg
            except Exception:
                pass

        if baseline_avg == 0:
            return None

        change_pct = (recent_avg - baseline_avg) / baseline_avg

        threshold = config.get("threshold_multiplier",
                    config.get("threshold_pct",
                    config.get("threshold_rate", 0.5))) - 1.0

        if config.get("direction") == "down":
            # For inventory_decline, user code checks if recent is below pct of baseline (max)
            if "threshold_pct" in config:
                threshold = config["threshold_pct"]
                # change_pct doesn't make sense if threshold is absolute pct of max
                # E.g. recent_avg < 0.30 * max
                if recent_avg < threshold * baseline_avg:
                    velocity = (recent_avg - baseline_avg) / baseline_avg / 7.0
                    return self._format_signal(sku, signal_type, config, recent_avg, baseline_avg, change_pct, velocity)
                return None

        if abs(change_pct) > abs(threshold):
            # Check direction if required
            if config.get("direction") == "up" and change_pct <= 0:
                return None
            if config.get("direction") == "down" and change_pct >= 0:
                return None

            velocity = change_pct / 7.0  # change per day
            return self._format_signal(sku, signal_type, config, recent_avg, baseline_avg, change_pct, velocity)
            
        return None

    def _format_signal(self, sku, signal_type, config, recent_avg, baseline_avg, change_pct, velocity):
        return {
            "signal_type": signal_type,
            "sku": sku,
            "direction": "up" if change_pct > 0 else "down",
            "change_pct": round(change_pct * 100, 1),
            "velocity_per_day": round(velocity * 100, 2),
            "recent_avg": round(recent_avg, 2),
            "baseline_avg": round(baseline_avg, 2),
            "urgency": config["urgency"],
            "interpretation": (
                f"{sku}: {signal_type.replace('_', ' ')} detected. "
                f"Current {recent_avg:.1f} vs baseline {baseline_avg:.1f} "
                f"({change_pct*100:+.1f}% change, "
                f"{velocity*100:+.2f}%/day velocity)"
            )
        }
