"""
Prediction & Chat API Routes for AetherDx AI.
Integrates: Adaptive risk scoring, drift detection, lifestyle fusion,
ABHA reports, self-learning, and explainable AI.
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from pydantic import BaseModel

from auth.auth_deps import get_current_user, require_role
from services.ml_pipeline import ml_pipeline
from services.feature_eng import parse_symptoms_from_text, build_feature_vector, get_active_symptoms
from services.explainer import get_prediction_explanation, calculate_trend_projection
from services.gemini_service import gemini_service
from services.session_intelligence import (
    session_intelligence, LifestyleFusionEngine, ABHAReportGenerator
)
from gateway.orchestrator import IntelligenceOrchestrator

orchestrator = IntelligenceOrchestrator()

router = APIRouter()


class SymptomInput(BaseModel):
    message: str
    symptoms: Optional[List[str]] = None
    severity: str = "moderate"
    duration: str = "weeks"
    stream: bool = False
    session_id: str = "default"
    lifestyle: Optional[dict] = None
    
    # UIIL Gateway Fields
    source: str = "web_ui"
    uiil_processed_compounds: Optional[List[dict]] = None
    emergency_flags: bool = False


class ChatInput(BaseModel):
    message: str
    session_id: str = "default"


class LifestyleInput(BaseModel):
    session_id: str = "default"
    sleep_quality: Optional[float] = None
    stress_level: Optional[float] = None
    activity_level: Optional[float] = None
    diet_quality: Optional[float] = None
    hydration: Optional[float] = None


class FeedbackInput(BaseModel):
    session_id: str = "default"
    is_positive: bool
    comment: str = ""


@router.post("/chat")
async def chat_with_ai(input_data: ChatInput):
    """General conversational Q&A endpoint with lifestyle parsing."""
    session = session_intelligence.get_session(input_data.session_id)

    # Parse lifestyle signals from conversational text
    lifestyle_updates = session.parse_lifestyle_from_text(input_data.message)

    response_text = await gemini_service.chat(
        message=input_data.message,
        session_id=input_data.session_id
    )

    result = {
        "type": "chat",
        "message": response_text,
        "engine": "AetherDx AI Engine v3.0",
        "gemini_active": gemini_service.is_available,
        "adaptive_score": session.get_adaptive_risk_score(),
        "session_learning": session.get_self_learning_adjustments(),
    }

    if lifestyle_updates:
        result["lifestyle_detected"] = lifestyle_updates
        result["lifestyle_message"] = (
            "I've noted your lifestyle factors and incorporated them into your risk model. "
            "This helps provide more personalized assessments."
        )

    return result


@router.post("/predict")
async def predict_health_risk(input_data: SymptomInput):
    """
    Main prediction with adaptive intelligence:
    - Symptom parsing → ML prediction
    - Lifestyle fusion → enhanced features
    - Drift detection → adaptive scoring
    - Self-learning → adjusted responses
    - ABHA report → structured output
    """
    session = session_intelligence.get_session(input_data.session_id)

    # 1. Modular API Gateway: Route payload for emergency halting and logic redirection
    gateway_response = await orchestrator.process_clinical_payload(
        payload=input_data.dict(), 
        context_source=input_data.source
    )

    if gateway_response.get("status") == "emergency_halt":
        # Hard failover immediately based on UIIL MultiModal signals
        return {
            "type": "emergency_halt",
            "message": gateway_response["action"],
            "triage_data": gateway_response["emergency_triage_data"],
            "risk_tier": "CRITICAL"
        }

    # Parse lifestyle from message text
    lifestyle_updates = session.parse_lifestyle_from_text(input_data.message)

    # Apply explicit lifestyle updates if provided
    if input_data.lifestyle:
        for k, v in input_data.lifestyle.items():
            if v is not None:
                session.update_lifestyle(k, v)

    # Step 1: Parse symptoms
    if input_data.symptoms:
        symptoms = input_data.symptoms
    else:
        symptoms = parse_symptoms_from_text(input_data.message)

    # Step 2: No symptoms → conversational AI
    if not symptoms:
        response_text = await gemini_service.chat(
            message=input_data.message,
            session_id=input_data.session_id
        )
        return {
            "type": "chat",
            "message": response_text,
            "engine": "AetherDx AI Engine v3.0",
            "adaptive_score": session.get_adaptive_risk_score(),
            "session_learning": session.get_self_learning_adjustments(),
            "lifestyle_detected": lifestyle_updates if lifestyle_updates else None,
        }

    # Step 3: Build feature vector
    feature_vector = build_feature_vector(
        symptoms,
        severity=input_data.severity,
        duration=input_data.duration
    )

    # Step 4: Multimodal fusion — augment features with lifestyle
    augmented_vector = LifestyleFusionEngine.augment_feature_vector(
        feature_vector, session.lifestyle
    )

    # Step 5: ML prediction on augmented features
    prediction_data = ml_pipeline.predict(augmented_vector)

    # --- DYNAMIC CONDITION DISCOVERY ---
    primary_ml = prediction_data["primary_prediction"]
    ml_prob = prediction_data["primary_probability"]

    if primary_ml == "Healthy" and ml_prob > 60 and len(symptoms) > 0:
        dynamic_analysis = await gemini_service.analyze_general_condition(
            message=input_data.message,
            symptoms=symptoms,
            severity=input_data.severity,
            duration=input_data.duration
        )
        prediction_data = {
            "predictions": dynamic_analysis["predictions"],
            "primary_prediction": dynamic_analysis["primary_prediction"],
            "primary_probability": dynamic_analysis["primary_probability"],
            "primary_risk_tier": dynamic_analysis["primary_risk_tier"],
            "model_agreement": dynamic_analysis["model_agreement"]
        }
        explanation = dynamic_analysis["explanation"]
        explanations = dynamic_analysis["contributing_factors"]
    else:
        explanation = await gemini_service.generate_health_explanation(
            prediction_data=prediction_data,
            symptoms=symptoms,
            explanations=get_prediction_explanation(augmented_vector, ml_pipeline.get_feature_importances()),
            severity=input_data.severity,
            duration=input_data.duration
        )
        explanations = get_prediction_explanation(augmented_vector, ml_pipeline.get_feature_importances())

    # Step 6: Detect red flags
    RED_FLAG_SYMPTOMS = {
        "chest_pain", "shortness_of_breath", "difficulty_breathing",
        "loss_of_consciousness", "fainting", "severe_dehydration",
        "vision_loss", "high_fever", "stroke_symptoms", "chest_tightness",
        "breathing_difficulty", "unconsciousness",
    }
    detected_red_flags = [s for s in symptoms if s in RED_FLAG_SYMPTOMS]

    # Step 7: Record interaction
    session.record_interaction(
        symptoms=symptoms,
        severity=input_data.severity,
        duration=input_data.duration,
        risk_score=prediction_data["primary_probability"],
        red_flags=detected_red_flags if detected_red_flags else None,
    )

    # Step 8: Adaptive risk score
    adaptive_score = session.get_adaptive_risk_score()

    # Step 9: Risk trend projection
    risk_trend = calculate_trend_projection(
        current_risk=adaptive_score["score"],
        severity_level=input_data.severity,
        duration=input_data.duration
    )

    # Step 10: Active symptoms
    active = get_active_symptoms(augmented_vector)

    # Step 11: Self-learning
    learning = session.get_self_learning_adjustments()

    # Step 12: Follow-up questions
    follow_up = await gemini_service.generate_follow_up_questions(
        symptoms=symptoms,
        current_severity=input_data.severity
    )

    # Step 13: ABHA report
    abha_report = ABHAReportGenerator.generate_report(
        prediction_data=prediction_data,
        session_state=session,
        explanations=explanations,
        risk_trend=risk_trend
    )

    return {
        "type": "prediction",
        "predictions": prediction_data["predictions"],
        "primary_prediction": prediction_data["primary_prediction"],
        "primary_probability": prediction_data["primary_probability"],
        "primary_risk_tier": prediction_data["primary_risk_tier"],
        "model_agreement": prediction_data["model_agreement"],
        "contributing_factors": explanations,
        "explanation": explanation,
        "risk_trend": risk_trend,
        "follow_up_questions": follow_up,
        "active_symptoms": [
            {"name": s.replace("_", " ").title(), "intensity": v}
            for s, v in active
        ],
        "adaptive_score": adaptive_score,
        "session_learning": learning,
        "personalized_recommendations": abha_report["recommendations"],
        "lifestyle_assessment": abha_report["lifestyle_assessment"],
        "behavioral_drift": abha_report["behavioral_drift"],
        "abha_report": abha_report["report_metadata"],
        "edge_readiness": abha_report["edge_readiness"],
    }


@router.post("/predict/upload")
async def predict_with_file(
    message: str = Form(""),
    session_id: str = Form("default"),
    severity: str = Form("moderate"),
    duration: str = Form("weeks"),
    file: UploadFile = File(None),
):
    """
    Multimodal prediction endpoint — accepts image/PDF uploads.
    Images → sent to Gemini multimodal for visual analysis.
    PDFs → text extracted and sent as document context.
    """
    session = session_intelligence.get_session(session_id)
    
    # Parse lifestyle from text
    if message:
        session.parse_lifestyle_from_text(message)
    
    # Handle file attachment
    if file and file.filename:
        file_bytes = await file.read()
        content_type = file.content_type or ""
        
        # Image files → Gemini multimodal
        if content_type.startswith("image/"):
            response_text = await gemini_service.chat_with_image(
                message=message or "Please analyze this medical image.",
                image_bytes=file_bytes,
                mime_type=content_type,
                session_id=session_id
            )
            return {
                "type": "chat",
                "message": response_text,
                "engine": "AetherDx AI Engine v3.0 (Multimodal)",
                "file_analyzed": file.filename,
                "file_type": "image",
                "adaptive_score": session.get_adaptive_risk_score(),
                "session_learning": session.get_self_learning_adjustments(),
            }
        
        # PDF files → extract text → Gemini document analysis
        elif content_type == "application/pdf" or file.filename.endswith(".pdf"):
            try:
                import PyPDF2
                import io
                reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                doc_text = "\n".join(page.extract_text() or "" for page in reader.pages[:10])
            except Exception as e:
                doc_text = f"[PDF text extraction failed: {e}]"
            
            response_text = await gemini_service.chat_with_document(
                message=message or "Please analyze this medical document/report.",
                doc_text=doc_text,
                session_id=session_id
            )
            return {
                "type": "chat",
                "message": response_text,
                "engine": "AetherDx AI Engine v3.0 (Document AI)",
                "file_analyzed": file.filename,
                "file_type": "pdf",
                "adaptive_score": session.get_adaptive_risk_score(),
                "session_learning": session.get_self_learning_adjustments(),
            }
        
        else:
            return {
                "type": "chat",
                "message": "I can analyze images (JPG, PNG) and PDF documents. Please upload a supported file format.",
                "engine": "AetherDx AI Engine v3.0",
                "adaptive_score": session.get_adaptive_risk_score(),
            }
    
    # No file — fall through to normal prediction
    symptoms = parse_symptoms_from_text(message)
    if not symptoms:
        response_text = await gemini_service.chat(
            message=message,
            session_id=session_id
        )
        return {
            "type": "chat",
            "message": response_text,
            "engine": "AetherDx AI Engine v3.0",
            "adaptive_score": session.get_adaptive_risk_score(),
            "session_learning": session.get_self_learning_adjustments(),
        }
    
    # Has symptoms — redirect to normal predict flow
    from pydantic import BaseModel as BM
    input_data = SymptomInput(
        message=message, severity=severity, duration=duration,
        session_id=session_id, stream=False
    )
    return await predict_health_risk(input_data)


@router.post("/lifestyle")
async def update_lifestyle(input_data: LifestyleInput):
    """Update lifestyle indicators for the session."""
    session = session_intelligence.get_session(input_data.session_id)

    if input_data.sleep_quality is not None:
        session.update_lifestyle("sleep_quality", input_data.sleep_quality)
    if input_data.stress_level is not None:
        session.update_lifestyle("stress_level", input_data.stress_level)
    if input_data.activity_level is not None:
        session.update_lifestyle("activity_level", input_data.activity_level)
    if input_data.diet_quality is not None:
        session.update_lifestyle("diet_quality", input_data.diet_quality)
    if input_data.hydration is not None:
        session.update_lifestyle("hydration", input_data.hydration)

    return {
        "status": "updated",
        "adaptive_score": session.get_adaptive_risk_score(),
        "lifestyle": session.lifestyle,
    }

@router.post("/feedback")
async def submit_feedback(input_data: FeedbackInput):
    """Record user feedback for the self-learning loop."""
    session = session_intelligence.get_session(input_data.session_id)
    session.record_feedback(input_data.is_positive, input_data.comment)
    
    return {
        "status": "recorded",
        "message": "Feedback successfully integrated into learning loop."
    }


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_trained": ml_pipeline.is_trained,
        "gemini_available": gemini_service.is_available,
        "accuracy_scores": ml_pipeline.accuracy_scores,
        "engine": "AetherDx AI Engine v3.0",
        "features": [
            "adaptive_risk_scoring",
            "micro_behavior_drift_detection",
            "multimodal_data_fusion",
            "self_learning_feedback",
            "abha_compatible_reports",
            "edge_offline_ready",
            "explainable_ai",
            "voice_first_interaction",
        ]
    }
