"""
seeder.py — Seeds store.db with 90 days of realistic Pakistani e-commerce data.
Uses random.seed(42) for reproducibility.

Special embedded scenarios:
  SKU-003 : demand spike last 7 days (+40%) + low stock (<50) + overdue supplier
  SKU-007 : 35% return rate + 3x complaint spike last 7 days
  SKU-009 : price contradiction (website 3200 / app 2800 / daraz 3600)
            + 40 price_mismatch complaints in last 24 h
  SKU-011 : ghost stock (units_available >> last_physical_count by >20%)
"""

import random
import uuid
from datetime import datetime, timedelta, timezone

from .schema import create_tables, get_connection, DB_PATH

random.seed(42)

NOW = datetime.now(timezone.utc)

SKUS = [f"SKU-{i:03d}" for i in range(1, 16)]

PRODUCT_NAMES = {
    "SKU-001": "Men's Khaddar Shalwar Kameez",
    "SKU-002": "Women's Lawn Suit",
    "SKU-003": "Wireless Bluetooth Earbuds",
    "SKU-004": "Kitchen Blender 500W",
    "SKU-005": "School Bag Waterproof",
    "SKU-006": "Mobile Phone Cover Leather",
    "SKU-007": "Stainless Steel Water Bottle",
    "SKU-008": "Children's Drawing Set",
    "SKU-009": "Digital Smart Watch",
    "SKU-010": "Embroidered Dupatta",
    "SKU-011": "Automatic Rice Cooker 1.8L",
    "SKU-012": "Men's Leather Sandals",
    "SKU-013": "Women's Handbag Faux Leather",
    "SKU-014": "Portable USB Power Bank 20000mAh",
    "SKU-015": "Cotton Bed Sheet Double",
}

CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar"]

ORDER_CHANNELS = (["website"] * 10 + ["app"] * 5 + ["daraz"] * 3 + ["whatsapp"] * 2)

COMPLAINT_CHANNELS = ["website", "email", "whatsapp", "phone", "social"]
COMPLAINT_TYPES = ["delivery_delay", "wrong_item", "defective",
                   "price_mismatch", "not_received"]

WAREHOUSE_LOCATIONS = ["Karachi-WH1", "Lahore-WH2", "Islamabad-WH3",
                       "Faisalabad-WH4", "Rawalpindi-WH5"]

PRICE_BASE = {sku: round(random.uniform(500, 8000), 2) for sku in SKUS}

SKU_SUPPLIER = {
    "SKU-001": "SUP-001", "SKU-002": "SUP-001",
    "SKU-003": "SUP-008",   # overdue supplier
    "SKU-004": "SUP-002", "SKU-005": "SUP-002",
    "SKU-006": "SUP-003", "SKU-007": "SUP-003",
    "SKU-008": "SUP-004", "SKU-009": "SUP-004",
    "SKU-010": "SUP-005", "SKU-011": "SUP-005",
    "SKU-012": "SUP-006", "SKU-013": "SUP-006",
    "SKU-014": "SUP-007", "SKU-015": "SUP-007",
}

REORDER_THRESHOLDS = {
    "SKU-001": 400, "SKU-002": 400, "SKU-003": 300,
    "SKU-004": 200, "SKU-005": 250, "SKU-006": 350,
    "SKU-007": 300, "SKU-008": 200, "SKU-009": 300,
    "SKU-010": 400, "SKU-011": 200, "SKU-012": 250,
    "SKU-013": 300, "SKU-014": 200, "SKU-015": 350,
}


# ── helpers ───────────────────────────────────────────────────────────────────

def _uid():
    return str(uuid.uuid4())


def _ts(days_ago: float, hours_ago: float = 0.0) -> str:
    dt = NOW - timedelta(days=days_ago, hours=hours_ago)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _date(days_ago: int) -> str:
    return (NOW - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def _order_status(sku: str) -> str:
    if sku == "SKU-007":
        return random.choices(
            ["delivered", "dispatched", "confirmed", "returned", "cancelled"],
            weights=[45, 10, 5, 35, 5])[0]
    return random.choices(
        ["delivered", "dispatched", "confirmed", "returned", "cancelled"],
        weights=[60, 15, 10, 10, 5])[0]


def _severity() -> str:
    return random.choices(
        ["low", "medium", "high", "critical"],
        weights=[60, 25, 10, 5])[0]


def _c_status() -> str:
    return random.choices(
        ["open", "resolved", "escalated"],
        weights=[40, 50, 10])[0]


# ── suppliers ─────────────────────────────────────────────────────────────────

def _seed_suppliers(cur):
    rows = [
        ("SUP-001", "Textile Masters Pvt Ltd", "Clothing,Fabric",
         0.96, 5, _date(10), _date(-12), "stable", 450, 432, "orders@textilemaster.pk"),

        ("SUP-002", "HomeAppliance Hub", "Electronics,Appliances",
         0.93, 7, _date(8), _date(-8), "improving", 380, 354, "supply@hahub.pk"),

        ("SUP-003", "PackNShip Solutions", "Accessories,Covers",
         0.78, 10, _date(20), _date(-5), "stable", 290, 226, "info@packnship.pk"),

        ("SUP-004", "Digital Goods Trader", "Electronics,Toys",
         0.82, 9, _date(15), _date(-3), "stable", 310, 254, "trade@digitalgoods.pk"),

        ("SUP-005", "Crafts and Kitchens Co", "Kitchenware,Textiles",
         0.71, 12, _date(25), _date(-1), "degrading", 270, 192, "sales@craftskitchens.pk"),

        ("SUP-006", "Leather Lane Exports", "Footwear,Bags",
         0.62, 14, _date(30), _date(-7), "degrading", 200, 124, "export@leatherlane.pk"),

        ("SUP-007", "PowerTech Supplies", "Electronics,Power",
         0.88, 8, _date(12), _date(-4), "improving", 340, 299, "supply@powertech.pk"),

        # SUP-008: overdue — next_scheduled_date is 15 days in the past
        ("SUP-008", "TechGadgets Direct", "Electronics,Accessories",
         0.64, 11, _date(45), _date(15), "degrading", 180, 115, "orders@techgadgets.pk"),
    ]
    cur.executemany("""
        INSERT OR IGNORE INTO supplier_records
        (supplier_id,supplier_name,product_categories,on_time_delivery_rate,
         avg_lead_time_days,last_delivery_date,next_scheduled_date,
         reliability_trend,total_orders_placed,total_orders_fulfilled,contact_email)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
    """, rows)


# ── orders ────────────────────────────────────────────────────────────────────

def _seed_orders(cur):
    rows = []

    for _ in range(2000):
        sku = random.choice(SKUS)
        qty = random.randint(1, 5)
        up = round(PRICE_BASE[sku] * random.uniform(0.9, 1.1), 2)
        rows.append((
            _uid(), sku, PRODUCT_NAMES[sku], qty, up, round(qty * up, 2),
            _order_status(sku), _ts(random.uniform(0, 90)),
            random.choice(CITIES), random.choice(ORDER_CHANNELS)
        ))

    # SKU-003 spike: ~120 extra orders in last 7 days
    for _ in range(120):
        sku = "SKU-003"
        qty = random.randint(1, 3)
        up = round(PRICE_BASE[sku] * random.uniform(0.95, 1.05), 2)
        rows.append((
            _uid(), sku, PRODUCT_NAMES[sku], qty, up, round(qty * up, 2),
            _order_status(sku), _ts(random.uniform(0, 7)),
            random.choice(CITIES), random.choice(ORDER_CHANNELS)
        ))

    cur.executemany("""
        INSERT OR IGNORE INTO order_history
        (order_id,sku,product_name,quantity,unit_price_pkr,total_pkr,
         status,order_timestamp,customer_city,channel)
        VALUES(?,?,?,?,?,?,?,?,?,?)
    """, rows)


# ── inventory ─────────────────────────────────────────────────────────────────

def _seed_inventory(cur):
    rows = []
    for sku in SKUS:
        available = random.randint(400, 1500)
        warehouse = random.choice(WAREHOUSE_LOCATIONS)
        supplier = SKU_SUPPLIER[sku]
        threshold = REORDER_THRESHOLDS[sku]

        for day in range(90, 0, -1):   # oldest first
            delta = random.randint(-80, 50)
            available = max(10, available + delta)
            reserved = random.randint(0, min(50, available))
            physical = available + random.randint(-10, 10)

            if sku == "SKU-003" and day <= 7:
                available = max(5, available - random.randint(30, 60))
                if day == 1:
                    available = random.randint(22, 47)   # <50 units — critical
                physical = available + random.randint(-4, 4)

            elif sku == "SKU-011":
                # Ghost stock: physical count 26-40% below system count
                physical = int(available * random.uniform(0.60, 0.73))

            rows.append((
                _uid(), sku, PRODUCT_NAMES[sku],
                available, reserved, warehouse,
                physical, _date(day), threshold, supplier, _ts(day)
            ))

    cur.executemany("""
        INSERT OR IGNORE INTO inventory_log
        (log_id,sku,product_name,units_available,units_reserved,
         warehouse_location,last_physical_count,last_count_date,
         reorder_threshold,supplier_id,recorded_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
    """, rows)


# ── complaints ────────────────────────────────────────────────────────────────

def _seed_complaints(cur):
    rows = []

    # Normal complaints — 460 rows
    for _ in range(460):
        sku = random.choice(SKUS)
        days_ago = random.uniform(1, 90)
        status = _c_status()
        resolved = _ts(days_ago - random.uniform(0.5, 5)) if status == "resolved" else None
        rows.append((
            _uid(), sku,
            random.choice(COMPLAINT_TYPES),
            random.choice(COMPLAINT_CHANNELS),
            _severity(), status,
            f"Customer reported an issue with {PRODUCT_NAMES[sku]}.",
            _ts(days_ago), resolved
        ))

    # SKU-007 spike: 25 extra complaints last 7 days
    for _ in range(25):
        days_ago = random.uniform(0, 7)
        rows.append((
            _uid(), "SKU-007",
            random.choices(["defective", "delivery_delay", "wrong_item"],
                           weights=[50, 30, 20])[0],
            random.choice(COMPLAINT_CHANNELS),
            random.choices(["low", "medium", "high", "critical"],
                           weights=[30, 30, 25, 15])[0],
            _c_status(),
            f"Quality issue reported with {PRODUCT_NAMES['SKU-007']}.",
            _ts(days_ago), None
        ))

    # SKU-009 price_mismatch: 40 complaints in last 24 hours
    for _ in range(40):
        hours_ago = random.uniform(0.1, 23.0)
        rows.append((
            _uid(), "SKU-009", "price_mismatch",
            random.choice(COMPLAINT_CHANNELS),
            random.choices(["medium", "high", "critical"],
                           weights=[40, 40, 20])[0],
            random.choices(["open", "escalated"], weights=[70, 30])[0],
            f"Price on website differs from app/daraz for {PRODUCT_NAMES['SKU-009']}.",
            _ts(0, hours_ago), None
        ))

    random.shuffle(rows)
    cur.executemany("""
        INSERT OR IGNORE INTO complaint_log
        (complaint_id,sku,complaint_type,channel,severity,status,
         complaint_text,submitted_at,resolved_at)
        VALUES(?,?,?,?,?,?,?,?,?)
    """, rows)


# ── prices ────────────────────────────────────────────────────────────────────

def _seed_prices(cur):
    rows = []

    for sku in SKUS:
        base = PRICE_BASE[sku]
        for channel in ["website", "app", "daraz", "wholesale"]:
            if sku == "SKU-009":
                price = {"website": 3200.0, "app": 2800.0,
                         "daraz": 3600.0, "wholesale": 2400.0}[channel]
            else:
                price = round(base * random.uniform(0.92, 1.08), 2)

            discount = round(random.uniform(0, 15), 1)
            eff_from = _ts(random.randint(10, 60))
            eff_to = (None if random.random() > 0.3
                      else _ts(random.randint(0, 9)))
            set_by = random.choices(
                ["manual", "automated", "competitor_match"],
                weights=[50, 30, 20])[0]

            rows.append((
                _uid(), sku, PRODUCT_NAMES[sku], channel,
                price, discount, eff_from, eff_to, set_by
            ))

    # Pad to 200 rows with historical records
    while len(rows) < 200:
        sku = random.choice(SKUS)
        channel = random.choice(["website", "app", "daraz", "wholesale"])
        price = round(PRICE_BASE[sku] * random.uniform(0.85, 1.15), 2)
        rows.append((
            _uid(), sku, PRODUCT_NAMES[sku], channel,
            price, round(random.uniform(0, 20), 1),
            _ts(random.randint(61, 120)), _ts(random.randint(10, 60)),
            random.choices(["manual", "automated", "competitor_match"],
                           weights=[50, 30, 20])[0]
        ))

    cur.executemany("""
        INSERT OR IGNORE INTO price_history
        (price_id,sku,product_name,channel,price_pkr,
         discount_pct,effective_from,effective_to,set_by)
        VALUES(?,?,?,?,?,?,?,?,?)
    """, rows)


# ── main ──────────────────────────────────────────────────────────────────────

def seed_database(force: bool = False) -> None:
    """Seed all tables. Safe to call multiple times (INSERT OR IGNORE)."""
    create_tables()
    conn = get_connection()
    cur = conn.cursor()

    if force:
        for tbl in ["order_history", "inventory_log", "supplier_records",
                    "complaint_log", "price_history"]:
            cur.execute(f"DELETE FROM {tbl}")
        conn.commit()

    print("[seeder] Seeding suppliers …")
    _seed_suppliers(cur)

    print("[seeder] Seeding orders …")
    _seed_orders(cur)

    print("[seeder] Seeding inventory …")
    _seed_inventory(cur)

    print("[seeder] Seeding complaints …")
    _seed_complaints(cur)

    print("[seeder] Seeding prices …")
    _seed_prices(cur)

    conn.commit()

    for tbl in ["order_history", "inventory_log", "supplier_records",
                "complaint_log", "price_history"]:
        cur.execute(f"SELECT COUNT(*) AS n FROM {tbl}")
        n = dict(cur.fetchone())["n"]
        print(f"  ✓ {tbl}: {n} rows")

    conn.close()
    print(f"[seeder] Done. DB: {DB_PATH}")


if __name__ == "__main__":
    seed_database(force=True)
