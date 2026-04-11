"""
Explainable AI Module for AetherDx AI.
Integrates SHAP + LIME for production-grade interpretability
alongside existing feature importance extraction.
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from data.symptoms_data import SYMPTOM_FEATURES

# Lazy imports for optional heavy dependencies
_shap = None
_lime = None


def _get_shap():
    global _shap
    if _shap is None:
        import shap
        _shap = shap
    return _shap


def _get_lime():
    global _lime
    if _lime is None:
        import lime.lime_tabular
        _lime = lime.lime_tabular
    return _lime


def get_prediction_explanation(
    feature_vector: np.ndarray,
    feature_importances: List[Tuple[str, float]],
    top_n: int = 5
) -> List[Dict]:
    """
    Generate explainable AI output showing which symptoms
    contributed most to the prediction.

    Returns top N contributing factors with their weights.
    """
    # Combine model-level feature importance with actual input values
    contributions = []

    for symptom_name, model_importance in feature_importances:
        idx = SYMPTOM_FEATURES.index(symptom_name)
        input_value = feature_vector[idx]

        # Contribution = model importance × actual input value
        contribution = model_importance * input_value

        if contribution > 0.001:  # Only include meaningful contributions
            contributions.append({
                "symptom": symptom_name.replace("_", " ").title(),
                "symptom_key": symptom_name,
                "model_importance": round(float(model_importance) * 100, 1),
                "input_intensity": round(float(input_value) * 100, 1),
                "contribution": round(float(contribution) * 100, 1)
            })

    # Sort by contribution
    contributions.sort(key=lambda x: x["contribution"], reverse=True)

    # Normalize contributions to percentages
    total_contribution = sum(c["contribution"] for c in contributions)
    if total_contribution > 0:
        for c in contributions:
            c["percentage"] = round(c["contribution"] / total_contribution * 100, 1)
    else:
        for c in contributions:
            c["percentage"] = 0.0

    return contributions[:top_n]


def generate_shap_explanation(
    model: Any,
    feature_vector: np.ndarray,
    top_n: int = 8
) -> Dict:
    """
    Generate SHAP-based explanation for a prediction.
    Returns feature importances via SHAP TreeExplainer.
    """
    try:
        shap = _get_shap()
        features = feature_vector.reshape(1, -1)

        # Use TreeExplainer for tree-based models (RandomForest, XGBoost, etc.)
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(features)

        # For multi-class, get the SHAP values for the predicted class
        if isinstance(shap_values, list):
            predicted_class = int(model.predict(features)[0])
            class_shap = shap_values[predicted_class][0]
        else:
            class_shap = shap_values[0]

        # Build sorted feature contributions
        contributions = []
        for i, (name, shap_val) in enumerate(zip(SYMPTOM_FEATURES, class_shap)):
            if abs(shap_val) > 0.001:
                contributions.append({
                    "feature": name.replace("_", " ").title(),
                    "feature_key": name,
                    "shap_value": round(float(shap_val), 4),
                    "abs_impact": round(abs(float(shap_val)), 4),
                    "direction": "increases_risk" if shap_val > 0 else "decreases_risk",
                    "input_value": round(float(feature_vector[i]), 3),
                })

        contributions.sort(key=lambda x: x["abs_impact"], reverse=True)

        # Calculate base value
        base_value = float(explainer.expected_value[int(model.predict(features)[0])])
        if isinstance(explainer.expected_value, np.ndarray):
            base_value = float(explainer.expected_value[int(model.predict(features)[0])])
        else:
            base_value = float(explainer.expected_value)

        return {
            "method": "SHAP (TreeExplainer)",
            "base_value": round(base_value, 4),
            "contributions": contributions[:top_n],
            "total_features_analyzed": len(SYMPTOM_FEATURES),
            "significant_features": len(contributions),
            "waterfall": [
                {
                    "feature": c["feature"],
                    "value": c["shap_value"],
                    "direction": c["direction"],
                }
                for c in contributions[:top_n]
            ],
        }

    except Exception as e:
        print(f"⚠️ SHAP explanation failed: {e}")
        # Fallback to feature importance-based explanation
        return _fallback_shap(model, feature_vector, top_n)


def _fallback_shap(model: Any, feature_vector: np.ndarray, top_n: int) -> Dict:
    """Fallback explanation using model feature importances when SHAP fails."""
    try:
        importances = model.feature_importances_
        features = feature_vector.reshape(1, -1)
        predicted_class = int(model.predict(features)[0])

        contributions = []
        for i, (name, imp) in enumerate(zip(SYMPTOM_FEATURES, importances)):
            impact = imp * feature_vector[i]
            if abs(impact) > 0.001:
                contributions.append({
                    "feature": name.replace("_", " ").title(),
                    "feature_key": name,
                    "shap_value": round(float(impact), 4),
                    "abs_impact": round(abs(float(impact)), 4),
                    "direction": "increases_risk" if impact > 0 else "decreases_risk",
                    "input_value": round(float(feature_vector[i]), 3),
                })

        contributions.sort(key=lambda x: x["abs_impact"], reverse=True)

        return {
            "method": "Feature Importance (Fallback)",
            "base_value": 0.0,
            "contributions": contributions[:top_n],
            "total_features_analyzed": len(SYMPTOM_FEATURES),
            "significant_features": len(contributions),
            "waterfall": [
                {"feature": c["feature"], "value": c["shap_value"], "direction": c["direction"]}
                for c in contributions[:top_n]
            ],
        }
    except Exception:
        return {"method": "unavailable", "contributions": [], "waterfall": []}


def generate_lime_explanation(
    model: Any,
    feature_vector: np.ndarray,
    training_data: Optional[np.ndarray] = None,
    top_n: int = 6,
) -> Dict:
    """
    Generate LIME-based local explanation for a single prediction.
    """
    try:
        lime_tabular = _get_lime()
        features = feature_vector.reshape(1, -1)

        # Use provided training data or generate synthetic background
        if training_data is None:
            np.random.seed(42)
            training_data = np.random.rand(200, len(SYMPTOM_FEATURES)) * 0.5

        explainer = lime_tabular.LimeTabularExplainer(
            training_data,
            feature_names=SYMPTOM_FEATURES,
            class_names=["Healthy", "Diabetes", "Hypertension", "Anemia"],
            mode="classification",
        )

        exp = explainer.explain_instance(
            feature_vector,
            model.predict_proba,
            num_features=top_n,
            top_labels=1,
        )

        predicted_label = int(model.predict(features)[0])
        explanation_list = exp.as_list(label=predicted_label)

        contributions = []
        for feature_desc, weight in explanation_list:
            contributions.append({
                "description": feature_desc,
                "weight": round(float(weight), 4),
                "direction": "increases_risk" if weight > 0 else "decreases_risk",
            })

        return {
            "method": "LIME (Local Interpretable Model-agnostic Explanations)",
            "predicted_class": predicted_label,
            "contributions": contributions,
            "intercept": round(float(exp.intercept[predicted_label]), 4),
        }

    except Exception as e:
        print(f"⚠️ LIME explanation failed: {e}")
        return {"method": "LIME (unavailable)", "contributions": [], "error": str(e)}


def generate_risk_factors_summary(
    explanations: List[Dict],
    primary_condition: str
) -> str:
    """Generate a human-readable summary of risk factors."""
    if not explanations:
        return "No significant risk factors identified based on the provided symptoms."

    lines = []
    lines.append(f"Based on your symptom profile, the following factors contribute most to the {primary_condition} risk assessment:\n")

    for i, exp in enumerate(explanations, 1):
        symptom = exp["symptom"]
        pct = exp["percentage"]
        intensity = exp["input_intensity"]

        if intensity >= 60:
            severity_desc = "significant"
        elif intensity >= 30:
            severity_desc = "moderate"
        else:
            severity_desc = "mild"

        lines.append(f"{i}. **{symptom}** — Contributing {pct:.0f}% to the risk score ({severity_desc} intensity)")

    return "\n".join(lines)


def calculate_trend_projection(
    current_risk: float,
    severity_level: str = "moderate",
    duration: str = "weeks"
) -> List[Dict]:
    """
    Calculate a 30-day risk trend projection for Digital Twin display.
    Uses current risk score and projects forward with trend factors.
    """
    days = list(range(0, 31, 3))  # Every 3 days
    projections = []

    # Trend factors based on severity and duration
    severity_multipliers = {"mild": 0.02, "moderate": 0.04, "severe": 0.07}
    duration_multipliers = {"days": 0.8, "weeks": 1.0, "months": 1.3}

    trend_rate = severity_multipliers.get(severity_level, 0.04)
    trend_scale = duration_multipliers.get(duration, 1.0)

    for day in days:
        # Logistic growth curve for risk projection
        time_factor = day / 30.0
        projected_risk = current_risk + (trend_rate * trend_scale * time_factor * 100)
        # Cap at 95% and add slight noise
        noise = np.random.uniform(-1.5, 1.5)
        projected_risk = min(95.0, max(current_risk * 0.9, projected_risk + noise))

        projections.append({
            "day": day,
            "risk_percentage": round(projected_risk, 1),
            "label": f"Day {day}"
        })

    return projections
