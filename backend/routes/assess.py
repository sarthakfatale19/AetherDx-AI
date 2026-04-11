"""
Assessment API Routes for AetherDx AI.
Structured health form → real-time scoring, emergency detection,
full prediction, and personalized action plans.
"""

from fastapi import APIRouter, Depends
from auth.auth_deps import get_current_user
from models.form_models import (
    FullAssessmentInput, RealtimeAssessmentInput, FieldValidationInput
)
from services.form_intelligence import (
    detect_emergency, derive_secondary_features, detect_compound_risks,
    normalize_form_to_features, calculate_realtime_score,
    generate_form_explanation, generate_action_plan, validate_field
)
from services.ml_pipeline import ml_pipeline
from services.feature_eng import get_active_symptoms
from services.explainer import get_prediction_explanation, calculate_trend_projection
from services.session_intelligence import (
    session_intelligence, LifestyleFusionEngine, ABHAReportGenerator
)

router = APIRouter()


@router.post("/assess/realtime")
async def realtime_assessment(input_data: RealtimeAssessmentInput):
    """
    Real-time incremental scoring as the user fills the form.
    Called on each input change (debounced).
    """
    # Emergency check
    emergency = detect_emergency(input_data.vitals, input_data.symptoms)

    # Derived features
    derived = derive_secondary_features(input_data.vitals, input_data.body_metrics)

    # Compound risks
    compound_risks = detect_compound_risks(input_data.symptoms, derived)

    # Real-time score
    score = calculate_realtime_score(
        input_data.vitals, input_data.body_metrics,
        input_data.symptoms, input_data.lifestyle
    )

    # BMI info
    bmi_info = None
    if input_data.body_metrics:
        bmi = input_data.body_metrics.get_bmi()
        if bmi is not None:
            bmi_info = {
                "value": bmi,
                "category": input_data.body_metrics.get_bmi_category(),
            }

    return {
        "score": score,
        "emergency": emergency,
        "derived": derived,
        "compound_risks": compound_risks,
        "bmi": bmi_info,
    }


@router.post("/assess/submit")
async def submit_assessment(input_data: FullAssessmentInput):
    """
    Full form submission → ML prediction + explanation + action plan.
    """
    session = session_intelligence.get_session(input_data.session_id)

    # Emergency check
    emergency = detect_emergency(input_data.vitals, input_data.symptoms)

    # Derived features
    derived = derive_secondary_features(input_data.vitals, input_data.body_metrics)

    # Compound risks
    compound_risks = detect_compound_risks(input_data.symptoms, derived)

    # Real-time score
    score = calculate_realtime_score(
        input_data.vitals, input_data.body_metrics,
        input_data.symptoms, input_data.lifestyle
    )

    # Apply lifestyle to session
    if input_data.lifestyle:
        norms = input_data.lifestyle.to_normalized()
        for k, v in norms.items():
            session.update_lifestyle(k, v)

    # Build ML feature vector from symptoms
    feature_vector = normalize_form_to_features(input_data.symptoms)

    # Lifestyle fusion
    augmented_vector = LifestyleFusionEngine.augment_feature_vector(
        {f: feature_vector[i] for i, f in enumerate(
            ["fatigue", "excessive_thirst", "frequent_urination", "blurred_vision",
             "headache", "dizziness", "shortness_of_breath", "pale_skin",
             "cold_hands", "chest_pain", "numbness_tingling", "slow_healing",
             "dark_urine", "swelling", "weight_change"]
        )},
        session.lifestyle
    )

    # Convert back to array
    import numpy as np
    from data.symptoms_data import SYMPTOM_FEATURES
    aug_array = np.array([augmented_vector.get(f, 0.0) for f in SYMPTOM_FEATURES])

    # ML prediction
    prediction_data = ml_pipeline.predict(aug_array)

    # Explainable AI
    explanations = get_prediction_explanation(
        aug_array, ml_pipeline.get_feature_importances()
    )

    # XAI reasoning from form
    form_reasoning = generate_form_explanation(score, derived, compound_risks, input_data.symptoms)

    # Record interaction
    symptom_names = [s.symptom for s in input_data.symptoms] if input_data.symptoms else []
    session.record_interaction(
        symptoms=symptom_names,
        severity="moderate",
        duration="weeks",
        risk_score=prediction_data["primary_probability"]
    )

    # Adaptive score
    adaptive_score = session.get_adaptive_risk_score()

    # Risk trend
    risk_trend = calculate_trend_projection(
        current_risk=adaptive_score["score"],
        severity_level="moderate",
        duration="weeks"
    )

    # Action plan
    action_plan = generate_action_plan(
        score, derived, compound_risks, emergency, input_data.symptoms
    )

    # Active symptoms
    active = get_active_symptoms(aug_array)

    # ABHA report
    abha_report = ABHAReportGenerator.generate_report(
        prediction_data=prediction_data,
        session_state=session,
        explanations=explanations,
        risk_trend=risk_trend
    )

    # BMI info
    bmi_info = None
    if input_data.body_metrics:
        bmi = input_data.body_metrics.get_bmi()
        if bmi is not None:
            bmi_info = {
                "value": bmi,
                "category": input_data.body_metrics.get_bmi_category(),
            }

    return {
        "type": "assessment",
        # ML prediction
        "predictions": prediction_data["predictions"],
        "primary_prediction": prediction_data["primary_prediction"],
        "primary_probability": prediction_data["primary_probability"],
        "primary_risk_tier": prediction_data["primary_risk_tier"],
        "model_agreement": prediction_data["model_agreement"],
        # XAI
        "contributing_factors": explanations,
        "form_reasoning": form_reasoning,
        # Scores
        "form_score": score,
        "adaptive_score": adaptive_score,
        # Emergency
        "emergency": emergency,
        # Derived
        "derived_features": derived,
        "compound_risks": compound_risks,
        "bmi": bmi_info,
        # Actions
        "action_plan": action_plan,
        # Trend
        "risk_trend": risk_trend,
        # Active symptoms
        "active_symptoms": [
            {"name": s.replace("_", " ").title(), "intensity": v}
            for s, v in active
        ],
        # ABHA
        "abha_report": abha_report["report_metadata"],
        "personalized_recommendations": abha_report["recommendations"],
        "edge_readiness": abha_report["edge_readiness"],
    }


@router.post("/assess/validate")
async def validate_input(input_data: FieldValidationInput):
    """Validate a single form field and return corrections."""
    return validate_field(input_data.field_name, input_data.value)
