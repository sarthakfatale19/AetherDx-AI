import logging
from typing import Dict, Any

logger = logging.getLogger("AetherDx.ExternalIntegrations")

class TwilioWhatsAppService:
    """
    Handles unstructured input ingestion directly from WhatsApp, extracting clinical entities.
    """
    def __init__(self, account_sid: str = None, auth_token: str = None):
        self.sid = account_sid
        self.token = auth_token
        self.is_mock = not bool(account_sid and auth_token)

    async def parse_incoming_message(self, twilio_payload: Dict[str, Any]) -> Dict[str, Any]:
        """ Conversational to UIIL normalized variables mapping """
        if self.is_mock:
            logger.info("MOCK: Parsing WhatsApp message via Regex/NLP heuristics.")
            
        raw_text = twilio_payload.get("Body", "").lower()
        
        # Super simplified mock NLP parsing for UIIL normalization
        uiil_payload = {
            "source": "whatsapp",
            "extracted_symptoms": [],
            "emergency_flags": False
        }
        
        if "chest pain" in raw_text or "heart attack" in raw_text:
            uiil_payload["extracted_symptoms"].append({"name": "chest_pain", "severity": 8})
            uiil_payload["emergency_flags"] = True
            
        return uiil_payload

class GeolocationEmergencyRouting:
    """
    Uses MapmyIndia or Google Maps to locate the closest cardiovascular/trauma 
    centers if UIIL triggers an emergency state.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.is_mock = not bool(api_key)

    async def get_nearest_facility(self, user_lat: float, user_lon: float, facility_type: str = "hospital") -> Dict[str, Any]:
        if self.is_mock:
            logger.info(f"MOCK: Finding {facility_type} near {user_lat}, {user_lon}")
            return {
                "name": "AetherDx Partner Hospital (Simulated)",
                "distance_km": 1.2,
                "eta_mins": 4,
                "coordinates": {"lat": user_lat + 0.01, "lon": user_lon + 0.01},
                "contact": "+918000000000"
            }
        
        # Real integration would hit Maps API here.
        return {}
