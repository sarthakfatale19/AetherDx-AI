"""
AetherDx AI — Smart Data Sync Service (Module 9)
Periodically checks for updated records, re-runs predictions,
and notifies of risk changes.
"""

import hashlib
import json
from typing import Dict, Optional, Any
from datetime import datetime


class SyncService:
    """Manages health data synchronization and change detection."""

    def __init__(self):
        self._previous_results: Dict[str, Dict] = {}  # consent_id -> previous prediction

    def detect_changes(
        self,
        consent_id: str,
        current_fhir_data: Dict,
        current_prediction: Dict,
    ) -> Dict:
        """
        Compare current data/prediction with previous sync
        to detect meaningful risk changes.
        """
        data_hash = hashlib.md5(
            json.dumps(current_fhir_data, default=str, sort_keys=True).encode()
        ).hexdigest()[:16]

        previous = self._previous_results.get(consent_id)

        if not previous:
            # First sync — store and return
            self._previous_results[consent_id] = {
                "data_hash": data_hash,
                "prediction": current_prediction,
                "timestamp": datetime.now().isoformat(),
            }
            return {
                "is_first_sync": True,
                "data_changed": False,
                "risk_changed": False,
                "notifications": [],
            }

        data_changed = previous["data_hash"] != data_hash
        prev_risk = previous.get("prediction", {}).get("primary_probability", 0)
        curr_risk = current_prediction.get("primary_probability", 0)
        risk_delta = curr_risk - prev_risk
        risk_changed = abs(risk_delta) > 3.0  # More than 3% change

        notifications = []

        if risk_changed:
            if risk_delta > 0:
                notifications.append({
                    "type": "risk_increase",
                    "severity": "warning" if risk_delta > 10 else "info",
                    "title": "Risk Score Increased",
                    "message": f"Your health risk score has increased by {abs(risk_delta):.1f}% since the last assessment.",
                    "previous_risk": prev_risk,
                    "current_risk": curr_risk,
                    "delta": round(risk_delta, 1),
                })
            else:
                notifications.append({
                    "type": "risk_decrease",
                    "severity": "positive",
                    "title": "Risk Score Improved",
                    "message": f"Your health risk score has improved by {abs(risk_delta):.1f}%. Keep up the good work!",
                    "previous_risk": prev_risk,
                    "current_risk": curr_risk,
                    "delta": round(risk_delta, 1),
                })

        if data_changed and not risk_changed:
            notifications.append({
                "type": "data_updated",
                "severity": "info",
                "title": "Records Updated",
                "message": "Your health records have been updated but your risk assessment remains stable.",
            })

        # Check for condition changes
        prev_condition = previous.get("prediction", {}).get("primary_prediction", "")
        curr_condition = current_prediction.get("primary_prediction", "")
        if prev_condition != curr_condition:
            notifications.append({
                "type": "condition_change",
                "severity": "warning",
                "title": "Primary Risk Assessment Changed",
                "message": f"Your primary risk indicator has changed from '{prev_condition}' to '{curr_condition}'.",
                "previous": prev_condition,
                "current": curr_condition,
            })

        # Update stored state
        self._previous_results[consent_id] = {
            "data_hash": data_hash,
            "prediction": current_prediction,
            "timestamp": datetime.now().isoformat(),
        }

        return {
            "is_first_sync": False,
            "data_changed": data_changed,
            "risk_changed": risk_changed,
            "risk_delta": round(risk_delta, 1) if risk_changed else 0,
            "notifications": notifications,
            "last_sync": previous.get("timestamp"),
            "current_sync": datetime.now().isoformat(),
        }


# Singleton
sync_service = SyncService()
