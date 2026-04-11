"""
API Orchestration Routing.
Exposes endpoints to interact securely with the unified API orchestration layer.
"""

from fastapi import APIRouter, Request, BackgroundTasks, Depends
from auth.auth_deps import get_current_user
from pydantic import BaseModel
from typing import Dict, Any, List

from gateway.orchestrator import orchestrator
from gateway.cache_manager import cache_manager
from connectors.llm_provider import llm_orchestrator
from connectors.speech_provider import speech_engine
from connectors.medical_interop_provider import abha_gateway, infermedica_engine
from connectors.multimodal_provider import document_ingestion_engine, wearables_engine
from connectors.infrastructure_provider import (
    communication_hub, identity_manager, location_intelligence, mlops_engine
)

router = APIRouter()

class WebhookPayload(BaseModel):
    phone_number: str
    message: str


@router.get("/status")
async def get_orchestration_status(user: dict = Depends(get_current_user)):
    """
    Returns the health matrix of all integrated APIs and internal circuit breakers.
    """
    return {
        "status": "online",
        "orchestrator_metrics": orchestrator.metrics,
        "circuit_breakers": {
            name: {"state": cb.state, "failures": cb.failure_count}
            for name, cb in orchestrator.circuit_breakers.items()
        },
        "cache_metrics": cache_manager.get_metrics(),
        "providers": {
            "llm": ["OpenAI", "Anthropic", "Gemini"],
            "speech": ["Google", "Sarvam AI"],
            "medical": ["FHIR/ABHA", "Infermedica"],
            "multimodal": ["Google Vision / AWS Textract", "Google Fit / HealthKit"],
            "infrastructure": ["Twilio/Meta WhatsApp", "Auth0/Firebase", "Google Maps", "SageMaker/Vertex"]
        }
    }


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """
    Simulated Twilio/WhatsApp inbound webhook.
    1. Receives message from user
    2. Uses LLM orchestration to generate response
    3. Uses Twilio to dispatch reply
    """
    
    # 1. Dispatch response generation to background to return 200 OK fast
    def process_and_reply(phone: str, msg: str):
        # 2. Extract medical context via Infermedica simulation
        triage = infermedica_engine.parse_symptoms(msg)
        
        # 3. Reason via Fallback LLM Orchestrator
        reasoning = llm_orchestrator.generate_clinical_explanation({
            "inbound_message": msg,
            "triage_extraction": triage
        })
        
        text_reply = reasoning.get("reasoning", "I'm having trouble analyzing this right now.")
        
        # 4. Dispatch back via WhatsApp
        communication_hub.dispatch_alert(phone, text_reply)

    background_tasks.add_task(process_and_reply, payload.phone_number, payload.message)
    
    return {"status": "accepted"}


@router.get("/test/full_pipeline")
async def test_full_pipeline(user: dict = Depends(get_current_user)):
    """
    Simulates a full data ingestion, triage, mapping, and routing cycle
    using all connectors.
    """
    # 1. Identity Verification
    auth = identity_manager.verify_otp("+919876543210", "123456")
    
    # 2. Wearables Fetch
    sync_data = wearables_engine.sync_daily_metrics(auth.get("uid", "user_1"), "token")
    
    # 3. FHIR Context
    history = abha_gateway.fetch_patient_history("test-abha-12@sbx", "0000")
    
    # 4. Orchestrated Triage
    xai = llm_orchestrator.generate_clinical_explanation(sync_data)
    
    # 5. Routing
    hospitals = location_intelligence.find_nearest_hospitals(28.7041, 77.1025)
    
    return {
        "auth": auth,
        "wearables": sync_data,
        "history": history,
        "xai_explanation": xai,
        "emergency_hospitals": hospitals,
    }
