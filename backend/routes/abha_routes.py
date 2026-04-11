"""
ABHA (ABDM) API Routes v2.0 for AetherDx AI.
Provides endpoints for ABHA login, consent management, health data retrieval,
enhanced AI prediction with FHIR data, explainable AI (SHAP + LIME),
trend analysis, recommendations, and smart data sync.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np

from services.abha_service import abha_service
from services.fhir_transformer import (
    parse_fhir_bundle, transform_to_ml_features,
    merge_with_symptom_vector, get_fhir_summary
)
from services.ml_pipeline import ml_pipeline
from services.explainer import (
    get_prediction_explanation, generate_shap_explanation,
    generate_lime_explanation, generate_risk_factors_summary
)
from services.feature_eng import build_feature_vector
from services.trend_predictor import trend_predictor
from services.sync_service import sync_service

router = APIRouter(prefix="/abha", tags=["ABHA / ABDM"])


# ── Request Models ──

class ABHALoginRequest(BaseModel):
    abha_id: str = Field(..., description="ABHA Number or ABHA Address", min_length=4)

class OTPVerifyRequest(BaseModel):
    txn_id: str = Field(..., description="Transaction ID from login initiation")
    otp: str = Field(..., description="OTP received on registered mobile", min_length=4, max_length=6)

class ConsentRequest(BaseModel):
    session_id: str = Field(..., description="Authenticated session ID")
    data_types: List[str] = Field(
        default=["labs", "vitals", "prescriptions", "conditions", "diagnostics"],
        description="Types of health data to request"
    )
    purpose: str = Field(default="AI Risk Prediction", description="Purpose of data access")
    duration_days: int = Field(default=30, ge=1, le=365, description="Consent duration in days")

class ConsentApproveRequest(BaseModel):
    consent_id: str

class DataFetchRequest(BaseModel):
    consent_id: str = Field(..., description="Approved consent ID")

class EnhancedPredictRequest(BaseModel):
    consent_id: str = Field(..., description="Approved consent ID with fetched data")
    symptoms: Optional[List[str]] = Field(default=[], description="Additional symptoms from form")
    severity: str = Field(default="moderate")
    duration: str = Field(default="weeks")

class SyncRequest(BaseModel):
    consent_id: str = Field(..., description="Active consent ID to sync")


# ── Endpoints ──

@router.post("/login")
async def abha_login(req: ABHALoginRequest):
    """Initiate ABHA OTP-based login."""
    result = await abha_service.initiate_login(req.abha_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Login failed"))
    return result


@router.post("/verify")
async def abha_verify(req: OTPVerifyRequest):
    """Verify OTP and create authenticated session."""
    result = await abha_service.verify_otp(req.txn_id, req.otp)
    if result.get("status") == "error":
        raise HTTPException(status_code=401, detail=result.get("message", "Verification failed"))
    return result


@router.post("/consent/request")
async def request_consent(req: ConsentRequest):
    """Request patient consent for health data access."""
    result = await abha_service.request_consent(
        session_id=req.session_id,
        data_types=req.data_types,
        purpose=req.purpose,
        duration_days=req.duration_days,
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


@router.post("/consent/approve")
async def approve_consent(req: ConsentApproveRequest):
    """Approve a consent request (simulation mode)."""
    result = await abha_service.approve_consent(req.consent_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


@router.get("/consent/status/{consent_id}")
async def consent_status(consent_id: str):
    """Check consent status."""
    result = await abha_service.check_consent_status(consent_id)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Consent not found")
    return result


@router.delete("/consent/revoke/{consent_id}")
async def revoke_consent(consent_id: str):
    """Revoke a previously granted consent."""
    result = await abha_service.revoke_consent(consent_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


@router.post("/data/fetch")
async def fetch_health_data(req: DataFetchRequest):
    """Fetch health records using approved consent and parse into structured data."""
    result = await abha_service.fetch_health_data(req.consent_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))

    bundle = result.get("bundle", {})
    parsed = parse_fhir_bundle(bundle)
    summary = get_fhir_summary(parsed)
    ml_features = transform_to_ml_features(parsed)

    # Run trend analysis if time-series data available
    trend_analysis = None
    if parsed.get("time_series"):
        trend_analysis = trend_predictor.analyze_trends(parsed["time_series"])

    return {
        **result,
        "parsed_data": {
            "lab_values": parsed["lab_values"],
            "vitals": parsed["vitals"],
            "conditions": parsed["conditions"],
            "medications": parsed["medications"],
            "diagnostic_reports": parsed.get("diagnostic_reports", []),
            "risk_flags": parsed["risk_flags"],
            "medication_interactions": parsed.get("medication_interactions", []),
        },
        "summary": summary,
        "ml_features": ml_features,
        "trend_analysis": trend_analysis,
        "time_series": parsed.get("time_series", {}),
    }


@router.post("/predict")
async def enhanced_prediction(req: EnhancedPredictRequest):
    """
    Run enhanced AI prediction combining ABHA health data with symptom data.
    Provides SHAP + LIME explainability, trend analysis, and recommendations.
    """
    # Fetch FHIR data
    data_result = await abha_service.fetch_health_data(req.consent_id)
    if data_result.get("status") == "error":
        raise HTTPException(status_code=400, detail=data_result.get("message"))

    bundle = data_result.get("bundle", {})
    parsed = parse_fhir_bundle(bundle)
    fhir_features = transform_to_ml_features(parsed)
    fhir_summary = get_fhir_summary(parsed)

    # Build symptom vector
    symptom_vector = build_feature_vector(req.symptoms, req.severity, req.duration)

    # Merge FHIR features with symptom vector
    enhanced_vector = merge_with_symptom_vector(fhir_features, symptom_vector)

    # Run ML prediction
    if not ml_pipeline.is_trained:
        raise HTTPException(status_code=503, detail="ML models not initialized")

    prediction = ml_pipeline.predict(enhanced_vector)
    importances = ml_pipeline.get_feature_importances()
    explanations = get_prediction_explanation(enhanced_vector, importances)

    # SHAP explanation
    shap_data = generate_shap_explanation(
        ml_pipeline.primary_model,
        enhanced_vector,
    )

    # LIME explanation
    lime_data = generate_lime_explanation(
        ml_pipeline.primary_model,
        enhanced_vector,
    )

    # Trend analysis
    trend_analysis = None
    risk_projection = []
    if parsed.get("time_series"):
        trend_analysis = trend_predictor.analyze_trends(parsed["time_series"])
        risk_projection = trend_predictor.generate_risk_projection(
            current_risk=prediction["primary_probability"],
            trend_analysis=trend_analysis,
        )

    # Generate recommendations from trends + risk flags
    recommendations = []
    if trend_analysis:
        recommendations = trend_predictor.get_recommendations_from_trends(trend_analysis)

    # Add generic recommendations based on risk flags
    risk_flags = parsed.get("risk_flags", [])
    if not recommendations:
        recommendations = _generate_recommendations_from_flags(risk_flags, prediction)

    # Natural language explanation
    primary_condition = prediction.get("primary_prediction", "Healthy")
    risk_summary = generate_risk_factors_summary(explanations, primary_condition)

    # Detect changes via sync service
    sync_result = sync_service.detect_changes(
        consent_id=req.consent_id,
        current_fhir_data=parsed,
        current_prediction=prediction,
    )

    return {
        "prediction": prediction,
        "explanations": explanations,
        "shap_explanation": shap_data,
        "lime_explanation": lime_data,
        "risk_summary": risk_summary,
        "fhir_summary": fhir_summary,
        "fhir_features": fhir_features,
        "risk_flags": risk_flags,
        "trend_analysis": trend_analysis,
        "risk_projection": risk_projection,
        "recommendations": recommendations,
        "sync_result": sync_result,
        "data_source": {
            "abha_records": len(parsed.get("raw_observations", [])),
            "conditions": len(parsed.get("conditions", [])),
            "medications": len(parsed.get("medications", [])),
            "diagnostic_reports": len(parsed.get("diagnostic_reports", [])),
            "symptoms_added": len(req.symptoms),
            "time_series_features": len(parsed.get("time_series", {})),
        },
        "model_info": ml_pipeline.get_model_info(),
        "mode": data_result.get("mode", "simulation"),
    }


@router.post("/sync")
async def sync_health_data(req: SyncRequest):
    """Re-fetch data and re-run prediction to detect changes."""
    # Check if sync has new data
    sync_status = await abha_service.check_sync_status(req.consent_id)

    if sync_status.get("status") == "error":
        raise HTTPException(status_code=400, detail=sync_status.get("message"))

    if not sync_status.get("needs_sync", False):
        return {
            "status": "up_to_date",
            "message": "No new data available since last sync.",
            **sync_status,
        }

    # Re-fetch and re-predict
    predict_req = EnhancedPredictRequest(consent_id=req.consent_id)
    prediction_result = await enhanced_prediction(predict_req)

    return {
        "status": "synced",
        "message": "Data refreshed and prediction updated.",
        "sync_info": sync_status,
        "prediction": prediction_result,
    }


@router.get("/sync/status/{consent_id}")
async def get_sync_status(consent_id: str):
    """Check if new data is available for sync."""
    return await abha_service.check_sync_status(consent_id)


@router.get("/audit")
async def get_audit_log(count: int = 20):
    """Get recent audit log entries (for compliance/debugging)."""
    return {
        "entries": abha_service.get_audit_log(count),
        "total_requested": count,
    }


# ── Helper Functions ──

def _generate_recommendations_from_flags(risk_flags: list, prediction: dict) -> list:
    """Generate preventive recommendations based on risk flags."""
    recs = []
    primary = prediction.get("primary_prediction", "")
    probability = prediction.get("primary_probability", 0)

    if "diabetic_hba1c" in risk_flags or "prediabetic_hba1c" in risk_flags:
        recs.append({
            "title": "Blood Sugar Management",
            "description": "Your HbA1c indicates elevated blood sugar. Lifestyle changes can help prevent diabetes progression.",
            "actions": [
                "Reduce refined carbohydrates and sugary drinks",
                "30 minutes of moderate exercise daily",
                "Monitor fasting glucose regularly",
                "Consider consulting an endocrinologist",
            ],
            "urgency": "high",
            "icon": "🩸",
        })

    if "elevated_blood_pressure" in risk_flags:
        recs.append({
            "title": "Blood Pressure Control",
            "description": "Your blood pressure readings are above the normal range.",
            "actions": [
                "Reduce sodium intake to <2300mg/day",
                "Practice deep breathing and stress management",
                "Regular cardiovascular exercise",
                "Monitor BP at home twice daily",
            ],
            "urgency": "high",
            "icon": "❤️",
        })

    if "low_hemoglobin" in risk_flags:
        recs.append({
            "title": "Iron-Deficiency Prevention",
            "description": "Your hemoglobin is below normal, indicating potential anemia.",
            "actions": [
                "Eat iron-rich foods (leafy greens, lentils, red meat)",
                "Take Vitamin C with meals for better iron absorption",
                "Avoid tea/coffee with meals",
                "Get ferritin and TIBC levels tested",
            ],
            "urgency": "moderate",
            "icon": "🫀",
        })

    if "high_cholesterol" in risk_flags:
        recs.append({
            "title": "Cholesterol Management",
            "description": "Your total cholesterol exceeds the desirable range.",
            "actions": [
                "Limit saturated fats and trans fats",
                "Increase soluble fiber (oats, beans, fruits)",
                "Consider omega-3 supplements",
                "Get a full lipid panel in 3 months",
            ],
            "urgency": "moderate",
            "icon": "🧬",
        })

    if "overweight_bmi" in risk_flags or "obese_bmi" in risk_flags:
        recs.append({
            "title": "Weight Management",
            "description": "Your BMI indicates you're above healthy weight range.",
            "actions": [
                "Aim for a 500-calorie daily deficit",
                "150 minutes of moderate exercise per week",
                "Increase protein and fiber intake",
                "Track daily food intake with a diary",
            ],
            "urgency": "moderate",
            "icon": "⚖️",
        })

    # If no specific flags but high risk
    if not recs and probability > 50:
        recs.append({
            "title": "Regular Health Monitoring",
            "description": f"Your AI risk assessment indicates moderate-to-high risk for {primary}.",
            "actions": [
                "Schedule a comprehensive health check-up",
                "Maintain a balanced diet and regular exercise",
                "Monitor key health markers monthly",
                "Stay hydrated and manage stress levels",
            ],
            "urgency": "moderate",
            "icon": "🏥",
        })

    return recs
