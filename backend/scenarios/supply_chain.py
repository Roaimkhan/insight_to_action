"""
scenarios/supply_chain.py
-------------------------
Initializes the Supply Chain scenario by creating mock files (CSV, JSON, HTML)
and returning the domain config manifest.
"""

import os
import json

def get_supply_chain_scenario() -> dict:
    """
    Sets up the Supply Chain Crisis Monitor scenario.
    Creates structured mock files and returns the scenario domain config.
    """
    data_dir = "/home/roaim/Desktop/ai seekho/backend/scenarios/data/supply_chain"
    os.makedirs(data_dir, exist_ok=True)
    
    # 1. Create warehouse_stock.csv
    csv_path = os.path.join(data_dir, "warehouse_stock.csv")
    csv_content = (
        "sku,product_name,units_available,last_updated\n"
        "SKU-001,Premium Steel Gaskets,450,2026-05-15\n"
        "SKU-002,Hydraulic Compressor Valve,12,2026-05-17\n"  # CRITICALLY LOW
        "SKU-003,Heavy Duty Bearing,8,2026-05-18\n"       # CRITICALLY LOW
        "SKU-004,Synthetic Engine Lubricant,800,2026-05-14\n"
        "SKU-005,Copper Wire Reel,120,2026-05-16\n"
        "SKU-006,Pneumatic Actuator,350,2026-05-15\n"
        "SKU-007,Friction Brake Pad,5,2026-05-18\n"        # CRITICALLY LOW
        "SKU-008,Teflon Tube Sealer,230,2026-05-13\n"
        "SKU-009,Stainless Steel Bolt Pack,1100,2026-05-16\n"
        "SKU-010,Rotary Joint Coupler,45,2026-05-17\n"
    )
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(csv_content)
        
    # 2. Create supplier_status.json
    json_path = os.path.join(data_dir, "supplier_status.json")
    supplier_data = [
        {"name": "Indus Metal Corp", "reliability_score": 0.94, "lead_time_days": 5, "last_contact": "2026-05-10", "status": "active"},
        {"name": "Valves & Actuators Ltd", "reliability_score": 0.42, "lead_time_days": 18, "last_contact": "2026-05-17", "status": "halt"}, # CRITICAL HALT
        {"name": "Bearing World Pakistan", "reliability_score": 0.88, "lead_time_days": 3, "last_contact": "2026-05-15", "status": "active"},
        {"name": "Sino-Lube Importers", "reliability_score": 0.91, "lead_time_days": 7, "last_contact": "2026-05-12", "status": "active"}
    ]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(supplier_data, f, indent=2)
        
    # 3. Create complaint_feed_config.json
    complaints_path = os.path.join(data_dir, "complaint_feed_config.json")
    complaints_config = {
        "scenario": "supply_chain",
        "complaint_rate_per_hour": 120,
        "peak_skus": ["SKU-003", "SKU-007"]
    }
    with open(complaints_path, "w", encoding="utf-8") as f:
        json.dump(complaints_config, f, indent=2)
        
    # 4. Create an HTML file for the supplier status table to verify table parser
    table_path = os.path.join(data_dir, "supplier_status.html")
    html_content = """
    <html>
      <body>
        <h3>Supplier Operational Health</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Reliability Score</th>
              <th>Lead Time Days</th>
              <th>Last Contact Date</th>
              <th>Current Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Indus Metal Corp</td><td>0.94</td><td>5</td><td>2026-05-10</td><td>active</td></tr>
            <tr><td>Valves & Actuators Ltd</td><td>0.42</td><td>18</td><td>2026-05-17</td><td>halt</td></tr>
            <tr><td>Bearing World Pakistan</td><td>0.88</td><td>3</td><td>2026-05-15</td><td>active</td></tr>
            <tr><td>Sino-Lube Importers</td><td>0.91</td><td>7</td><td>2026-05-12</td><td>active</td></tr>
          </tbody>
        </table>
      </body>
    </html>
    """
    with open(table_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    # 5. Create a placeholder text for PDF (gracefully handled by pdfplumber or our mock error handling)
    pdf_path = os.path.join(data_dir, "quarterly_report.pdf")
    with open(pdf_path, "w", encoding="utf-8") as f:
        # We write raw text outlook. The pdf parser returns raw text if read fails or catches the PDF format exception.
        f.write("Supply Chain Outlook Report - May 2026\nRecent port congestion delayed valve shipments.")
        
    domain_config = {
        "domain": "supply_chain",
        "display_name": "Supply Chain Crisis Monitor",
        # List of 5 source dicts as requested
        "sources": [
            {"id": "SRC-PDF", "type": "pdf", "path_or_url": pdf_path, "credibility_tier": "medium"},
            {"id": "SRC-WEB", "type": "web", "path_or_url": "https://httpbin.org/html", "credibility_tier": "medium"},
            {"id": "SRC-CSV", "type": "csv", "path_or_url": csv_path, "credibility_tier": "high"},
            {"id": "SRC-TABLE", "type": "table", "path_or_url": table_path, "credibility_tier": "high"},
            {"id": "SRC-REALTIME", "type": "realtime", "path_or_url": "supply_chain", "credibility_tier": "high"}
        ],
        "constraints": {
            "budget_pkr": 500000.0,
            "deadline_hours": 30.0,
            "max_retries": 2,
            "max_order_quantity": 200
        },
        "metrics": ["inventory_units", "complaint_count", "supplier_reliability", "delivery_eta_hrs"],
        "impact_label": "PKR loss prevented"
    }
    
    # Map sources dictionary for ingestion node compatibility
    domain_config["sources_map"] = {
        "pdf": pdf_path,
        "web": "https://httpbin.org/html",
        "csv": csv_path,
        "table": table_path,
        "realtime": "supply_chain"
    }
    
    # Backwards compatibility key
    domain_config["sources"] = domain_config["sources_map"]
    domain_config["sources_list"] = [
        {"id": "SRC-PDF", "type": "pdf", "path_or_url": pdf_path, "credibility_tier": "medium"},
        {"id": "SRC-WEB", "type": "web", "path_or_url": "https://httpbin.org/html", "credibility_tier": "medium"},
        {"id": "SRC-CSV", "type": "csv", "path_or_url": csv_path, "credibility_tier": "high"},
        {"id": "SRC-TABLE", "type": "table", "path_or_url": table_path, "credibility_tier": "high"},
        {"id": "SRC-REALTIME", "type": "realtime", "path_or_url": "supply_chain", "credibility_tier": "high"}
    ]
    
    return domain_config
