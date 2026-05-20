"""
queries.py — All analytical query functions for the e-commerce AI agent platform.
All functions return list[dict] or dict (for single-record returns).
"""

import math
from datetime import datetime, timedelta, timezone
from .schema import get_connection

NOW = datetime.now(timezone.utc)


def _rows(cur) -> list[dict]:
    """Convert cursor results to list of plain dicts."""
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _cutoff(days: int) -> str:
    """ISO 8601 timestamp for N days ago."""
    return (NOW - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Core query functions ──────────────────────────────────────────────────────

def get_order_velocity(sku: str, days: int) -> list[dict]:
    """Orders per day for a SKU over last N days."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            date(order_timestamp) AS order_date,
            COUNT(*)              AS order_count,
            SUM(quantity)         AS units_sold,
            SUM(total_pkr)        AS revenue_pkr
        FROM order_history
        WHERE sku = ?
          AND order_timestamp >= ?
        GROUP BY date(order_timestamp)
        ORDER BY order_date ASC
    """, (sku, _cutoff(days)))
    result = _rows(cur)
    conn.close()
    return result


def get_inventory_trend(sku: str, days: int) -> list[dict]:
    """Daily inventory snapshots for a SKU over last N days."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            date(recorded_at)    AS snapshot_date,
            units_available,
            units_reserved,
            last_physical_count,
            reorder_threshold,
            warehouse_location,
            supplier_id
        FROM inventory_log
        WHERE sku = ?
          AND recorded_at >= ?
        ORDER BY snapshot_date ASC
    """, (sku, _cutoff(days)))
    result = _rows(cur)
    conn.close()
    return result


def get_complaint_rate(sku: str, days: int) -> list[dict]:
    """Complaints per day grouped by complaint type for a SKU."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            date(submitted_at) AS complaint_date,
            complaint_type,
            severity,
            COUNT(*)           AS complaint_count
        FROM complaint_log
        WHERE sku = ?
          AND submitted_at >= ?
        GROUP BY date(submitted_at), complaint_type
        ORDER BY complaint_date ASC
    """, (sku, _cutoff(days)))
    result = _rows(cur)
    conn.close()
    return result


def get_supplier_performance(supplier_id: str) -> dict:
    """Full supplier record with calculated fulfillment metrics."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT *,
               CASE WHEN total_orders_placed > 0
                    THEN ROUND(CAST(total_orders_fulfilled AS REAL)
                               / total_orders_placed, 4)
                    ELSE 0
               END AS fulfillment_rate
        FROM supplier_records
        WHERE supplier_id = ?
    """, (supplier_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return {}
    return dict(zip([d[0] for d in cur.description], row)) if row else {}


def get_price_comparison(sku: str) -> list[dict]:
    """All current (non-expired) prices for a SKU across channels."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            channel,
            price_pkr,
            discount_pct,
            ROUND(price_pkr * (1 - discount_pct / 100.0), 2) AS effective_price,
            effective_from,
            effective_to,
            set_by
        FROM price_history
        WHERE sku = ?
          AND (effective_to IS NULL OR effective_to >= ?)
        ORDER BY channel ASC
    """, (sku, NOW.strftime("%Y-%m-%dT%H:%M:%SZ")))
    result = _rows(cur)
    conn.close()
    return result


def get_baseline_metrics(sku: str) -> dict:
    """90-day averages: order_rate, complaint_rate, return_rate per day."""
    conn = get_connection()
    cur = conn.cursor()

    # Order rate
    cur.execute("""
        SELECT
            COUNT(*) * 1.0 / 90 AS avg_orders_per_day,
            SUM(CASE WHEN status='returned' THEN 1 ELSE 0 END) * 1.0
            / NULLIF(COUNT(*), 0) AS return_rate
        FROM order_history
        WHERE sku = ? AND order_timestamp >= ?
    """, (sku, _cutoff(90)))
    order_row = cur.fetchone()

    # Complaint rate
    cur.execute("""
        SELECT COUNT(*) * 1.0 / 90 AS avg_complaints_per_day
        FROM complaint_log
        WHERE sku = ? AND submitted_at >= ?
    """, (sku, _cutoff(90)))
    complaint_row = cur.fetchone()

    conn.close()

    return {
        "sku": sku,
        "avg_orders_per_day":     round(order_row[0] or 0, 4),
        "return_rate":            round(order_row[1] or 0, 4),
        "avg_complaints_per_day": round(complaint_row[0] or 0, 4),
    }


def get_anomalous_skus() -> list[dict]:
    """
    SKUs where 7-day metrics deviate >2 std deviations from 90-day baseline.
    Computes per-day counts in 7-day windows vs. the 90-day average.
    Returns a list of dicts with sku, metric, baseline, recent, z_score.
    """
    conn = get_connection()
    cur = conn.cursor()

    # --- Order velocity anomalies ---
    cur.execute("""
        WITH daily AS (
            SELECT sku,
                   date(order_timestamp) AS day,
                   COUNT(*) AS cnt
            FROM order_history
            WHERE order_timestamp >= ?
            GROUP BY sku, day
        ),
        stats AS (
            SELECT sku,
                   AVG(cnt) AS mean,
                   -- population std dev
                   SQRT(AVG(cnt*cnt) - AVG(cnt)*AVG(cnt)) AS std
            FROM daily
            GROUP BY sku
        ),
        recent AS (
            SELECT sku, AVG(cnt) AS recent_avg
            FROM daily
            WHERE day >= date('now', '-7 days')
            GROUP BY sku
        )
        SELECT s.sku,
               'order_velocity' AS metric,
               ROUND(s.mean, 4)       AS baseline,
               ROUND(r.recent_avg, 4) AS recent,
               ROUND((r.recent_avg - s.mean) / NULLIF(s.std, 0), 3) AS z_score
        FROM stats s
        JOIN recent r ON s.sku = r.sku
        WHERE ABS((r.recent_avg - s.mean) / NULLIF(s.std, 0)) > 2
        ORDER BY ABS(z_score) DESC
    """, (_cutoff(90),))
    order_anomalies = _rows(cur)

    # --- Return rate anomalies ---
    cur.execute("""
        WITH daily AS (
            SELECT sku,
                   date(order_timestamp) AS day,
                   SUM(CASE WHEN status='returned' THEN 1.0 ELSE 0 END)
                   / COUNT(*) AS ret_rate
            FROM order_history
            WHERE order_timestamp >= ?
            GROUP BY sku, day
        ),
        stats AS (
            SELECT sku,
                   AVG(ret_rate) AS mean,
                   SQRT(AVG(ret_rate*ret_rate) - AVG(ret_rate)*AVG(ret_rate)) AS std
            FROM daily
            GROUP BY sku
        ),
        recent AS (
            SELECT sku, AVG(ret_rate) AS recent_avg
            FROM daily
            WHERE day >= date('now', '-7 days')
            GROUP BY sku
        )
        SELECT s.sku,
               'return_rate' AS metric,
               ROUND(s.mean, 4)       AS baseline,
               ROUND(r.recent_avg, 4) AS recent,
               ROUND((r.recent_avg - s.mean) / NULLIF(s.std, 0), 3) AS z_score
        FROM stats s
        JOIN recent r ON s.sku = r.sku
        WHERE ABS((r.recent_avg - s.mean) / NULLIF(s.std, 0)) > 2
        ORDER BY ABS(z_score) DESC
    """, (_cutoff(90),))
    return_anomalies = _rows(cur)

    # --- Complaint rate anomalies ---
    cur.execute("""
        WITH daily AS (
            SELECT sku,
                   date(submitted_at) AS day,
                   COUNT(*) AS cnt
            FROM complaint_log
            WHERE submitted_at >= ?
            GROUP BY sku, day
        ),
        stats AS (
            SELECT sku,
                   AVG(cnt) AS mean,
                   SQRT(AVG(cnt*cnt) - AVG(cnt)*AVG(cnt)) AS std
            FROM daily
            GROUP BY sku
        ),
        recent AS (
            SELECT sku, AVG(cnt) AS recent_avg
            FROM daily
            WHERE day >= date('now', '-7 days')
            GROUP BY sku
        )
        SELECT s.sku,
               'complaint_rate' AS metric,
               ROUND(s.mean, 4)       AS baseline,
               ROUND(r.recent_avg, 4) AS recent,
               ROUND((r.recent_avg - s.mean) / NULLIF(s.std, 0), 3) AS z_score
        FROM stats s
        JOIN recent r ON s.sku = r.sku
        WHERE ABS((r.recent_avg - s.mean) / NULLIF(s.std, 0)) > 2
        ORDER BY ABS(z_score) DESC
    """, (_cutoff(90),))
    complaint_anomalies = _rows(cur)

    conn.close()
    return order_anomalies + return_anomalies + complaint_anomalies


def get_ghost_stock_candidates() -> list[dict]:
    """
    SKUs where the most recent units_available differs from
    last_physical_count by more than 20%.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        WITH latest AS (
            SELECT sku, product_name,
                   units_available, last_physical_count,
                   last_count_date, warehouse_location,
                   ROW_NUMBER() OVER (PARTITION BY sku ORDER BY recorded_at DESC) AS rn
            FROM inventory_log
        )
        SELECT
            sku, product_name, units_available, last_physical_count,
            last_count_date, warehouse_location,
            ROUND(
                ABS(units_available - last_physical_count) * 1.0
                / NULLIF(units_available, 0) * 100, 2
            ) AS discrepancy_pct
        FROM latest
        WHERE rn = 1
          AND ABS(units_available - last_physical_count) * 1.0
              / NULLIF(units_available, 0) > 0.20
        ORDER BY discrepancy_pct DESC
    """)
    result = _rows(cur)
    conn.close()
    return result


def get_price_contradictions() -> list[dict]:
    """
    SKUs where price variance across channels exceeds 10%.
    Returns sku, min_price, max_price, variance_pct, channels.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        WITH current_prices AS (
            SELECT sku, product_name, channel, price_pkr
            FROM price_history
            WHERE (effective_to IS NULL OR effective_to >= ?)
        ),
        stats AS (
            SELECT
                sku,
                product_name,
                MIN(price_pkr) AS min_price,
                MAX(price_pkr) AS max_price,
                GROUP_CONCAT(channel || ':' || price_pkr, ' | ') AS channel_prices,
                COUNT(DISTINCT channel) AS channel_count
            FROM current_prices
            GROUP BY sku
        )
        SELECT *,
               ROUND((max_price - min_price) * 100.0
                     / NULLIF(min_price, 0), 2) AS variance_pct
        FROM stats
        WHERE (max_price - min_price) * 1.0
              / NULLIF(min_price, 0) > 0.10
        ORDER BY variance_pct DESC
    """, (NOW.strftime("%Y-%m-%dT%H:%M:%SZ"),))
    result = _rows(cur)
    conn.close()
    return result


def get_overdue_suppliers() -> list[dict]:
    """
    Suppliers where next_scheduled_date is in the past and no
    delivery has been recorded since then.
    """
    conn = get_connection()
    cur = conn.cursor()
    today = NOW.strftime("%Y-%m-%d")
    cur.execute("""
        SELECT
            supplier_id,
            supplier_name,
            product_categories,
            on_time_delivery_rate,
            reliability_trend,
            last_delivery_date,
            next_scheduled_date,
            contact_email,
            CAST(julianday(?) - julianday(next_scheduled_date) AS INTEGER)
                AS days_overdue
        FROM supplier_records
        WHERE next_scheduled_date < ?
          AND (last_delivery_date < next_scheduled_date
               OR last_delivery_date IS NULL)
        ORDER BY days_overdue DESC
    """, (today, today))
    result = _rows(cur)
    conn.close()
    return result
