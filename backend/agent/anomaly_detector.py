from collections import deque
from datetime import datetime
from typing import Optional
import math

class RollingZScoreDetector:
    """
    Maintains a rolling window of event rates and detects statistical anomalies.
    
    HOW IT WORKS:
    - Counts events per minute in a rolling window
    - Computes mean and std of historical rates
    - Current rate Z-score = (current - mean) / std
    - Z > 2.5 = anomaly (statistically significant deviation)
    - Z > 3.5 = critical anomaly (extreme deviation)
    """
    
    def __init__(self, window_size: int = 10, anomaly_threshold: float = 2.5):
        self.window_size = window_size
        self.anomaly_threshold = anomaly_threshold
        self.critical_threshold = 3.5
        self.historical_rates: deque = deque(maxlen=window_size)
        self.current_window_count: int = 0
        self.window_start: datetime = datetime.utcnow()
        self.window_duration_seconds: int = 60
        self.total_events_processed: int = 0
        self.anomalies_detected: int = 0
    
    def add_event(self, event: dict) -> Optional[dict]:
        """
        Add an event to the detector.
        Returns anomaly report if threshold exceeded, None otherwise.
        """
        self.current_window_count += 1
        self.total_events_processed += 1
        
        # Check if current window is complete
        now = datetime.utcnow()
        elapsed = (now - self.window_start).total_seconds()
        
        if elapsed >= self.window_duration_seconds:
            # Window complete: compute rate and check for anomaly
            rate = self.current_window_count / (elapsed / 60)  # events per minute
            anomaly = self._check_anomaly(rate, now)
            
            # Reset window
            self.historical_rates.append(rate)
            self.current_window_count = 0
            self.window_start = now
            
            return anomaly
        
        return None
    
    def _check_anomaly(self, current_rate: float, timestamp: datetime) -> Optional[dict]:
        if len(self.historical_rates) < 3:
            # Not enough history for reliable detection
            self.historical_rates.append(current_rate)
            return None
        
        rates = list(self.historical_rates)
        mean = sum(rates) / len(rates)
        variance = sum((r - mean) ** 2 for r in rates) / len(rates)
        std = math.sqrt(variance) if variance > 0 else 0.001
        
        z_score = (current_rate - mean) / std
        
        if z_score > self.anomaly_threshold:
            self.anomalies_detected += 1
            severity = "CRITICAL" if z_score > self.critical_threshold else "HIGH"
            return {
                "type": "anomaly_detected",
                "z_score": round(z_score, 2),
                "current_rate": round(current_rate, 1),
                "baseline_mean": round(mean, 1),
                "baseline_std": round(std, 2),
                "severity": severity,
                "timestamp": timestamp.isoformat(),
                "interpretation": (
                    f"Event rate ({current_rate:.1f}/min) is {z_score:.1f} standard deviations "
                    f"above baseline ({mean:.1f}/min). "
                    f"{'CRITICAL: Immediate action required.' if severity == 'CRITICAL' else 'Significant deviation detected.'}"
                ),
                "auto_trigger_agent": z_score > self.critical_threshold
            }
        
        return None
    
    def get_status(self) -> dict:
        """Return current detector status for mobile display."""
        rates = list(self.historical_rates)
        if not rates:
            return {"status": "insufficient_data", "events_processed": self.total_events_processed}
        
        mean = sum(rates) / len(rates)
        return {
            "status": "monitoring",
            "current_window_events": self.current_window_count,
            "baseline_rate_per_min": round(mean, 1),
            "anomalies_detected": self.anomalies_detected,
            "events_processed": self.total_events_processed,
            "window_size": self.window_size
        }
    
    def inject_spike(self, multiplier: float = 5.0):
        """
        DEMO USE ONLY: Artificially spike the event rate to trigger anomaly detection.
        multiplier=5.0 means 5x normal rate = guaranteed anomaly.
        """
        if self.historical_rates:
            mean = sum(self.historical_rates) / len(self.historical_rates)
            self.current_window_count = int(mean * multiplier)


# Global detectors per scenario (one per session)
_detectors: dict[str, RollingZScoreDetector] = {}

def get_detector(session_id: str) -> RollingZScoreDetector:
    if session_id not in _detectors:
        _detectors[session_id] = RollingZScoreDetector(window_size=10, anomaly_threshold=2.5)
    return _detectors[session_id]

def process_feed_event(session_id: str, event: dict) -> tuple[dict, Optional[dict]]:
    """
    Process a single feed event through the anomaly detector.
    Returns (event_with_zscore, anomaly_report_or_none).
    """
    detector = get_detector(session_id)
    anomaly = detector.add_event(event)
    status = detector.get_status()
    
    # Enrich the event with current Z-score context
    event["anomaly_context"] = {
        "baseline_rate": status.get("baseline_rate_per_min", 0),
        "current_window_events": status.get("current_window_events", 0),
        "anomaly_active": anomaly is not None
    }
    
    return event, anomaly
