"""
ingestion/realtime_feed.py
--------------------------
Generates mock real-time operational feeds/events based on the scenario domain,
simulating active time-variant signals and a running complaint counter.
"""

import asyncio
from datetime import datetime, timedelta
import random

class MockRealtimeFeed:
    """Simulates a live operational event stream for the agent."""
    
    def __init__(self):
        # A realistic starting base for running complaints
        self.complaint_count = 142
        
    async def get_events(self, scenario: str, count: int = 10) -> list[dict]:
        """
        Asynchronously generates list of live events based on scenario.
        Timestamps are spread realistically over the last 3 hours.
        """
        events = []
        now = datetime.now()
        
        if scenario == "supply_chain":
            messages = [
                "Order delayed at Karachi port",
                "Package tracking not updating for 3 days",
                "Received damaged item in shipment #7728",
                "Incorrect items delivered to main Lahore warehouse",
                "Customer service not responding to delivery queries",
                "Supplier inventory list mismatches physical count",
                "Wholesale client complaining about delay penalties",
                "Transport truck broke down on highway"
            ]
            severities = ["high", "medium", "low"]
            for _ in range(count):
                self.complaint_count += random.randint(1, 4)
                # Spread timestamps over last 3 hours (0 to 180 minutes ago)
                time_offset = timedelta(minutes=random.randint(0, 180))
                event_time = now - time_offset
                events.append({
                    "type": "complaint",
                    "message": random.choice(messages),
                    "severity": random.choice(severities),
                    "complaint_count": self.complaint_count,
                    "timestamp": event_time.isoformat()
                })
                
        elif scenario == "power_grid":
            feeders = ["F-47", "F-12", "F-89", "F-04", "F-63"]
            fault_types = ["feeder_trip", "transformer_overload", "voltage_fluctuation", "line_fault"]
            for _ in range(count):
                self.complaint_count += random.randint(3, 8)
                time_offset = timedelta(minutes=random.randint(0, 180))
                event_time = now - time_offset
                events.append({
                    "type": "fault",
                    "feeder": random.choice(feeders),
                    "fault_type": random.choice(fault_types),
                    "duration_hrs": round(random.uniform(0.5, 8.0), 1),
                    "complaint_count": self.complaint_count,
                    "timestamp": event_time.isoformat()
                })
                
        elif scenario == "sentiment_crisis":
            texts = [
                "Product quality dropped significantly since last batch.",
                "Terrible customer service, they refused to refund.",
                "App keeps crashing on checkout, very frustrating.",
                "Overpriced and low quality, would not recommend.",
                "Delivery was extremely slow, took two weeks.",
                "The brand new update ruined all previous features!"
            ]
            for _ in range(count):
                self.complaint_count += random.randint(2, 5)
                time_offset = timedelta(minutes=random.randint(0, 180))
                event_time = now - time_offset
                events.append({
                    "type": "review",
                    "sentiment": "negative",
                    "text": random.choice(texts),
                    "complaint_count": self.complaint_count,
                    "timestamp": event_time.isoformat()
                })
                
        else:
            for i in range(count):
                self.complaint_count += 1
                time_offset = timedelta(minutes=random.randint(0, 180))
                event_time = now - time_offset
                events.append({
                    "type": "generic_signal",
                    "message": f"Real-time operational report check #{i}",
                    "complaint_count": self.complaint_count,
                    "timestamp": event_time.isoformat()
                })
                
        # Sort events by timestamp descending (newest first)
        events.sort(key=lambda x: x["timestamp"], reverse=True)
        return events

    async def get_events_with_anomaly_detection(
        self,
        scenario: str,
        session_id: str,
        count: int = 10,
        inject_spike: bool = False
    ) -> tuple[list[dict], list[dict]]:
        """
        Returns (events, anomaly_reports).
        Set inject_spike=True during demo to trigger anomaly detection live.
        """
        from agent.anomaly_detector import process_feed_event, get_detector

        events = await self.get_events(scenario, count)
        anomalies = []

        detector = get_detector(session_id)

        # If demo spike requested, inject before processing
        if inject_spike:
            detector.inject_spike(multiplier=6.0)

        enriched_events = []
        for event in events:
            enriched, anomaly = process_feed_event(session_id, event)
            enriched_events.append(enriched)
            if anomaly:
                anomalies.append(anomaly)

        return enriched_events, anomalies

async def parse_realtime(scenario: str, count: int = 10) -> dict:
    """
    Parses realtime operational stream into unified format for agent consumption.
    Includes base credibility score of 0.90.
    """
    feed = MockRealtimeFeed()
    events = await feed.get_events(scenario, count)
    
    summary_lines = [
        "Source: Live Real-time Operational Feed Stream",
        f"Scenario Domain: {scenario}",
        f"Live Event Count: {len(events)}",
        "\nRecent Live Stream Signals:"
    ]
    
    for idx, e in enumerate(events[:5]):
        if scenario == "supply_chain":
            summary_lines.append(
                f"  [{idx+1}] {e['timestamp']} | Complaint: {e['message']} "
                f"(Severity: {e['severity']}, Global count: {e['complaint_count']})"
            )
        elif scenario == "power_grid":
            summary_lines.append(
                f"  [{idx+1}] {e['timestamp']} | Grid Fault: {e['fault_type']} on feeder {e['feeder']} "
                f"(Est. duration: {e['duration_hrs']} hrs, Complaint count: {e['complaint_count']})"
            )
        elif scenario == "sentiment_crisis":
            summary_lines.append(
                f"  [{idx+1}] {e['timestamp']} | Sentiment Review: '{e['text']}' "
                f"(Sentiment: {e['sentiment']}, Complaint count: {e['complaint_count']})"
            )
        else:
            summary_lines.append(
                f"  [{idx+1}] {e['timestamp']} | Live Signal: {e['message']} "
                f"(Complaint count: {e['complaint_count']})"
            )
            
    raw_text = "\n".join(summary_lines)
    
    return {
        "raw_text": raw_text,
        "structured_data": {
            "events": events
        },
        "row_count": len(events),
        "columns": list(events[0].keys()) if events else [],
        "credibility_score": 0.90
    }
