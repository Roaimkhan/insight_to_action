"""
schema.py — SQLite schema for e-commerce AI agent platform.
Creates 5 tables: order_history, inventory_log, supplier_records,
complaint_log, price_history.
Database file: backend/database/store.db
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "store.db")


def get_connection() -> sqlite3.Connection:
    """Return a sqlite3 connection with row_factory set to dict-like Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_tables() -> None:
    """Create all 5 tables if they do not already exist."""
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

        -- TABLE 1: order_history
        CREATE TABLE IF NOT EXISTS order_history (
            order_id          TEXT PRIMARY KEY,
            sku               TEXT    NOT NULL,
            product_name      TEXT    NOT NULL,
            quantity          INTEGER NOT NULL,
            unit_price_pkr    REAL    NOT NULL,
            total_pkr         REAL    NOT NULL,
            status            TEXT    NOT NULL
                CHECK(status IN ('confirmed','dispatched','delivered','cancelled','returned')),
            order_timestamp   TEXT    NOT NULL,   -- ISO 8601
            customer_city     TEXT    NOT NULL,
            channel           TEXT    NOT NULL
                CHECK(channel IN ('website','app','daraz','whatsapp'))
        );

        -- TABLE 2: inventory_log
        CREATE TABLE IF NOT EXISTS inventory_log (
            log_id               TEXT PRIMARY KEY,
            sku                  TEXT    NOT NULL,
            product_name         TEXT    NOT NULL,
            units_available      INTEGER NOT NULL,
            units_reserved       INTEGER NOT NULL,
            warehouse_location   TEXT    NOT NULL,
            last_physical_count  INTEGER NOT NULL,
            last_count_date      TEXT    NOT NULL,
            reorder_threshold    INTEGER NOT NULL,
            supplier_id          TEXT    NOT NULL,
            recorded_at          TEXT    NOT NULL   -- ISO 8601
        );

        -- TABLE 3: supplier_records
        CREATE TABLE IF NOT EXISTS supplier_records (
            supplier_id              TEXT PRIMARY KEY,
            supplier_name            TEXT    NOT NULL,
            product_categories       TEXT    NOT NULL,
            on_time_delivery_rate    REAL    NOT NULL
                CHECK(on_time_delivery_rate BETWEEN 0.0 AND 1.0),
            avg_lead_time_days       INTEGER NOT NULL,
            last_delivery_date       TEXT    NOT NULL,
            next_scheduled_date      TEXT    NOT NULL,
            reliability_trend        TEXT    NOT NULL
                CHECK(reliability_trend IN ('improving','stable','degrading')),
            total_orders_placed      INTEGER NOT NULL,
            total_orders_fulfilled   INTEGER NOT NULL,
            contact_email            TEXT    NOT NULL
        );

        -- TABLE 4: complaint_log
        CREATE TABLE IF NOT EXISTS complaint_log (
            complaint_id    TEXT PRIMARY KEY,
            sku             TEXT NOT NULL,
            complaint_type  TEXT NOT NULL
                CHECK(complaint_type IN (
                    'delivery_delay','wrong_item','defective',
                    'price_mismatch','not_received')),
            channel         TEXT NOT NULL
                CHECK(channel IN ('website','email','whatsapp','phone','social')),
            severity        TEXT NOT NULL
                CHECK(severity IN ('low','medium','high','critical')),
            status          TEXT NOT NULL
                CHECK(status IN ('open','resolved','escalated')),
            complaint_text  TEXT NOT NULL,
            submitted_at    TEXT NOT NULL,
            resolved_at     TEXT
        );

        -- TABLE 5: price_history
        CREATE TABLE IF NOT EXISTS price_history (
            price_id        TEXT PRIMARY KEY,
            sku             TEXT NOT NULL,
            product_name    TEXT NOT NULL,
            channel         TEXT NOT NULL
                CHECK(channel IN ('website','app','daraz','wholesale')),
            price_pkr       REAL NOT NULL,
            discount_pct    REAL NOT NULL DEFAULT 0.0,
            effective_from  TEXT NOT NULL,
            effective_to    TEXT,
            set_by          TEXT NOT NULL
                CHECK(set_by IN ('manual','automated','competitor_match'))
        );

        -- Indexes for common query patterns
        CREATE INDEX IF NOT EXISTS idx_oh_sku        ON order_history(sku);
        CREATE INDEX IF NOT EXISTS idx_oh_ts         ON order_history(order_timestamp);
        CREATE INDEX IF NOT EXISTS idx_oh_status     ON order_history(status);
        CREATE INDEX IF NOT EXISTS idx_inv_sku       ON inventory_log(sku);
        CREATE INDEX IF NOT EXISTS idx_inv_recorded  ON inventory_log(recorded_at);
        CREATE INDEX IF NOT EXISTS idx_cl_sku        ON complaint_log(sku);
        CREATE INDEX IF NOT EXISTS idx_cl_submitted  ON complaint_log(submitted_at);
        CREATE INDEX IF NOT EXISTS idx_ph_sku        ON price_history(sku);
    """)

    conn.commit()
    conn.close()
    print(f"[schema] Tables created/verified at {DB_PATH}")


if __name__ == "__main__":
    create_tables()
