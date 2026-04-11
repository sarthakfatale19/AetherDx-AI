"""
Form Intelligence Engine for AetherDx AI.
Converts structured form inputs into ML features, detects emergencies,
calculates real-time scores, and generates explainable action plans.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from data.symptoms_data import (
    SYMPTOM_FEATURES, SYMPTOM_ALIASES, SYMPTOM_INDEX,
    SEVERITY_MAP, DURATION_MAP
)
from models.form_models import (
    FullAssessmentInput, RealtimeAssessmentInput, VitalSigns,
    BodyMetrics, SymptomEntry, LifestyleBlock,
    EMERGENCY_THRESHOLDS, COMPOUND_EMERGENCIES
)


# ── Emergency Detection ──

def detect_emergency(
    vitals: Optional[VitalSigns],
    symptoms: Optional[List[SymptomEntry]]
) -> Dict:
    """Check for emergency conditions that require immediate medical attention."""
    alerts = []
    is_emergency = False

    if vitals:
        if vitals.spo2 is not None and vitals.spo2 < EMERGENCY_THRESHOLDS["spo2_critical"]:
            alerts.append({
                "type": "critical_vital",
                "field": "SpO2",
                "value": vitals.spo2,
                "threshold": EMERGENCY_THRESHOLDS["spo2_critical"],
                "message": f"Dangerously low oxygen saturation ({vitals.spo2}%). Seek immediate medical help."
            })
            is_emergency = True

        if vitals.temperature_f is not None and vitals.temperature_f > EMERGENCY_THRESHOLDS["temp_critical_f"]:
            alerts.append({
                "type": "critical_vital",
                "field": "Temperature",
                "value": vitals.temperature_f,
                "threshold": EMERGENCY_THRESHOLDS["temp_critical_f"],
                "message": f"Extremely high fever ({vitals.temperature_f}°F). This is a medical emergency."
            })
            is_emergency = True

        if vitals.heart_rate is not None:
            if vitals.heart_rate > EMERGENCY_THRESHOLDS["hr_high"]:
                alerts.append({
                    "type": "critical_vital",
                    "field": "Heart Rate",
                    "value": vitals.heart_rate,
                    "threshold": EMERGENCY_THRESHOLDS["hr_high"],
                    "message": f"Dangerously high heart rate ({vitals.heart_rate} bpm)."
                })
                is_emergency = True
            elif vitals.heart_rate < EMERGENCY_THRESHOLDS["hr_low"]:
                alerts.append({
                    "type": "critical_vital",
                    "field": "Heart Rate",
                    "value": vitals.heart_rate,
                    "threshold": EMERGENCY_THRESHOLDS["hr_low"],
                    "message": f"Dangerously low heart rate ({vitals.heart_rate} bpm)."
                })
                is_emergency = True

        if vitals.bp_systolic is not None and vitals.bp_systolic >= EMERGENCY_THRESHOLDS["bp_systolic_high"]:
            alerts.append({
                "type": "critical_vital",
                "field": "Blood Pressure",
                "value": f"{vitals.bp_systolic}/{vitals.bp_diastolic or '?'}",
                "message": "Hypertensive crisis detected. Seek immediate care."
            })
            is_emergency = True

    # Check compound symptom emergencies
    if symptoms:
        symptom_keys = set()
        for s in symptoms:
            resolved = SYMPTOM_ALIASES.get(s.symptom.lower(), s.symptom.lower()).replace(" ", "_")
            symptom_keys.add(resolved)
            # Severe chest pain alone is a flag
            if resolved == "chest_pain" and s.severity >= 8:
                alerts.append({
                    "type": "severe_symptom",
                    "field": "Chest Pain",
                    "value": s.severity,
                    "message": "Severe chest pain reported. Please seek immediate medical evaluation."
                })
                is_emergency = True

        for compound in COMPOUND_EMERGENCIES:
            if all(sym in symptom_keys for sym in compound["symptoms"]):
                # Check if at least one has high severity
                high_sev = any(
                    s.severity >= 7 for s in symptoms
                    if SYMPTOM_ALIASES.get(s.symptom.lower(), s.symptom.lower()).replace(" ", "_") in compound["symptoms"]
                )
                if high_sev:
                    alerts.append({
                        "type": "compound_emergency",
                        "symptoms": compound["symptoms"],
                        "message": compound["reason"]
                    })
                    is_emergency = True

    return {
        "is_emergency": is_emergency,
        "alerts": alerts,
        "action": "CALL_EMERGENCY" if is_emergency else "CONTINUE",
        "emergency_number": "112",
        "message": "Please call emergency services immediately or visit the nearest hospital." if is_emergency else None
    }


# ── Derived Features ──

def derive_secondary_features(
    vitals: Optional[VitalSigns],
    body_metrics: Optional[BodyMetrics]
) -> Dict:
    """Calculate BMI, tachycardia flags, and other derived clinical indicators."""
    derived = {}

    if body_metrics:
        bmi = body_metrics.get_bmi()
        if bmi is not None:
            derived["bmi"] = bmi
            derived["bmi_category"] = body_metrics.get_bmi_category()
            derived["bmi_risk"] = "high" if bmi >= 30 or bmi < 18.5 else "moderate" if bmi >= 25 else "low"

    if vitals:
        if vitals.heart_rate is not None:
            derived["tachycardia"] = vitals.heart_rate > 100
            derived["bradycardia"] = vitals.heart_rate < 60

        if vitals.bp_systolic is not None and vitals.bp_diastolic is not None:
            derived["hypertension"] = vitals.bp_systolic >= 140 or vitals.bp_diastolic >= 90
            derived["hypotension"] = vitals.bp_systolic < 90

        if vitals.temperature_f is not None:
            derived["fever"] = vitals.temperature_f > 100.4
            derived["high_fever"] = vitals.temperature_f > 102.0

        if vitals.spo2 is not None:
            derived["low_oxygen"] = vitals.spo2 < 95

    return derived


# ── Compound Risk Detection ──

def detect_compound_risks(
    symptoms: Optional[List[SymptomEntry]],
    derived: Dict
) -> List[Dict]:
    """Identify high-risk symptom combinations that elevate clinical concern."""
    risks = []
    if not symptoms:
        return risks

    symptom_keys = set()
    for s in symptoms:
        resolved = SYMPTOM_ALIASES.get(s.symptom.lower(), s.symptom.lower()).replace(" ", "_")
        symptom_keys.add(resolved)

    # Diabetes compound
    diabetes_signals = {"excessive_thirst", "frequent_urination", "fatigue", "blurred_vision"}
    overlap_d = symptom_keys & diabetes_signals
    if len(overlap_d) >= 2:
        risks.append({
            "risk": "Diabetes Compound Risk",
            "signals": list(overlap_d),
            "severity": "high" if len(overlap_d) >= 3 else "moderate",
            "detail": f"{len(overlap_d)} diabetes-associated symptoms detected simultaneously"
        })

    # Cardiovascular compound
    cardio_signals = {"chest_pain", "shortness_of_breath", "dizziness", "headache"}
    overlap_c = symptom_keys & cardio_signals
    if len(overlap_c) >= 2:
        risks.append({
            "risk": "Cardiovascular Compound Risk",
            "signals": list(overlap_c),
            "severity": "high" if len(overlap_c) >= 3 else "moderate",
            "detail": f"{len(overlap_c)} cardiovascular-associated symptoms present"
        })

    # Anemia compound
    anemia_signals = {"fatigue", "pale_skin", "dizziness", "cold_hands", "shortness_of_breath"}
    overlap_a = symptom_keys & anemia_signals
    if len(overlap_a) >= 2:
        risks.append({
            "risk": "Anemia Compound Risk",
            "signals": list(overlap_a),
            "severity": "high" if len(overlap_a) >= 3 else "moderate",
            "detail": f"{len(overlap_a)} anemia-associated symptoms detected"
        })

    # BMI + metabolic
    if derived.get("bmi_risk") == "high" and "fatigue" in symptom_keys:
        risks.append({
            "risk": "Metabolic Syndrome Indicator",
            "signals": ["high_bmi", "fatigue"],
            "severity": "moderate",
            "detail": "Elevated BMI combined with fatigue suggests metabolic risk"
        })

    return risks


# ── Feature Vector Normalization ──

def normalize_form_to_features(
    symptoms: Optional[List[SymptomEntry]]
) -> np.ndarray:
    """Map structured symptom entries to the 15-feature ML vector."""
    features = np.zeros(len(SYMPTOM_FEATURES))

    if not symptoms:
        return features

    for entry in symptoms:
        symptom_key = entry.symptom.lower().replace(" ", "_")
        resolved = SYMPTOM_ALIASES.get(symptom_key.replace("_", " "), symptom_key)
        resolved = resolved.replace(" ", "_")

        if resolved in SYMPTOM_INDEX:
            idx = SYMPTOM_INDEX[resolved]
            # Normalize severity from 0-10 to 0-1
            severity_norm = entry.severity / 10.0
            duration_weight = DURATION_MAP.get(entry.duration, 0.8)
            # Trend modifier
            trend_mod = {"improving": 0.8, "stable": 1.0, "worsening": 1.2}.get(entry.trend, 1.0)
            features[idx] = min(1.0, severity_norm * duration_weight * trend_mod)

    return features


# ── Real-time Score Calculation ──

def calculate_realtime_score(
    vitals: Optional[VitalSigns],
    body_metrics: Optional[BodyMetrics],
    symptoms: Optional[List[SymptomEntry]],
    lifestyle: Optional[LifestyleBlock]
) -> Dict:
    """Calculate an incremental risk score from partial form data (0-100)."""
    score = 0.0
    factors = []
    max_possible = 0.0

    # Vitals contribution (up to 30 points)
    if vitals:
        if vitals.temperature_f is not None:
            max_possible += 8
            if vitals.temperature_f > 102:
                score += 8
                factors.append({"name": "High Fever", "points": 8, "color": "#EF4444"})
            elif vitals.temperature_f > 100.4:
                score += 4
                factors.append({"name": "Fever", "points": 4, "color": "#F59E0B"})
            else:
                factors.append({"name": "Normal Temp", "points": 0, "color": "#22C55E"})

        if vitals.heart_rate is not None:
            max_possible += 7
            if vitals.heart_rate > 120 or vitals.heart_rate < 50:
                score += 7
                factors.append({"name": "Abnormal HR", "points": 7, "color": "#EF4444"})
            elif vitals.heart_rate > 100 or vitals.heart_rate < 60:
                score += 3
                factors.append({"name": "Elevated HR", "points": 3, "color": "#F59E0B"})
            else:
                factors.append({"name": "Normal HR", "points": 0, "color": "#22C55E"})

        if vitals.spo2 is not None:
            max_possible += 10
            if vitals.spo2 < 92:
                score += 10
                factors.append({"name": "Low SpO2", "points": 10, "color": "#EF4444"})
            elif vitals.spo2 < 95:
                score += 5
                factors.append({"name": "Reduced SpO2", "points": 5, "color": "#F59E0B"})
            else:
                factors.append({"name": "Normal SpO2", "points": 0, "color": "#22C55E"})

        if vitals.bp_systolic is not None:
            max_possible += 5
            if vitals.bp_systolic >= 160 or vitals.bp_systolic < 90:
                score += 5
                factors.append({"name": "Abnormal BP", "points": 5, "color": "#EF4444"})
            elif vitals.bp_systolic >= 140:
                score += 3
                factors.append({"name": "High BP", "points": 3, "color": "#F59E0B"})
            else:
                factors.append({"name": "Normal BP", "points": 0, "color": "#22C55E"})

    # Body metrics contribution (up to 10 points)
    if body_metrics:
        bmi = body_metrics.get_bmi()
        if bmi is not None:
            max_possible += 10
            if bmi >= 35 or bmi < 16:
                score += 10
                factors.append({"name": "Critical BMI", "points": 10, "color": "#EF4444"})
            elif bmi >= 30 or bmi < 18.5:
                score += 6
                factors.append({"name": "Unhealthy BMI", "points": 6, "color": "#F59E0B"})
            elif bmi >= 25:
                score += 3
                factors.append({"name": "Overweight", "points": 3, "color": "#F59E0B"})
            else:
                factors.append({"name": "Normal BMI", "points": 0, "color": "#22C55E"})

    # Symptoms contribution (up to 50 points)
    if symptoms:
        max_possible += 50
        symptom_score = 0
        for entry in symptoms:
            # Each symptom contributes based on severity and trend
            base = (entry.severity / 10.0) * 5  # max 5 per symptom
            trend_mod = {"worsening": 1.3, "stable": 1.0, "improving": 0.7}.get(entry.trend, 1.0)
            symptom_score += base * trend_mod
        symptom_score = min(50, symptom_score)
        score += symptom_score
        if symptom_score > 30:
            factors.append({"name": "High Symptom Load", "points": round(symptom_score, 1), "color": "#EF4444"})
        elif symptom_score > 15:
            factors.append({"name": "Moderate Symptoms", "points": round(symptom_score, 1), "color": "#F59E0B"})
        elif symptom_score > 0:
            factors.append({"name": "Mild Symptoms", "points": round(symptom_score, 1), "color": "#22C55E"})

    # Lifestyle modifier (up to 10 points penalty)
    if lifestyle:
        max_possible += 10
        lifestyle_penalty = 0
        norms = lifestyle.to_normalized()
        if norms.get("sleep_quality", 0.5) < 0.4:
            lifestyle_penalty += 2
        if norms.get("stress_level", 0.5) > 0.7:
            lifestyle_penalty += 3
        if norms.get("activity_level", 0.5) < 0.3:
            lifestyle_penalty += 2
        if norms.get("diet_quality", 0.5) < 0.3:
            lifestyle_penalty += 2
        if norms.get("hydration", 0.5) < 0.3:
            lifestyle_penalty += 1
        score += lifestyle_penalty
        if lifestyle_penalty > 5:
            factors.append({"name": "Poor Lifestyle", "points": lifestyle_penalty, "color": "#F59E0B"})
        elif lifestyle_penalty > 0:
            factors.append({"name": "Lifestyle Risk", "points": lifestyle_penalty, "color": "#F59E0B"})

    # Normalize to 0-100
    if max_possible > 0:
        normalized = (score / max_possible) * 100
    else:
        normalized = 0

    normalized = max(0, min(100, normalized))

    # Tier
    if normalized >= 75:
        tier = "CRITICAL"
        label = "Critical Risk"
        color = "#EF4444"
    elif normalized >= 50:
        tier = "HIGH"
        label = "High Risk"
        color = "#F97316"
    elif normalized >= 25:
        tier = "MODERATE"
        label = "Moderate Risk"
        color = "#F59E0B"
    else:
        tier = "LOW"
        label = "Low Risk"
        color = "#22C55E"

    return {
        "score": round(normalized, 1),
        "health_score": round(100 - normalized, 1),
        "tier": tier,
        "label": label,
        "color": color,
        "factors": factors,
        "inputs_provided": max_possible > 0,
    }


# ── Explainable Reasoning ──

def generate_form_explanation(
    score_data: Dict,
    derived: Dict,
    compound_risks: List[Dict],
    symptoms: Optional[List[SymptomEntry]]
) -> List[Dict]:
    """Generate human-readable reasoning for the assessment score."""
    reasons = []

    for factor in score_data.get("factors", []):
        if factor["points"] > 0:
            reasons.append({
                "factor": factor["name"],
                "impact": "high" if factor["points"] >= 7 else "moderate" if factor["points"] >= 3 else "low",
                "points": factor["points"],
                "color": factor["color"],
            })

    for risk in compound_risks:
        reasons.append({
            "factor": risk["risk"],
            "impact": risk["severity"],
            "detail": risk["detail"],
            "color": "#EF4444" if risk["severity"] == "high" else "#F59E0B",
        })

    if derived.get("fever"):
        reasons.append({
            "factor": "Fever Detected",
            "impact": "high" if derived.get("high_fever") else "moderate",
            "detail": "Elevated body temperature indicates possible infection or inflammation",
            "color": "#EF4444" if derived.get("high_fever") else "#F59E0B",
        })

    if derived.get("hypertension"):
        reasons.append({
            "factor": "Hypertension Indicator",
            "impact": "moderate",
            "detail": "Blood pressure readings suggest hypertensive state",
            "color": "#F59E0B",
        })

    return reasons


# ── Action Plan Generator ──

def generate_action_plan(
    score_data: Dict,
    derived: Dict,
    compound_risks: List[Dict],
    emergency: Dict,
    symptoms: Optional[List[SymptomEntry]]
) -> Dict:
    """Generate a personalized action plan based on the full assessment."""
    actions = []
    urgency = "routine"

    if emergency["is_emergency"]:
        urgency = "emergency"
        actions.append({
            "category": "emergency",
            "icon": "🚨",
            "action": "Seek Immediate Medical Attention",
            "detail": "Critical health indicators detected. Call emergency services (112) or visit the nearest emergency room immediately.",
            "priority": 1,
        })

    tier = score_data.get("tier", "LOW")
    if tier == "CRITICAL":
        urgency = "urgent" if urgency != "emergency" else urgency
        actions.append({
            "category": "medical",
            "icon": "🏥",
            "action": "Schedule Doctor Visit Within 24 Hours",
            "detail": "Your risk score indicates multiple concerning indicators. Professional evaluation is strongly recommended.",
            "priority": 2,
        })
    elif tier == "HIGH":
        urgency = "soon" if urgency == "routine" else urgency
        actions.append({
            "category": "medical",
            "icon": "👨‍⚕️",
            "action": "Consult Healthcare Provider This Week",
            "detail": "Several risk factors warrant professional assessment. Don't delay scheduling.",
            "priority": 2,
        })

    # BMI actions
    if derived.get("bmi_risk") == "high":
        bmi = derived.get("bmi", 0)
        if bmi >= 30:
            actions.append({
                "category": "lifestyle",
                "icon": "⚖️",
                "action": "Weight Management Program",
                "detail": f"BMI of {bmi} (Obese). Consider consulting a dietitian for a structured plan.",
                "priority": 3,
            })
        elif bmi < 18.5:
            actions.append({
                "category": "lifestyle",
                "icon": "🍽️",
                "action": "Nutritional Assessment Needed",
                "detail": f"BMI of {bmi} (Underweight). Ensure adequate caloric and nutrient intake.",
                "priority": 3,
            })

    # Compound risk actions
    for risk in compound_risks:
        if "Diabetes" in risk["risk"]:
            actions.append({
                "category": "monitoring",
                "icon": "🩸",
                "action": "Get Fasting Blood Glucose Test",
                "detail": "Multiple diabetes-associated symptoms detected. A simple blood test can rule out or confirm risk.",
                "priority": 3,
            })
        if "Cardiovascular" in risk["risk"]:
            actions.append({
                "category": "monitoring",
                "icon": "❤️",
                "action": "Cardiovascular Screening Recommended",
                "detail": "Symptom combination suggests cardiovascular evaluation. Consider ECG and BP monitoring.",
                "priority": 3,
            })
        if "Anemia" in risk["risk"]:
            actions.append({
                "category": "monitoring",
                "icon": "🔬",
                "action": "Complete Blood Count (CBC) Test",
                "detail": "Symptoms suggest possible anemia. A CBC test checks hemoglobin and iron levels.",
                "priority": 3,
            })

    # General wellness
    if tier in ("LOW", "MODERATE"):
        actions.append({
            "category": "wellness",
            "icon": "🏃",
            "action": "Maintain Healthy Habits",
            "detail": "Continue regular exercise, balanced diet, adequate sleep, and hydration.",
            "priority": 5,
        })

    # Home care for symptoms
    if symptoms:
        worsening = [s for s in symptoms if s.trend == "worsening"]
        if worsening:
            actions.append({
                "category": "monitoring",
                "icon": "📊",
                "action": "Track Worsening Symptoms Daily",
                "detail": f"{len(worsening)} symptom(s) are worsening. Keep a daily log and seek care if they escalate.",
                "priority": 3,
            })

    actions.sort(key=lambda x: x.get("priority", 10))

    return {
        "urgency": urgency,
        "urgency_label": {
            "emergency": "🚨 Emergency — Act Now",
            "urgent": "⚠️ Urgent — Within 24 Hours",
            "soon": "📅 Schedule Soon — This Week",
            "routine": "✅ Routine — Monitor & Maintain",
        }.get(urgency, "Monitor"),
        "actions": actions,
        "total_actions": len(actions),
    }


# ── Input Validation with Smart Corrections ──

def validate_field(field_name: str, value) -> Dict:
    """Validate a single field and suggest corrections if needed."""
    corrections = {
        "temperature_f": {
            "range": (90.0, 115.0),
            "typical": (96.0, 100.4),
            "unit": "°F",
            "suggestions": {
                "too_low": "Did you mean to enter in Celsius? 36°C = 96.8°F",
                "too_high": "Please verify — temperatures above 106°F are extremely rare"
            }
        },
        "heart_rate": {
            "range": (20, 250),
            "typical": (60, 100),
            "unit": "bpm",
        },
        "spo2": {
            "range": (50, 100),
            "typical": (95, 100),
            "unit": "%",
        },
        "weight_kg": {
            "range": (10, 350),
            "typical": (40, 150),
            "unit": "kg",
            "suggestions": {
                "too_high": "Did you enter weight in pounds? 1 lb = 0.45 kg"
            }
        },
        "height_cm": {
            "range": (50, 275),
            "typical": (140, 200),
            "unit": "cm",
            "suggestions": {
                "too_low": "Did you enter height in feet/inches? 5'6\" = 167.6 cm"
            }
        },
    }

    spec = corrections.get(field_name)
    if not spec:
        return {"valid": True, "field": field_name, "value": value}

    try:
        num_val = float(value)
    except (ValueError, TypeError):
        return {"valid": False, "field": field_name, "error": "Must be a number"}

    low, high = spec["range"]
    if num_val < low or num_val > high:
        suggestion = None
        sug = spec.get("suggestions", {})
        if num_val < low:
            suggestion = sug.get("too_low", f"Value must be at least {low} {spec['unit']}")
        else:
            suggestion = sug.get("too_high", f"Value must be at most {high} {spec['unit']}")
        return {
            "valid": False,
            "field": field_name,
            "value": num_val,
            "error": f"Out of range ({low}-{high} {spec['unit']})",
            "suggestion": suggestion,
        }

    typ_low, typ_high = spec["typical"]
    warning = None
    if num_val < typ_low or num_val > typ_high:
        warning = f"Unusual value — typical range is {typ_low}-{typ_high} {spec['unit']}"

    return {
        "valid": True,
        "field": field_name,
        "value": num_val,
        "warning": warning,
    }
