"""
agent/side_effect_analyzer.py
------------------------------
Analyzes downstream consequences of each executed action using domain_config metadata.
Detects bundle cascades, supplier capacity exhaustion, and other multi-SKU ripple effects.
"""


class SideEffectAnalyzer:

    def analyze(self, action, domain_config: dict) -> list[dict]:
        side_effects = []
        bundles = domain_config.get("product_bundles", {})
        supplier_capacity = domain_config.get("supplier_capacity", {})

        if action.action_type in ["pause_orders", "halt_sales"]:
            paused_sku = action.parameters.get("sku")
            if paused_sku:
                for bundle_id, skus in bundles.items():
                    if paused_sku in skus:
                        other_skus = [s for s in skus if s != paused_sku]
                        side_effects.append({
                            "type": "bundle_impact",
                            "action_id": action.action_id,
                            "affected_entity": bundle_id,
                            "impact": f"Pausing {paused_sku} makes {bundle_id} unavailable",
                            "also_affects": other_skus,
                            "severity": "medium",
                            "what_if": f"If {paused_sku} paused: {bundle_id} revenue lost",
                            "mitigation": "Consider partial fulfillment or bundle substitution"
                        })

        if action.action_type == "simulate_procurement_order":
            order_qty = action.parameters.get("quantity", 0)
            ordered_sku = action.parameters.get("item", "")
            for supplier_id, cap in supplier_capacity.items():
                if any(sku in ordered_sku for sku in cap.get("serves_skus", [])):
                    remaining = (cap["monthly_capacity_units"]
                                - cap["already_committed"]
                                - order_qty)
                    affected = [s for s in cap["serves_skus"] if s not in ordered_sku]
                    if remaining < 100 and affected:
                        side_effects.append({
                            "type": "supplier_capacity_exhaustion",
                            "action_id": action.action_id,
                            "supplier_id": supplier_id,
                            "impact": (
                                f"Order of {order_qty} units leaves only "
                                f"{remaining} units capacity. Affects: {affected}"
                            ),
                            "also_affects": affected,
                            "severity": "high" if remaining < 0 else "medium",
                            "what_if": f"If order proceeds: {affected} cannot restock this month",
                            "mitigation": (
                                f"Split order with backup supplier or reduce "
                                f"quantity to preserve capacity for {affected}"
                            )
                        })
        return side_effects

    def generate_what_if_report(self, side_effects: list[dict]) -> str:
        if not side_effects:
            return "No side effects detected."
        lines = ["WHAT-IF ANALYSIS:"]
        for se in side_effects:
            lines.append(f"  ⚠ {se['type'].upper()}")
            lines.append(f"    Impact:     {se['impact']}")
            lines.append(f"    What-if:    {se['what_if']}")
            lines.append(f"    Mitigation: {se['mitigation']}")
            lines.append(f"    Severity:   {se['severity']}")
        return "\n".join(lines)
