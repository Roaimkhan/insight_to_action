"""
scenarios/power_grid.py
-----------------------
Initializes the Power Grid scenario by creating mock files (CSV, JSON, HTML)
and returning the domain config manifest.
"""

import os
import json

def get_power_grid_scenario() -> dict:
    """
    Sets up the Power Grid Sentinel Monitor scenario.
    Creates structured mock files and returns the scenario domain config.
    """
    data_dir = "/home/roaim/Desktop/ai seekho/backend/scenarios/data/power_grid"
    os.makedirs(data_dir, exist_ok=True)
    
    # 1. Create fault_log.csv
    csv_path = os.path.join(data_dir, "fault_log.csv")
    csv_content = (
        "feeder_id,status,trip_time,duration_hrs\n"
        "F-47,tripped,2026-05-18 10:15:00,6.2\n"  # CRITICAL outage
        "F-12,active,2026-05-18 09:30:00,0.0\n"
        "F-89,active,2026-05-18 08:00:00,0.0\n"
        "F-04,tripped,2026-05-18 11:22:00,0.8\n"  # CRITICAL short duration
        "F-63,active,2026-05-18 10:00:00,0.0\n"
    )
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(csv_content)
        
    # 2. Create load_schedule.json
    json_path = os.path.join(data_dir, "load_schedule.json")
    schedule_data = [
        {"feeder_id": "F-47", "zone": "Lahore Cantt", "planned_hours": 2, "actual_hours": 6, "load_mw": 14.5},
        {"feeder_id": "F-12", "zone": "Gulberg III", "planned_hours": 1, "actual_hours": 1, "load_mw": 8.2},
        {"feeder_id": "F-89", "zone": "DHA Phase 5", "planned_hours": 1, "actual_hours": 1, "load_mw": 11.0},
        {"feeder_id": "F-04", "zone": "Iqbal Town", "planned_hours": 2, "actual_hours": 3, "load_mw": 9.4}
    ]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(schedule_data, f, indent=2)
        
    # 3. Create fuel_supply.json
    fuel_path = os.path.join(data_dir, "fuel_supply.json")
    fuel_data = {
        "generation_station": "Kot Addu Power",
        "gas_pressure_psi": 80,
        "hsd_stock_litres": 145000,
        "fuel_reserve_days": 1.5,  # CRITICALLY LOW (normal is > 7)
        "capacity_utilization": 0.38
    }
    with open(fuel_path, "w", encoding="utf-8") as f:
        json.dump(fuel_data, f, indent=2)
        
    # 4. Create an HTML file for the power station status table
    table_path = os.path.join(data_dir, "station_load.html")
    html_content = """
    <html>
      <body>
        <h3>Power Generation Station Feed</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Station Code</th>
              <th>Active Megawatts</th>
              <th>Fuel Reserve Days</th>
              <th>Current Efficiency</th>
              <th>Grid Frequency Hz</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>KAPCO-G1</td><td>240</td><td>1.5</td><td>0.38</td><td>49.82</td></tr>
            <tr><td>HUBL-G2</td><td>600</td><td>8.4</td><td>0.44</td><td>50.00</td></tr>
            <tr><td>KE-B1</td><td>410</td><td>6.1</td><td>0.41</td><td>49.95</td></tr>
          </tbody>
        </table>
      </body>
    </html>
    """
    with open(table_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    # 5. Create a placeholder text for PDF
    pdf_path = os.path.join(data_dir, "grid_intelligence.pdf")
    with open(pdf_path, "w", encoding="utf-8") as f:
        f.write("Grid Intelligence & Frequency Report - May 2026\nSystem Frequency dipped to 49.82 Hz.")
        
    domain_config = {
        "domain": "power_grid",
        "display_name": "Power Grid Sentinel Monitor",
        "sources": {
            "pdf": pdf_path,
            "web": "https://httpbin.org/html",
            "csv": csv_path,
            "table": table_path,
            "realtime": "power_grid"
        },
        "constraints": {
            "budget_pkr": 1000000.0,
            "deadline_hours": 12.0,
            "max_retries": 3,
            "max_load_shed_mw": 50
        },
        "metrics": ["load_shed_mw", "active_feeders", "grid_frequency_hz", "duration_hrs"],
        "impact_label": "Megawatts load saved"
    }
    
    domain_config["sources_list"] = [
        {"id": "SRC-PDF", "type": "pdf", "path_or_url": pdf_path, "credibility_tier": "high"},
        {"id": "SRC-WEB", "type": "web", "path_or_url": "https://httpbin.org/html", "credibility_tier": "medium"},
        {"id": "SRC-CSV", "type": "csv", "path_or_url": csv_path, "credibility_tier": "high"},
        {"id": "SRC-TABLE", "type": "table", "path_or_url": table_path, "credibility_tier": "high"},
        {"id": "SRC-REALTIME", "type": "realtime", "path_or_url": "power_grid", "credibility_tier": "high"}
    ]
    
    return domain_config
