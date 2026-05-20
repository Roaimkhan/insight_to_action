"""
scenarios/sentiment_crisis.py
------------------------------
Initializes the Sentiment Crisis Monitor scenario by creating mock files (CSV, JSON, HTML)
and returning the domain config manifest.
"""

import os
import json

def get_sentiment_scenario() -> dict:
    """
    Sets up the Sentiment Crisis Monitor scenario.
    Creates structured mock files and returns the scenario domain config.
    """
    data_dir = "/home/roaim/Desktop/ai seekho/backend/scenarios/data/sentiment_crisis"
    os.makedirs(data_dir, exist_ok=True)
    
    # 1. Create reviews.csv
    csv_path = os.path.join(data_dir, "reviews.csv")
    csv_content = (
        "product_id,rating,review_text,date\n"
        "PROD-001,1,Product quality dropped significantly since last batch.,2026-05-18\n"  # 1-star
        "PROD-002,5,Amazing design and extremely comfortable!,2026-05-16\n"              # 5-star
        "PROD-001,1,Terrible customer service and checkout failures.,2026-05-17\n"        # 1-star
        "PROD-003,5,Best purchase I have made this year. High quality.,2026-05-15\n"         # 5-star
        "PROD-001,1,App keeps crashing on checkout. Very frustrating.,2026-05-18\n"       # 1-star
        "PROD-004,2,Overpriced and delivery was delayed by two weeks.,2026-05-17\n"
    )
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(csv_content)
        
    # 2. Create sales_data.csv (showing growth despite complaints)
    sales_path = os.path.join(data_dir, "sales_data.csv")
    sales_content = (
        "week,revenue_usd,order_count,customer_acquisition_cost\n"
        "2026-W18,124500,4500,12.50\n"
        "2026-W19,138000,5100,11.20\n"
        "2026-W20,152000,5800,9.80\n"  # Clear upward growth trend in revenue and orders!
    )
    with open(sales_path, "w", encoding="utf-8") as f:
        f.write(sales_content)
        
    # 3. Create support_tickets.json
    json_path = os.path.join(data_dir, "support_tickets.json")
    tickets_data = [
        {"ticket_id": "TCK-1024", "category": "Checkout Crash", "customer": "Ahmad", "urgency": "high", "message": "App crashed when trying to checkout my cart."},
        {"ticket_id": "TCK-1025", "category": "Refund Request", "customer": "Zainab", "urgency": "medium", "message": "Need a refund for order #7728. Received wrong items."},
        {"ticket_id": "TCK-1026", "category": "Delivery Delay", "customer": "Bilal", "urgency": "medium", "message": "My order has been delayed for 4 days at Karachi warehouse."}
    ]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(tickets_data, f, indent=2)
        
    # 4. Create an HTML file for competitor sentiment table
    table_path = os.path.join(data_dir, "sentiment_summary.html")
    html_content = """
    <html>
      <body>
        <h3>Brand Sentiment Share</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Brand / Competitor</th>
              <th>Net Promoter Score</th>
              <th>Positive Sentiment Share</th>
              <th>Negative Sentiment Share</th>
              <th>Active Backlog Count</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Our Brand</td><td>-12</td><td>0.35</td><td>0.65</td><td>142</td></tr> <!-- CRISIS NPS -->
            <tr><td>Competitor Alpha</td><td>+45</td><td>0.72</td><td>0.28</td><td>12</td></tr>
            <tr><td>Competitor Beta</td><td>+22</td><td>0.58</td><td>0.42</td><td>44</td></tr>
          </tbody>
        </table>
      </body>
    </html>
    """
    with open(table_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    # 5. Create a placeholder text for PDF
    pdf_path = os.path.join(data_dir, "sentiment_outlook.pdf")
    with open(pdf_path, "w", encoding="utf-8") as f:
        f.write("Sentiment Outlook Report - May 2026\nNegative customer reviews spiked by 300% due to payment failures.")
        
    domain_config = {
        "domain": "sentiment_crisis",
        "display_name": "Sentiment Crisis Monitor",
        "sources": {
            "pdf": pdf_path,
            "web": "https://httpbin.org/html",
            "csv": csv_path,
            "table": table_path,
            "realtime": "sentiment_crisis"
        },
        "constraints": {
            "budget_pkr": 250000.0,
            "deadline_hours": 24.0,
            "max_retries": 2,
            "max_resolution_tickets": 100
        },
        "metrics": ["complaint_count", "nps_score", "sales_growth_rate", "resolved_tickets"],
        "impact_label": "Customer retention rate increased"
    }
    
    domain_config["sources_list"] = [
        {"id": "SRC-PDF", "type": "pdf", "path_or_url": pdf_path, "credibility_tier": "medium"},
        {"id": "SRC-WEB", "type": "web", "path_or_url": "https://httpbin.org/html", "credibility_tier": "medium"},
        {"id": "SRC-CSV", "type": "csv", "path_or_url": csv_path, "credibility_tier": "high"},
        {"id": "SRC-TABLE", "type": "table", "path_or_url": table_path, "credibility_tier": "high"},
        {"id": "SRC-REALTIME", "type": "realtime", "path_or_url": "sentiment_crisis", "credibility_tier": "high"}
    ]
    
    # Allow mapping sales csv too in config
    domain_config["sales_csv_path"] = sales_path
    
    return domain_config
