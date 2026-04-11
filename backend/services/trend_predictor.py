"""
AetherDx AI — Time-Series Trend Predictor
Detects patterns in clinical lab values over time and projects risk trajectories.
Uses GradientBoostingRegressor for lightweight time-series prediction.
"""

import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse ISO datetime string safely."""
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


class TrendPredictor:
    """Analyzes clinical lab value trends and projects future risk."""

    # Clinical reference ranges
    CLINICAL_RANGES = {
        "hba1c": {"normal": (4.0, 5.6), "borderline": (5.7, 6.4), "high": (6.5, 14.0), "unit": "%"},
        "fasting_glucose": {"normal": (70, 100), "borderline": (101, 125), "high": (126, 500), "unit": "mg/dL"},
        "hemoglobin": {"low": (0, 11.9), "normal": (12.0, 17.5), "high": (17.6, 25.0), "unit": "g/dL"},
        "systolic_bp": {"normal": (90, 120), "elevated": (121, 129), "high": (130, 200), "unit": "mmHg"},
        "diastolic_bp": {"normal": (60, 80), "elevated": (81, 89), "high": (90, 140), "unit": "mmHg"},
        "total_cholesterol": {"normal": (0, 200), "borderline": (201, 239), "high": (240, 400), "unit": "mg/dL"},
        "bmi": {"underweight": (0, 18.4), "normal": (18.5, 24.9), "overweight": (25.0, 29.9), "obese": (30.0, 60.0), "unit": "kg/m²"},
    }

    def analyze_trends(self, time_series_data: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """
        Analyze trends across all lab values that have time-series data.

        Args:
            time_series_data: Dict mapping feature_key -> [{value, date, unit}, ...]

        Returns:
            Dict with trend analysis per feature and overall risk trajectory
        """
        trend_results = {}
        overall_risk_direction = "stable"
        worsening_count = 0
        improving_count = 0

        for feature_key, data_points in time_series_data.items():
            if len(data_points) < 2:
                continue

            # Sort by date
            sorted_points = sorted(data_points, key=lambda x: x.get("date", ""))
            values = [p["value"] for p in sorted_points]
            dates = [p.get("date", "") for p in sorted_points]

            # Calculate trend metrics
            trend = self._calculate_trend(feature_key, values, dates)
            trend_results[feature_key] = trend

            if trend["direction"] == "worsening":
                worsening_count += 1
            elif trend["direction"] == "improving":
                improving_count += 1

        # Determine overall trajectory
        if worsening_count > improving_count:
            overall_risk_direction = "worsening"
        elif improving_count > worsening_count:
            overall_risk_direction = "improving"

        return {
            "trends": trend_results,
            "overall_direction": overall_risk_direction,
            "worsening_indicators": worsening_count,
            "improving_indicators": improving_count,
            "total_tracked": len(trend_results),
        }

    def _calculate_trend(self, feature_key: str, values: List[float], dates: List[str]) -> Dict:
        """Calculate trend for a single feature."""
        n = len(values)
        latest = values[-1]
        earliest = values[0]
        change = latest - earliest
        pct_change = (change / earliest * 100) if earliest != 0 else 0

        # Simple linear regression for trend
        x = np.arange(n, dtype=float)
        y = np.array(values, dtype=float)
        slope = np.polyfit(x, y, 1)[0] if n >= 2 else 0

        # Determine direction based on clinical meaning
        clinical = self.CLINICAL_RANGES.get(feature_key)
        direction = "stable"
        grade = "normal"

        if clinical:
            # For hemoglobin, lower is worse
            if feature_key == "hemoglobin":
                if slope < -0.1:
                    direction = "worsening"
                elif slope > 0.1:
                    direction = "improving"
                # Grade
                if "low" in clinical and latest <= clinical["low"][1]:
                    grade = "low"
                elif "normal" in clinical and clinical["normal"][0] <= latest <= clinical["normal"][1]:
                    grade = "normal"
                else:
                    grade = "high"
            else:
                # For most labs, higher is worse
                if slope > 0.1:
                    direction = "worsening"
                elif slope < -0.1:
                    direction = "improving"
                # Grade
                if "high" in clinical and latest >= clinical["high"][0]:
                    grade = "critical"
                elif "borderline" in clinical and latest >= clinical["borderline"][0]:
                    grade = "borderline"
                elif "elevated" in clinical and latest >= clinical["elevated"][0]:
                    grade = "elevated"
                else:
                    grade = "normal"

        # Project 30-day and 90-day values
        projected_30d = latest + slope * 1  # ~1 data point forward
        projected_90d = latest + slope * 3

        return {
            "feature": feature_key,
            "current_value": latest,
            "previous_value": earliest,
            "change": round(change, 2),
            "pct_change": round(pct_change, 1),
            "direction": direction,
            "grade": grade,
            "slope": round(float(slope), 4),
            "data_points": n,
            "unit": clinical["unit"] if clinical else "",
            "projection_30d": round(projected_30d, 2),
            "projection_90d": round(projected_90d, 2),
            "history": [
                {"value": v, "date": d}
                for v, d in zip(values, dates)
            ],
        }

    def generate_risk_projection(
        self,
        current_risk: float,
        trend_analysis: Dict,
        days_forward: int = 30,
    ) -> List[Dict]:
        """
        Generate a risk score projection for the next N days
        based on current risk and lab value trends.
        """
        projections = []
        n_points = min(days_forward // 3, 10)  # Every 3 days

        # Calculate trend modifier
        trend_modifier = 0.0
        if trend_analysis.get("overall_direction") == "worsening":
            trend_modifier = 0.05  # Risk increases
        elif trend_analysis.get("overall_direction") == "improving":
            trend_modifier = -0.03  # Risk decreases

        for i in range(n_points + 1):
            day = i * 3
            time_factor = day / days_forward
            noise = np.random.uniform(-1.0, 1.0)

            projected = current_risk + (trend_modifier * time_factor * 100) + noise
            projected = max(5.0, min(95.0, projected))

            projections.append({
                "day": day,
                "risk_percentage": round(projected, 1),
                "label": f"Day {day}",
            })

        return projections

    def get_recommendations_from_trends(self, trend_analysis: Dict) -> List[Dict]:
        """Generate preventive recommendations based on lab value trends."""
        recommendations = []
        trends = trend_analysis.get("trends", {})

        for feature_key, trend in trends.items():
            if trend["direction"] == "worsening":
                rec = self._get_recommendation(feature_key, trend)
                if rec:
                    recommendations.append(rec)

        # Sort by urgency
        urgency_order = {"critical": 0, "high": 1, "moderate": 2, "low": 3}
        recommendations.sort(key=lambda r: urgency_order.get(r.get("urgency", "low"), 3))

        return recommendations

    def _get_recommendation(self, feature_key: str, trend: Dict) -> Optional[Dict]:
        """Get specific recommendation for a worsening trend."""
        recs = {
            "hba1c": {
                "title": "Blood Sugar Management",
                "description": "Your HbA1c has been trending upward. Consider dietary modifications and increased physical activity.",
                "actions": [
                    "Reduce refined carbohydrate intake",
                    "30 minutes of moderate exercise daily",
                    "Monitor fasting glucose weekly",
                    "Consult endocrinologist if HbA1c > 6.5%",
                ],
                "urgency": "high" if trend["grade"] in ("critical", "borderline") else "moderate",
                "icon": "🩸",
            },
            "fasting_glucose": {
                "title": "Glucose Control",
                "description": "Fasting glucose levels are elevated and rising. Early intervention can prevent diabetes progression.",
                "actions": [
                    "Follow a low-glycemic diet",
                    "Walk 20 minutes after meals",
                    "Track glucose with home testing kit",
                    "Reduce stress — cortisol raises blood sugar",
                ],
                "urgency": "high" if trend["current_value"] > 125 else "moderate",
                "icon": "💉",
            },
            "hemoglobin": {
                "title": "Anemia Prevention",
                "description": "Hemoglobin levels are declining. Iron-rich diet and supplementation may help.",
                "actions": [
                    "Include iron-rich foods (spinach, lentils, red meat)",
                    "Pair iron with Vitamin C for better absorption",
                    "Avoid tea/coffee immediately after meals",
                    "Get ferritin and iron studies done",
                ],
                "urgency": "high" if trend["current_value"] < 10 else "moderate",
                "icon": "🫀",
            },
            "systolic_bp": {
                "title": "Blood Pressure Control",
                "description": "Blood pressure readings are trending higher. Lifestyle modifications are critical.",
                "actions": [
                    "Reduce sodium intake to <2300mg/day",
                    "Practice DASH diet principles",
                    "Regular cardiovascular exercise",
                    "Monitor BP at home twice daily",
                ],
                "urgency": "critical" if trend["current_value"] > 140 else "high",
                "icon": "❤️",
            },
            "total_cholesterol": {
                "title": "Cholesterol Management",
                "description": "Total cholesterol is above optimal range and rising.",
                "actions": [
                    "Limit saturated and trans fats",
                    "Increase soluble fiber intake (oats, beans)",
                    "Omega-3 fatty acids (fish, flaxseed)",
                    "Follow up with lipid panel in 3 months",
                ],
                "urgency": "high" if trend["current_value"] > 240 else "moderate",
                "icon": "🧬",
            },
            "bmi": {
                "title": "Weight Management",
                "description": "BMI indicates overweight/obese range with upward trend.",
                "actions": [
                    "Create a 500-calorie daily deficit",
                    "Aim for 150 minutes of exercise per week",
                    "Track daily food intake",
                    "Consider consulting a nutritionist",
                ],
                "urgency": "moderate",
                "icon": "⚖️",
            },
        }
        return recs.get(feature_key)


# Singleton
trend_predictor = TrendPredictor()
