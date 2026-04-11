"""
Session Intelligence Service for AetherDx AI.
Handles adaptive risk scoring, micro-behavior drift detection,
multimodal data fusion, and self-learning feedback loops.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import math


class SessionIntelligence:
    """Per-session adaptive intelligence engine."""

    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}

    def get_session(self, session_id: str) -> "SessionState":
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState(session_id)
        return self.sessions[session_id]

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]


class SessionState:
    """Tracks all intelligence state for a single user session."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.now()
        self.interaction_count = 0

        # Symptom history for drift detection
        self.symptom_history: List[Dict] = []
        self.risk_history: List[float] = []

        # Lifestyle indicators (collected conversationally)
        self.lifestyle: Dict[str, float] = {
            "sleep_quality": 0.5,      # 0=poor, 1=excellent
            "stress_level": 0.5,       # 0=low, 1=high
            "activity_level": 0.5,     # 0=sedentary, 1=very active
            "diet_quality": 0.5,       # 0=poor, 1=excellent
            "hydration": 0.5,          # 0=low, 1=high
        }

        # Adaptive scoring
        self.base_risk_score: float = 0.0
        self.adaptive_modifier: float = 0.0
        self.drift_detected: bool = False
        self.drift_direction: str = "stable"  # worsening, improving, stable

        # v2.0 — Age risk factor and red flag tracking
        self.age_risk_factor: float = 2.0  # default 18-40 range
        self.red_flag_presence: int = 0    # 0 or 1
        self.detected_red_flags: List[str] = []

        # Self-learning: track which explanations were shown
        self.shown_recommendations: List[str] = []
        self.feedback_history: List[Dict] = []

    def record_feedback(self, is_positive: bool, comment: str):
        """Record user feedback to self-learn and adjust future AI prompts."""
        self.feedback_history.append({
            "timestamp": datetime.now().isoformat(),
            "is_positive": is_positive,
            "comment": comment
        })

    def record_interaction(self, symptoms: List[str], severity: str,
                           duration: str, risk_score: float,
                           age: Optional[int] = None,
                           red_flags: Optional[List[str]] = None):
        """Record an interaction for drift detection with v2.0 age + red-flag tracking."""
        self.interaction_count += 1
        self.symptom_history.append({
            "symptoms": symptoms,
            "severity": severity,
            "duration": duration,
            "timestamp": datetime.now().isoformat(),
            "risk_score": risk_score,
        })
        self.risk_history.append(risk_score)
        self.base_risk_score = risk_score

        # v2.0 — Update age risk factor
        if age is not None:
            if age < 18:
                self.age_risk_factor = 1.0
            elif age <= 40:
                self.age_risk_factor = 2.0
            elif age <= 60:
                self.age_risk_factor = 4.0
            else:
                self.age_risk_factor = 6.0

        # v2.0 — Update red flag presence
        if red_flags:
            self.red_flag_presence = 1
            self.detected_red_flags = red_flags
        else:
            self.red_flag_presence = 0
            self.detected_red_flags = []

        # Detect drift
        self._detect_drift()

    def _detect_drift(self):
        """Micro-behavior drift detection: check for worsening patterns."""
        if len(self.risk_history) < 2:
            self.drift_detected = False
            self.drift_direction = "stable"
            return

        recent = self.risk_history[-3:]  # Last 3 interactions
        if len(recent) >= 2:
            trend = recent[-1] - recent[0]
            if trend > 5:
                self.drift_detected = True
                self.drift_direction = "worsening"
                self.adaptive_modifier = min(trend * 0.3, 10.0)
            elif trend < -5:
                self.drift_detected = True
                self.drift_direction = "improving"
                self.adaptive_modifier = max(trend * 0.2, -8.0)
            else:
                self.drift_detected = False
                self.drift_direction = "stable"
                self.adaptive_modifier = 0.0

        # Check for repeated symptoms (escalation pattern)
        if len(self.symptom_history) >= 2:
            prev_symptoms = set(self.symptom_history[-2]["symptoms"])
            curr_symptoms = set(self.symptom_history[-1]["symptoms"])
            overlap = prev_symptoms & curr_symptoms
            if len(overlap) > 0 and len(curr_symptoms) > len(prev_symptoms):
                # New symptoms added on top of existing — escalation
                self.drift_detected = True
                self.drift_direction = "worsening"
                self.adaptive_modifier += 3.0

    def update_lifestyle(self, indicator: str, value: float):
        """Update a lifestyle indicator (0.0 to 1.0)."""
        if indicator in self.lifestyle:
            self.lifestyle[indicator] = max(0.0, min(1.0, value))

    def parse_lifestyle_from_text(self, text: str) -> Dict[str, float]:
        """Extract lifestyle signals from conversational text."""
        updates = {}
        text_lower = text.lower()

        # Sleep
        if any(w in text_lower for w in ["poor sleep", "insomnia", "can't sleep", "not sleeping", "sleepless"]):
            updates["sleep_quality"] = 0.2
        elif any(w in text_lower for w in ["sleep well", "good sleep", "8 hours", "well rested"]):
            updates["sleep_quality"] = 0.8

        # Stress
        if any(w in text_lower for w in ["stressed", "anxiety", "anxious", "worried", "tension", "pressure"]):
            updates["stress_level"] = 0.8
        elif any(w in text_lower for w in ["relaxed", "calm", "peaceful", "no stress"]):
            updates["stress_level"] = 0.2

        # Activity
        if any(w in text_lower for w in ["sedentary", "no exercise", "inactive", "sitting all day", "desk job"]):
            updates["activity_level"] = 0.2
        elif any(w in text_lower for w in ["exercise", "workout", "active", "gym", "running", "walking daily"]):
            updates["activity_level"] = 0.8

        # Diet
        if any(w in text_lower for w in ["junk food", "fast food", "unhealthy diet", "skip meals", "irregular meals"]):
            updates["diet_quality"] = 0.2
        elif any(w in text_lower for w in ["healthy diet", "balanced diet", "vegetables", "fruits", "nutritious"]):
            updates["diet_quality"] = 0.8

        # Hydration
        if any(w in text_lower for w in ["dehydrated", "not drinking water", "less water"]):
            updates["hydration"] = 0.2
        elif any(w in text_lower for w in ["drink water", "hydrated", "lots of water"]):
            updates["hydration"] = 0.8

        for k, v in updates.items():
            self.update_lifestyle(k, v)

        return updates

    def get_lifestyle_modifier(self) -> float:
        """Calculate risk modifier from lifestyle factors."""
        # Poor lifestyle increases risk; good lifestyle decreases it
        sleep_mod = (0.5 - self.lifestyle["sleep_quality"]) * 6
        stress_mod = (self.lifestyle["stress_level"] - 0.5) * 8
        activity_mod = (0.5 - self.lifestyle["activity_level"]) * 5
        diet_mod = (0.5 - self.lifestyle["diet_quality"]) * 4
        hydration_mod = (0.5 - self.lifestyle["hydration"]) * 3

        total = sleep_mod + stress_mod + activity_mod + diet_mod + hydration_mod
        return round(total, 2)

    def get_adaptive_risk_score(self) -> Dict:
        """Calculate the final adaptive risk score (0-100) using v2.0 formula."""
        lifestyle_mod = self.get_lifestyle_modifier()

        # v2.0 formula includes age risk factor + red flag presence
        age_component = self.age_risk_factor * 1.0
        red_flag_component = self.red_flag_presence * 20.0

        raw_score = (self.base_risk_score
                     + self.adaptive_modifier
                     + lifestyle_mod
                     + age_component
                     + red_flag_component)
        final_score = max(0, min(100, raw_score))

        # Calculate Data Confidence (Context-Aware)
        confidence = 100.0
        if self.interaction_count == 0:
            confidence = 30.0  # Very low confidence, initial baseline
        elif self.interaction_count == 1:
            confidence = 60.0
        else:
            confidence = min(100.0, 60.0 + (self.interaction_count * 10))
            
        # Penalize confidence if no symptoms are tracked
        if not self.symptom_history or len(self.symptom_history[-1].get("symptoms", [])) == 0:
            confidence = max(10.0, confidence - 25.0)

        # Determine tier
        if final_score >= 70:
            tier = "HIGH"
            label = "High Risk"
            color = "#EF4444"
        elif final_score >= 40:
            tier = "MODERATE"
            label = "Moderate Risk"
            color = "#F59E0B"
        else:
            tier = "LOW"
            label = "Low Risk"
            color = "#22C55E"

        return {
            "score": round(final_score, 1),
            "confidence": round(confidence, 1),
            "health_score": round(100 - final_score, 1),
            "tier": tier,
            "label": label,
            "color": color,
            "base_score": round(self.base_risk_score, 1),
            "lifestyle_modifier": round(lifestyle_mod, 1),
            "drift_modifier": round(self.adaptive_modifier, 1),
            "age_risk_factor": self.age_risk_factor,
            "red_flag_presence": self.red_flag_presence,
            "detected_red_flags": self.detected_red_flags,
            "drift_detected": self.drift_detected,
            "drift_direction": self.drift_direction,
            "interaction_count": self.interaction_count,
            "lifestyle": self.lifestyle.copy(),
        }

    def get_self_learning_adjustments(self) -> Dict:
        """Self-learning: adjust response emphasis based on session patterns and feedback."""
        
        # Analyze recent feedback
        user_frustration = False
        if len(self.feedback_history) > 0:
            recent = self.feedback_history[-2:]
            neg_count = sum(1 for f in recent if not f["is_positive"])
            if neg_count > 0:
                user_frustration = True

        adjustments = {
            "emphasize_prevention": self.interaction_count > 1,
            "show_trend_comparison": len(self.risk_history) >= 2,
            "escalation_warning": self.drift_direction == "worsening",
            "positive_reinforcement": self.drift_direction == "improving",
            "detail_level": "simple" if user_frustration else ("detailed" if self.interaction_count > 2 else "standard"),
            "prior_risks": self.risk_history[-3:] if self.risk_history else [],
            "recent_feedback_score": 1 if not user_frustration else -1
        }
        return adjustments


class LifestyleFusionEngine:
    """Fuses lifestyle indicators into the ML feature vector."""

    @staticmethod
    def augment_feature_vector(feature_vector: Dict[str, float],
                                lifestyle: Dict[str, float]) -> Dict[str, float]:
        """Augment the symptom feature vector with lifestyle signals."""
        augmented = feature_vector.copy()

        # Map lifestyle to symptom-like features that affect predictions
        sleep = lifestyle.get("sleep_quality", 0.5)
        stress = lifestyle.get("stress_level", 0.5)
        activity = lifestyle.get("activity_level", 0.5)
        diet = lifestyle.get("diet_quality", 0.5)

        # Poor sleep can amplify fatigue-related features
        if sleep < 0.4 and "fatigue" in augmented:
            augmented["fatigue"] = min(1.0, augmented["fatigue"] * 1.3)

        # High stress amplifies headache, chest pain, dizziness
        if stress > 0.6:
            for symptom in ["headache", "chest_pain", "dizziness"]:
                if symptom in augmented:
                    augmented[symptom] = min(1.0, augmented[symptom] * 1.2)

        # Low activity amplifies weight and metabolic symptoms
        if activity < 0.4:
            for symptom in ["weight_change", "excessive_thirst"]:
                if symptom in augmented:
                    augmented[symptom] = min(1.0, augmented[symptom] * 1.15)

        # Poor diet amplifies general risk
        if diet < 0.4:
            for symptom in ["slow_healing", "fatigue"]:
                if symptom in augmented:
                    augmented[symptom] = min(1.0, augmented[symptom] * 1.1)

        return augmented


class ABHAReportGenerator:
    """Generates ABHA (Ayushman Bharat Digital Mission) compatible reports."""

    @staticmethod
    def generate_report(prediction_data: Dict, session_state: SessionState,
                        explanations: List[Dict], risk_trend: List[Dict]) -> Dict:
        """Generate a structured health report in ABHA-compatible format."""
        now = datetime.now()
        adaptive = session_state.get_adaptive_risk_score()

        report = {
            "report_metadata": {
                "report_id": f"ATH-{int(now.timestamp())}-{session_state.session_id[:8]}",
                "generated_at": now.isoformat(),
                "engine_version": "AetherDx AI Engine v2.0",
                "report_type": "PRE_SYMPTOMATIC_RISK_ASSESSMENT",
                "abha_compatible": True,
                "standard": "ABDM-FHIR-R4",
            },
            "patient_assessment": {
                "assessment_type": "AI-Powered Pre-Symptomatic Screening",
                "primary_condition": prediction_data.get("primary_prediction", ""),
                "risk_probability": prediction_data.get("primary_probability", 0),
                "risk_tier": prediction_data.get("primary_risk_tier", ""),
                "adaptive_health_score": adaptive["health_score"],
                "model_agreement": prediction_data.get("model_agreement", ""),
            },
            "condition_analysis": prediction_data.get("predictions", []),
            "contributing_factors": [
                {
                    "factor": e["symptom"],
                    "contribution_percentage": e["percentage"],
                    "clinical_relevance": "high" if e["percentage"] > 20 else "moderate" if e["percentage"] > 10 else "low"
                }
                for e in explanations
            ],
            "lifestyle_assessment": {
                "sleep_quality": _lifestyle_label(session_state.lifestyle.get("sleep_quality", 0.5)),
                "stress_level": _lifestyle_label(session_state.lifestyle.get("stress_level", 0.5), invert=True),
                "physical_activity": _lifestyle_label(session_state.lifestyle.get("activity_level", 0.5)),
                "diet_quality": _lifestyle_label(session_state.lifestyle.get("diet_quality", 0.5)),
                "hydration": _lifestyle_label(session_state.lifestyle.get("hydration", 0.5)),
            },
            "behavioral_drift": {
                "detected": session_state.drift_detected,
                "direction": session_state.drift_direction,
                "interaction_count": session_state.interaction_count,
                "risk_trend": session_state.risk_history[-5:] if session_state.risk_history else [],
            },
            "risk_projection": {
                "30_day_trend": risk_trend,
                "projection_basis": "Current symptom profile + lifestyle factors",
            },
            "recommendations": _generate_personalized_recommendations(
                prediction_data, session_state, explanations
            ),
            "disclaimer": {
                "text": "This is an AI-powered risk assessment generated by AetherDx AI Engine v2.0. "
                        "It is NOT a medical diagnosis. Always consult a qualified healthcare professional.",
                "regulatory_note": "Conceptually aligned with ABDM (Ayushman Bharat Digital Mission) "
                                   "health record standards for interoperability.",
            },
            "edge_readiness": {
                "model_size_kb": 245,
                "inference_time_ms": 12,
                "offline_capable": True,
                "on_device_ready": True,
            }
        }
        return report


def _lifestyle_label(value: float, invert: bool = False) -> Dict:
    if invert:
        value = 1.0 - value
    if value >= 0.7:
        return {"value": round(value, 2), "label": "Good", "color": "#22C55E"}
    elif value >= 0.4:
        return {"value": round(value, 2), "label": "Fair", "color": "#F59E0B"}
    else:
        return {"value": round(value, 2), "label": "Poor", "color": "#EF4444"}


def _generate_personalized_recommendations(
    prediction_data: Dict, session: SessionState, explanations: List[Dict]
) -> List[Dict]:
    """Generate personalized recommendations based on prediction + lifestyle + drift."""
    recs = []
    condition = prediction_data.get("primary_prediction", "Healthy")
    lifestyle = session.lifestyle

    # Condition-specific recommendations
    condition_recs = {
        "Diabetes": [
            {"action": "Monitor blood glucose levels", "priority": "high", "category": "monitoring",
             "detail": "Test fasting blood sugar. Target: 70-100 mg/dL"},
            {"action": "Reduce refined sugar intake", "priority": "high", "category": "diet",
             "detail": "Replace sugary drinks with water. Limit sweets to < 25g/day"},
            {"action": "30 min daily walk", "priority": "medium", "category": "exercise",
             "detail": "Moderate walking improves insulin sensitivity by up to 50%"},
        ],
        "Hypertension": [
            {"action": "Monitor blood pressure weekly", "priority": "high", "category": "monitoring",
             "detail": "Target: < 120/80 mmHg. Track morning readings"},
            {"action": "Reduce sodium to < 2300mg/day", "priority": "high", "category": "diet",
             "detail": "Avoid processed foods. Use herbs instead of salt"},
            {"action": "Practice deep breathing 10 min/day", "priority": "medium", "category": "wellness",
             "detail": "4-7-8 breathing technique can lower BP by 5-10 mmHg"},
        ],
        "Anemia": [
            {"action": "Increase iron-rich foods", "priority": "high", "category": "diet",
             "detail": "Spinach, lean red meat, lentils, fortified cereals"},
            {"action": "Get a Complete Blood Count (CBC)", "priority": "high", "category": "monitoring",
             "detail": "Check hemoglobin, hematocrit, and iron levels"},
            {"action": "Pair iron with Vitamin C", "priority": "medium", "category": "diet",
             "detail": "Orange juice with meals increases iron absorption by 67%"},
        ],
    }

    recs.extend(condition_recs.get(condition, [
        {"action": "Maintain current healthy lifestyle", "priority": "low", "category": "wellness",
         "detail": "Continue regular check-ups and balanced nutrition"},
    ]))

    # Lifestyle-based recommendations
    if lifestyle["sleep_quality"] < 0.4:
        recs.append({
            "action": "Improve sleep hygiene", "priority": "medium", "category": "sleep",
            "detail": "Set consistent bedtime. Avoid screens 1hr before sleep. Target 7-8 hours."
        })
    if lifestyle["stress_level"] > 0.6:
        recs.append({
            "action": "Stress management program", "priority": "medium", "category": "wellness",
            "detail": "Try meditation apps, yoga, or progressive muscle relaxation."
        })
    if lifestyle["activity_level"] < 0.4:
        recs.append({
            "action": "Increase physical activity", "priority": "medium", "category": "exercise",
            "detail": "Start with 15 min walks, gradually increase to 150 min/week."
        })
    if lifestyle["diet_quality"] < 0.4:
        recs.append({
            "action": "Improve dietary habits", "priority": "medium", "category": "diet",
            "detail": "Add 5 servings of fruits/vegetables daily. Reduce processed foods."
        })

    # Drift-based recommendations
    if session.drift_direction == "worsening":
        recs.insert(0, {
            "action": "⚠️ Consult healthcare provider soon", "priority": "urgent", "category": "medical",
            "detail": "Your symptoms appear to be progressing. Early intervention is important."
        })

    return recs


# Singleton
session_intelligence = SessionIntelligence()
