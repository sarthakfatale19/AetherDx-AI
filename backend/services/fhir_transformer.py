"""
FHIR R4 → ML Feature Transformer v2.0 for AetherDx AI.
Parses FHIR Bundle resources and converts them into structured
feature vectors compatible with the ML prediction pipeline.
Now includes: time-series extraction, DiagnosticReport parsing,
composite risk features, and medication interaction flags.
"""

import numpy as np
from typing import Dict, List, Any, Optional
from data.symptoms_data import SYMPTOM_FEATURES, SYMPTOM_INDEX


# ── LOINC Code Mappings ──

LOINC_TO_FEATURE = {
    "4548-4": "hba1c",            # HbA1c
    "2345-7": "fasting_glucose",  # Fasting Blood Glucose
    "718-7": "hemoglobin",        # Hemoglobin
    "85354-9": "blood_pressure",  # Blood Pressure panel
    "2093-3": "total_cholesterol", # Total Cholesterol
    "39156-5": "bmi",             # BMI
    "2085-9": "hdl_cholesterol",  # HDL
    "13457-7": "ldl_cholesterol", # LDL
    "2571-8": "triglycerides",    # Triglycerides
    "6299-2": "urea",            # Blood Urea
    "2160-0": "creatinine",      # Creatinine
    "17856-6": "hba1c_alt",      # HbA1c (alternate code)
}

# Risk thresholds for lab values
LAB_RISK_THRESHOLDS = {
    "hba1c": {"normal_max": 5.6, "prediabetic_max": 6.4, "unit": "%"},
    "fasting_glucose": {"normal_max": 100, "prediabetic_max": 125, "unit": "mg/dL"},
    "hemoglobin": {"low_male": 13.0, "low_female": 12.0, "unit": "g/dL"},
    "systolic_bp": {"normal_max": 120, "elevated_max": 139, "unit": "mmHg"},
    "diastolic_bp": {"normal_max": 80, "elevated_max": 89, "unit": "mmHg"},
    "total_cholesterol": {"normal_max": 200, "borderline_max": 239, "unit": "mg/dL"},
    "bmi": {"normal_max": 24.9, "overweight_max": 29.9, "unit": "kg/m2"},
}

# SNOMED codes mapping conditions to flags
CONDITION_RISK_MAP = {
    "73211009": {"condition": "diabetes", "risk_flag": "diabetes_history"},
    "38341003": {"condition": "hypertension", "risk_flag": "hypertension_history"},
    "271737000": {"condition": "anemia", "risk_flag": "anemia_history"},
    "44054006": {"condition": "type_2_diabetes", "risk_flag": "diabetes_history"},
    "59621000": {"condition": "essential_hypertension", "risk_flag": "hypertension_history"},
}

# Medication-to-condition mapping
MEDICATION_CONDITION_MAP = {
    "metformin": "diabetes",
    "insulin": "diabetes",
    "glimepiride": "diabetes",
    "amlodipine": "hypertension",
    "losartan": "hypertension",
    "enalapril": "hypertension",
    "atenolol": "hypertension",
    "ferrous": "anemia",
    "iron": "anemia",
    "folic acid": "anemia",
}

# Medication interaction risk pairs
MEDICATION_INTERACTIONS = [
    ({"metformin", "insulin"}, "dual_diabetes_therapy"),
    ({"amlodipine", "atenolol"}, "dual_antihypertensive"),
    ({"metformin", "amlodipine"}, "metabolic_cardiac_combo"),
]


def parse_fhir_bundle(bundle: Dict) -> Dict[str, Any]:
    """
    Parse a FHIR R4 Bundle and extract structured health data.
    Returns a dict of extracted features organized by category.
    Now includes: time-series data, diagnostic reports, medication interactions.
    """
    result = {
        "lab_values": {},
        "vitals": {},
        "conditions": [],
        "medications": [],
        "diagnostic_reports": [],
        "risk_flags": set(),
        "raw_observations": [],
        "time_series": {},  # feature_key -> [{value, date, unit}, ...]
        "medication_interactions": [],
    }

    entries = bundle.get("entry", [])

    for entry in entries:
        resource = entry.get("resource", {})
        res_type = resource.get("resourceType", "")

        if res_type == "Observation":
            _parse_observation(resource, result)
        elif res_type == "Condition":
            _parse_condition(resource, result)
        elif res_type == "MedicationStatement":
            _parse_medication(resource, result)
        elif res_type == "DiagnosticReport":
            _parse_diagnostic_report(resource, result)

    # Detect medication interactions
    _detect_medication_interactions(result)

    # Compute composite features
    _compute_composite_features(result)

    result["risk_flags"] = list(result["risk_flags"])
    return result


def _parse_observation(obs: Dict, result: Dict):
    """Extract lab values and vitals from an Observation resource."""
    codes = obs.get("code", {}).get("coding", [])
    loinc_code = None
    display_name = obs.get("code", {}).get("text", "Unknown")

    for coding in codes:
        if coding.get("system", "").endswith("loinc.org"):
            loinc_code = coding.get("code")
            display_name = coding.get("display", display_name)
            break

    feature_key = LOINC_TO_FEATURE.get(loinc_code, None)
    effective_date = obs.get("effectiveDateTime", "")

    # Handle Blood Pressure (component-based)
    if loinc_code == "85354-9":
        components = obs.get("component", [])
        for comp in components:
            comp_text = comp.get("code", {}).get("text", "").lower()
            value = comp.get("valueQuantity", {}).get("value")
            if value is not None:
                if "systolic" in comp_text:
                    result["vitals"]["systolic_bp"] = value
                    _add_time_series(result, "systolic_bp", value, effective_date, "mmHg")
                    if value > LAB_RISK_THRESHOLDS["systolic_bp"]["elevated_max"]:
                        result["risk_flags"].add("elevated_blood_pressure")
                elif "diastolic" in comp_text:
                    result["vitals"]["diastolic_bp"] = value
                    _add_time_series(result, "diastolic_bp", value, effective_date, "mmHg")
        return

    # Standard single-value observations
    value = obs.get("valueQuantity", {}).get("value")
    unit = obs.get("valueQuantity", {}).get("unit", "")

    if value is not None and feature_key:
        # Handle alt codes
        if feature_key == "hba1c_alt":
            feature_key = "hba1c"

        # Categorize as lab or vital
        category_codes = [
            c.get("code", "")
            for cat in obs.get("category", [])
            for c in cat.get("coding", [])
        ]

        entry_data = {
            "key": feature_key,
            "value": value,
            "unit": unit,
            "display": display_name,
            "loinc": loinc_code,
            "date": effective_date,
        }

        # Check reference ranges
        ref_ranges = obs.get("referenceRange", [])
        if ref_ranges:
            ref = ref_ranges[0]
            entry_data["ref_low"] = ref.get("low", {}).get("value")
            entry_data["ref_high"] = ref.get("high", {}).get("value")
            entry_data["ref_text"] = ref.get("text", "")

        # Check interpretation
        interps = obs.get("interpretation", [])
        if interps:
            interp_code = interps[0].get("coding", [{}])[0].get("code", "")
            entry_data["interpretation"] = interp_code
            if interp_code in ("H", "HH"):
                result["risk_flags"].add(f"high_{feature_key}")
            elif interp_code in ("L", "LL"):
                result["risk_flags"].add(f"low_{feature_key}")

        # Store value — always keep latest (by date)
        if "vital-signs" in category_codes:
            if feature_key not in result["vitals"] or effective_date > result.get("_dates", {}).get(feature_key, ""):
                result["vitals"][feature_key] = value
        else:
            if feature_key not in result["lab_values"] or effective_date > result.get("_dates", {}).get(feature_key, ""):
                result["lab_values"][feature_key] = value

        # Track dates for deduplication
        if "_dates" not in result:
            result["_dates"] = {}
        result["_dates"][feature_key] = max(result["_dates"].get(feature_key, ""), effective_date)

        result["raw_observations"].append(entry_data)

        # Add to time-series
        _add_time_series(result, feature_key, value, effective_date, unit)

        # Apply risk thresholds (only on latest value)
        _check_risk_thresholds(feature_key, value, result)


def _add_time_series(result: Dict, feature_key: str, value: float, date: str, unit: str):
    """Add a data point to the time-series collection."""
    if feature_key not in result["time_series"]:
        result["time_series"][feature_key] = []

    # Avoid duplicates
    existing_dates = {p["date"] for p in result["time_series"][feature_key]}
    if date not in existing_dates:
        result["time_series"][feature_key].append({
            "value": value,
            "date": date,
            "unit": unit,
        })


def _parse_condition(cond: Dict, result: Dict):
    """Extract active conditions from a Condition resource."""
    clinical_status = cond.get("clinicalStatus", {}).get("coding", [{}])[0].get("code", "")
    codes = cond.get("code", {}).get("coding", [])
    display = cond.get("code", {}).get("text", "Unknown")

    for coding in codes:
        snomed_code = coding.get("code", "")
        mapping = CONDITION_RISK_MAP.get(snomed_code)
        if mapping:
            result["conditions"].append({
                "code": snomed_code,
                "display": display,
                "condition": mapping["condition"],
                "status": clinical_status,
                "onset": cond.get("onsetDateTime", ""),
            })
            if clinical_status == "active":
                result["risk_flags"].add(mapping["risk_flag"])
            break
    else:
        result["conditions"].append({
            "code": codes[0].get("code", "") if codes else "",
            "display": display,
            "status": clinical_status,
        })


def _parse_medication(med: Dict, result: Dict):
    """Extract medications from a MedicationStatement resource."""
    med_concept = med.get("medicationCodeableConcept", {})
    display = med_concept.get("text", "Unknown")
    dosage = med.get("dosage", [{}])[0].get("text", "")
    status = med.get("status", "unknown")

    med_entry = {
        "name": display,
        "dosage": dosage,
        "status": status,
        "start": med.get("effectivePeriod", {}).get("start", ""),
    }

    # Map medication to condition
    med_lower = display.lower()
    for keyword, condition in MEDICATION_CONDITION_MAP.items():
        if keyword in med_lower:
            med_entry["linked_condition"] = condition
            if status == "active":
                result["risk_flags"].add(f"{condition}_medication")
            break

    result["medications"].append(med_entry)


def _parse_diagnostic_report(report: Dict, result: Dict):
    """Extract diagnostic reports."""
    codes = report.get("code", {}).get("coding", [])
    display = report.get("code", {}).get("text", "Unknown Report")

    report_entry = {
        "id": report.get("id", ""),
        "display": display,
        "status": report.get("status", "unknown"),
        "date": report.get("effectiveDateTime", ""),
        "conclusion": report.get("conclusion", ""),
        "results": [
            r.get("display", "")
            for r in report.get("result", [])
        ],
    }
    result["diagnostic_reports"].append(report_entry)


def _detect_medication_interactions(result: Dict):
    """Detect potentially risky medication combinations."""
    active_meds = {
        m["name"].lower().split()[0]
        for m in result["medications"]
        if m.get("status") == "active"
    }

    for med_set, interaction_flag in MEDICATION_INTERACTIONS:
        if med_set.issubset(active_meds):
            result["medication_interactions"].append({
                "medications": list(med_set),
                "flag": interaction_flag,
                "severity": "monitor",
            })
            result["risk_flags"].add(interaction_flag)


def _compute_composite_features(result: Dict):
    """Compute derived/composite clinical features."""
    lab = result.get("lab_values", {})
    vitals = result.get("vitals", {})

    # Metabolic syndrome indicator (3+ of: high glucose, high BP, high cholesterol, high BMI)
    metabolic_flags = 0
    if lab.get("fasting_glucose", 0) > 100:
        metabolic_flags += 1
    if vitals.get("systolic_bp", 0) > 130 or vitals.get("diastolic_bp", 0) > 85:
        metabolic_flags += 1
    if lab.get("total_cholesterol", 0) > 200:
        metabolic_flags += 1
    bmi = vitals.get("bmi", lab.get("bmi", 0))
    if bmi > 25:
        metabolic_flags += 1

    if metabolic_flags >= 3:
        result["risk_flags"].add("metabolic_syndrome_risk")

    # Diabetes progression indicator
    hba1c = lab.get("hba1c", 0)
    glucose = lab.get("fasting_glucose", 0)
    if hba1c > 6.0 and glucose > 110:
        result["risk_flags"].add("diabetes_progression_likely")


def _check_risk_thresholds(feature_key: str, value: float, result: Dict):
    """Check if a lab value exceeds clinical risk thresholds."""
    thresholds = LAB_RISK_THRESHOLDS.get(feature_key)
    if not thresholds:
        return

    if feature_key == "hba1c":
        if value > thresholds["prediabetic_max"]:
            result["risk_flags"].add("diabetic_hba1c")
        elif value > thresholds["normal_max"]:
            result["risk_flags"].add("prediabetic_hba1c")
    elif feature_key == "fasting_glucose":
        if value > thresholds["prediabetic_max"]:
            result["risk_flags"].add("diabetic_glucose")
        elif value > thresholds["normal_max"]:
            result["risk_flags"].add("prediabetic_glucose")
    elif feature_key == "hemoglobin":
        if value < thresholds["low_female"]:
            result["risk_flags"].add("low_hemoglobin")
    elif feature_key == "total_cholesterol":
        if value > thresholds["borderline_max"]:
            result["risk_flags"].add("high_cholesterol")
    elif feature_key == "bmi":
        if value > thresholds["overweight_max"]:
            result["risk_flags"].add("obese_bmi")
        elif value > thresholds["normal_max"]:
            result["risk_flags"].add("overweight_bmi")


def transform_to_ml_features(parsed_data: Dict) -> Dict[str, float]:
    """
    Convert parsed FHIR data into ML-ready features.
    Maps clinical values to normalized 0-1 risk scores.
    """
    features = {}

    lab = parsed_data.get("lab_values", {})
    vitals = parsed_data.get("vitals", {})

    # Diabetes features
    hba1c = lab.get("hba1c", 0)
    if hba1c > 0:
        features["diabetes_risk_lab"] = min(1.0, max(0, (hba1c - 4.0) / 6.0))

    glucose = lab.get("fasting_glucose", 0)
    if glucose > 0:
        features["glucose_risk"] = min(1.0, max(0, (glucose - 70) / 130))

    # Hypertension features
    systolic = vitals.get("systolic_bp", 0)
    if systolic > 0:
        features["bp_risk"] = min(1.0, max(0, (systolic - 90) / 90))

    diastolic = vitals.get("diastolic_bp", 0)
    if diastolic > 0:
        features["diastolic_risk"] = min(1.0, max(0, (diastolic - 60) / 60))

    # Anemia features
    hb = lab.get("hemoglobin", 0)
    if hb > 0:
        features["anemia_risk_lab"] = min(1.0, max(0, 1.0 - (hb - 7) / 10))

    # Metabolic features
    chol = lab.get("total_cholesterol", 0)
    if chol > 0:
        features["cholesterol_risk"] = min(1.0, max(0, (chol - 150) / 150))

    bmi = vitals.get("bmi", lab.get("bmi", 0))
    if bmi > 0:
        features["bmi_risk"] = min(1.0, max(0, (bmi - 18.5) / 20))

    # Condition history flags (binary)
    risk_flags = parsed_data.get("risk_flags", [])
    features["has_diabetes_history"] = 1.0 if "diabetes_history" in risk_flags else 0.0
    features["has_hypertension_history"] = 1.0 if "hypertension_history" in risk_flags else 0.0
    features["has_anemia_history"] = 1.0 if "anemia_history" in risk_flags else 0.0
    features["on_diabetes_medication"] = 1.0 if "diabetes_medication" in risk_flags else 0.0
    features["on_hypertension_medication"] = 1.0 if "hypertension_medication" in risk_flags else 0.0

    # Composite flags
    features["metabolic_syndrome"] = 1.0 if "metabolic_syndrome_risk" in risk_flags else 0.0
    features["diabetes_progression"] = 1.0 if "diabetes_progression_likely" in risk_flags else 0.0

    # Medication interaction risk
    interactions = parsed_data.get("medication_interactions", [])
    features["medication_interaction_risk"] = min(1.0, len(interactions) * 0.3)

    return features


def merge_with_symptom_vector(
    fhir_features: Dict[str, float],
    symptom_vector: np.ndarray
) -> np.ndarray:
    """
    Merge FHIR-derived features with existing symptom vector.
    FHIR data enhances the base symptom vector by boosting
    risk scores for relevant symptoms.
    """
    enhanced = symptom_vector.copy()

    # Map FHIR features to symptom indices
    boost_map = {
        "diabetes_risk_lab": ["frequent_urination", "excessive_thirst", "blurred_vision", "weight_change"],
        "glucose_risk": ["fatigue", "frequent_urination", "excessive_thirst"],
        "bp_risk": ["headache", "dizziness", "chest_pain", "shortness_of_breath"],
        "anemia_risk_lab": ["fatigue", "pale_skin", "dizziness", "shortness_of_breath", "cold_hands"],
        "cholesterol_risk": ["chest_pain", "shortness_of_breath"],
        "bmi_risk": ["fatigue", "shortness_of_breath", "swelling"],
    }

    for fhir_key, symptom_keys in boost_map.items():
        risk_value = fhir_features.get(fhir_key, 0)
        if risk_value > 0.3:
            for symptom in symptom_keys:
                if symptom in SYMPTOM_INDEX:
                    idx = SYMPTOM_INDEX[symptom]
                    current = enhanced[idx]
                    boost = risk_value * 0.4
                    enhanced[idx] = min(1.0, max(current, current + boost))

    # Apply condition history boosts
    if fhir_features.get("has_diabetes_history", 0) > 0:
        for sym in ["frequent_urination", "excessive_thirst", "fatigue", "slow_healing"]:
            if sym in SYMPTOM_INDEX:
                idx = SYMPTOM_INDEX[sym]
                enhanced[idx] = max(enhanced[idx], 0.3)

    if fhir_features.get("has_hypertension_history", 0) > 0:
        for sym in ["headache", "dizziness", "chest_pain"]:
            if sym in SYMPTOM_INDEX:
                idx = SYMPTOM_INDEX[sym]
                enhanced[idx] = max(enhanced[idx], 0.3)

    if fhir_features.get("has_anemia_history", 0) > 0:
        for sym in ["fatigue", "pale_skin", "cold_hands", "dark_urine"]:
            if sym in SYMPTOM_INDEX:
                idx = SYMPTOM_INDEX[sym]
                enhanced[idx] = max(enhanced[idx], 0.3)

    return enhanced


def get_fhir_summary(parsed_data: Dict) -> Dict:
    """Generate a human-readable summary of FHIR data for dashboard display."""
    summary = {
        "total_observations": len(parsed_data.get("raw_observations", [])),
        "total_conditions": len(parsed_data.get("conditions", [])),
        "total_medications": len(parsed_data.get("medications", [])),
        "total_reports": len(parsed_data.get("diagnostic_reports", [])),
        "risk_flags": parsed_data.get("risk_flags", []),
        "lab_highlights": [],
        "alerts": [],
        "diagnostic_conclusions": [],
        "time_series_available": list(parsed_data.get("time_series", {}).keys()),
    }

    # Deduplicate observations — only show the latest per feature
    seen_features = set()
    sorted_obs = sorted(
        parsed_data.get("raw_observations", []),
        key=lambda x: x.get("date", ""),
        reverse=True,
    )

    for obs in sorted_obs:
        feature_key = obs.get("key", "")
        if feature_key in seen_features:
            continue
        seen_features.add(feature_key)

        highlight = {
            "name": obs["display"],
            "value": obs["value"],
            "unit": obs.get("unit", ""),
            "date": obs.get("date", ""),
        }
        if obs.get("ref_high") and obs["value"] > obs["ref_high"]:
            highlight["status"] = "HIGH"
            summary["alerts"].append(f"{obs['display']} is above normal ({obs['value']} {obs.get('unit', '')})")
        elif obs.get("ref_low") and obs["value"] < obs["ref_low"]:
            highlight["status"] = "LOW"
            summary["alerts"].append(f"{obs['display']} is below normal ({obs['value']} {obs.get('unit', '')})")
        else:
            highlight["status"] = "NORMAL"
        summary["lab_highlights"].append(highlight)

    # Add diagnostic report conclusions
    for report in parsed_data.get("diagnostic_reports", []):
        if report.get("conclusion"):
            summary["diagnostic_conclusions"].append({
                "report": report["display"],
                "conclusion": report["conclusion"],
                "date": report.get("date", ""),
            })

    return summary
