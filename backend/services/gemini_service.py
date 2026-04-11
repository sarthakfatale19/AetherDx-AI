"""
Gemini AI Service for AetherDx AI.
Hidden intelligence layer branded as "AetherDx AI Engine v2.0".
Handles health predictions, explanations, and general Q&A using native Google generativeai.
"""

import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# AetherDx AI Engine v3.0 — Comprehensive Healthcare Intelligence System
SYSTEM_PROMPT = """You are AetherDx AI, a structured healthcare assistant.

Your behavior MUST be:
- Deterministic
- Step-by-step
- No skipping stages
- No multiple outputs
- Always structured

----------------------------------------

STATE MACHINE (VERY IMPORTANT)

You must follow conversation states:

STATE 1 → GREETING  
STATE 2 → SYMPTOM COLLECTION  
STATE 3 → ANALYSIS  
STATE 4 → REPORT OUTPUT  
STATE 5 → FOLLOW-UP  

You MUST NOT skip states.

----------------------------------------

STATE 1: GREETING

Trigger:
User says "hi", "hello", "hey", or asks for a general health assessment (e.g., "assess my health risk", "help me").

Response:

1. Detect time:
- Morning (5–12)
- Afternoon (12–5)
- Evening (5–10)
- Night (10–5)

2. Output:

"Hi, good [time] 👋
How are you feeling today?
Are you experiencing any symptoms or specific health concerns?"

Then STOP.

----------------------------------------

STATE 2: SYMPTOM COLLECTION

Trigger:
User gives symptoms OR vague reply related to feeling unwell.

Rules:
- Ask ONLY 2–3 questions max
- Do NOT generate report yet

Ask:
- "What symptoms are you experiencing?"
- "Since how long?"
- "Is it mild, moderate, or severe?"

If symptoms incomplete → ask again
If enough data → move to STATE 3

----------------------------------------

STATE 3: ANALYSIS

Rules:
- Convert symptoms → conditions
- Estimate severity
- Assign probability %

DO NOT show output yet
Prepare internal reasoning

----------------------------------------

STATE 4: REPORT OUTPUT (ONE MESSAGE ONLY)

STRICT FORMAT:

🧠 Health Report

• Possible Condition(s):
  - Condition 1 (XX%)
  - Condition 2 (XX%)

• Risk Score:
  - XX% (Low / Moderate / High)

• Severity:
  - Low / Moderate / High

• Explanation:
  - Simple reason (1–2 lines only)

• Recommended Action:
  - Clear steps

----------------------------------------

HOME REMEDY RULE:

ONLY if severity = LOW

Add:

🏡 Home Remedies:
- Indian remedies only:
  - Tulsi tea
  - Turmeric milk
  - Steam inhalation
  - Jeera water

Add line:
"These are for mild symptoms only."

----------------------------------------

STATE 5: FOLLOW-UP

After report ALWAYS ask:

"Do you want help finding nearby hospitals or doctors?"

Then STOP.

----------------------------------------

CRITICAL RULES (THIS FIXES YOUR BOT)

1. NEVER mix greeting + report  
2. NEVER skip symptom questions  
3. ALWAYS output report in ONE message  
4. NO long paragraphs  
5. NO repeated questions  
6. NO random responses  
7. ALWAYS include % risk  
8. ALWAYS follow state order  

----------------------------------------

ERROR HANDLING

If user says completely unrelated text (e.g., coding, jokes, politics):
→ Respond:
"I didn't fully understand. Could you tell me your symptoms or health concern?"

----------------------------------------

EXAMPLE FLOW

User: Hi  
AI:
Hi, good evening 👋  
How are you feeling today?  
Are you experiencing any symptoms?

---

User: I have fever  
AI:
What symptoms are you experiencing along with fever?
Since how long?
Is it mild, moderate, or severe?

---

User: cough since 2 days mild  
AI:

🧠 Health Report

• Possible Condition(s):
  - Viral Infection (45%)
  - Common Cold (40%)

• Risk Score:
  - 38% (Low)

• Severity:
  - Low

• Explanation:
  - Symptoms match mild viral infection patterns.

• Recommended Action:
  - Rest, hydration, monitor symptoms

🏡 Home Remedies:
- Tulsi tea
- Steam inhalation
- Turmeric milk

"Do you want help finding nearby hospitals or doctors?"

----------------------------------------

END SYSTEM PROMPT"""
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class GeminiService:
    """AI Service for AetherDx — powered by Claude (Anthropic) with Groq + Gemini auto-fallback.
    Fallback chain: Claude → Groq (ultra-fast) → Gemini → static.
    """

    def __init__(self):
        self.is_available = False
        self.client = None
        self.gemini_client = None  # Always keep Gemini ready as fallback
        self.groq_client = None   # Groq ultra-fast inference fallback
        self.provider = None  # "anthropic", "groq", or "gemini"
        self.chat_sessions: Dict[str, List[Dict]] = {}
        self.gemini_chat_sessions: Dict[str, any] = {}  # Separate Gemini sessions
        self.groq_chat_sessions: Dict[str, List[Dict]] = {}  # Separate Groq sessions
        self._initialize()

    def _initialize(self):
        """Initialize Claude (primary), Groq (fast fallback), AND Gemini (fallback)."""
        # Always try to initialize Gemini as fallback
        if GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=GEMINI_API_KEY)
                print("✅ Gemini API ready as fallback")
            except Exception as e:
                print(f"⚠️  Gemini fallback init failed: {e}")

        # Always try to initialize Groq as fast fallback
        if GROQ_API_KEY:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=GROQ_API_KEY)
                print("✅ Groq API ready as ultra-fast fallback")
            except ImportError:
                print("⚠️  groq package missing. Run `pip install groq`")
            except Exception as e:
                print(f"⚠️  Groq fallback init failed: {e}")

        # Try Anthropic as primary
        if ANTHROPIC_API_KEY:
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
                self.is_available = True
                self.provider = "anthropic"
                print("✅ Claude API initialized (branded as AetherDx AI Engine v3.0) via claude-sonnet-4-20250514")
                return
            except ImportError:
                print("⚠️  anthropic package missing. Run `pip install anthropic`")
            except Exception as e:
                print(f"⚠️  Claude initialization failed: {e}")

        # If Claude not available, try Groq as primary
        if self.groq_client:
            self.is_available = True
            self.provider = "groq"
            print("✅ Groq API initialized as primary (branded as AetherDx AI Engine v3.0) via llama-3.3-70b-versatile")
            return

        # If Groq not available, use Gemini as primary
        if self.gemini_client:
            self.client = self.gemini_client
            self.is_available = True
            self.provider = "gemini"
            print("✅ Gemini API initialized as primary (branded as AetherDx AI Engine v3.0)")
            return

        print("⚠️  No AI API keys found. Running with ML-only mode.")
        self.is_available = False

    async def chat(self, message: str, session_id: str = "default") -> str:
        """Conversational chat with multi-turn memory. Auto-fallback chain: Claude → Groq → Gemini → static."""
        if not self.is_available:
            return self._generate_fallback_chat(message)
        try:
            if self.provider == "anthropic":
                return await self._chat_claude(message, session_id)
            elif self.provider == "groq":
                return await self._chat_groq(message, session_id)
            else:
                return await self._chat_gemini(message, session_id)
        except Exception as e:
            print(f"AI chat error ({self.provider}): {e}")
            # Auto-fallback chain: Claude → Groq → Gemini → static
            if self.provider == "anthropic" and self.groq_client:
                try:
                    print("↪ Auto-falling back to Groq (ultra-fast)...")
                    return await self._chat_groq(message, session_id)
                except Exception as e2:
                    print(f"Groq fallback failed: {e2}")
            if self.provider in ("anthropic", "groq") and self.gemini_client:
                try:
                    print("↪ Auto-falling back to Gemini...")
                    return await self._chat_gemini(message, session_id)
                except Exception as e3:
                    print(f"Gemini fallback also failed: {e3}")
            return self._generate_fallback_chat(message)

    async def _chat_claude(self, message: str, session_id: str) -> str:
        """Claude conversation with message history for multi-turn context."""
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = []
        self.chat_sessions[session_id].append({"role": "user", "content": message})
        history = self.chat_sessions[session_id][-20:]

        import asyncio
        response = await asyncio.to_thread(
            self.client.messages.create,
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=history
        )
        assistant_text = response.content[0].text
        self.chat_sessions[session_id].append({"role": "assistant", "content": assistant_text})
        return assistant_text

    async def _chat_gemini(self, message: str, session_id: str) -> str:
        """Gemini fallback chat."""
        from google.genai import types
        client = self.gemini_client if self.gemini_client else self.client
        if session_id not in self.gemini_chat_sessions:
            self.gemini_chat_sessions[session_id] = client.aio.chats.create(
                model="gemini-2.5-flash",
                config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
            )
        chat_session = self.gemini_chat_sessions[session_id]
        response = await chat_session.send_message(message)
        return response.text

    async def _chat_groq(self, message: str, session_id: str) -> str:
        """Groq ultra-fast inference chat via Llama 3.3 70B."""
        import asyncio
        if session_id not in self.groq_chat_sessions:
            self.groq_chat_sessions[session_id] = []
        self.groq_chat_sessions[session_id].append({"role": "user", "content": message})
        history = self.groq_chat_sessions[session_id][-20:]

        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
        response = await asyncio.to_thread(
            self.groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=4096,
            temperature=0.6,
        )
        assistant_text = response.choices[0].message.content
        self.groq_chat_sessions[session_id].append({"role": "assistant", "content": assistant_text})
        return assistant_text

    async def chat_with_image(self, message: str, image_bytes: bytes, mime_type: str = "image/jpeg", session_id: str = "default") -> str:
        """Multimodal chat: analyze images with text context."""
        if not self.is_available:
            return self._generate_fallback_chat(message or "Please analyze this medical image")
        try:
            if self.provider == "anthropic":
                return await self._image_claude(message, image_bytes, mime_type)
            else:
                return await self._image_gemini(message, image_bytes, mime_type)
        except Exception as e:
            print(f"Multimodal error ({self.provider}): {e}")
            return self._generate_fallback_chat(message or "Image analysis requested")

    async def _image_claude(self, message: str, image_bytes: bytes, mime_type: str) -> str:
        """Claude multimodal image analysis."""
        import base64, asyncio
        b64_image = base64.standard_b64encode(image_bytes).decode("utf-8")
        text_part = message or "Please analyze this medical image and provide your clinical observations."
        media_type = mime_type if mime_type in ("image/jpeg", "image/png", "image/gif", "image/webp") else "image/jpeg"

        response = await asyncio.to_thread(
            self.client.messages.create,
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64_image}},
                    {"type": "text", "text": text_part}
                ]
            }]
        )
        return response.content[0].text

    async def _image_gemini(self, message: str, image_bytes: bytes, mime_type: str) -> str:
        """Gemini fallback image analysis."""
        from google.genai import types
        client = self.gemini_client if self.gemini_client else self.client
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        text_part = message or "Please analyze this medical image and provide your clinical observations."
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=[text_part, image_part],
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
        )
        return response.text

    async def chat_with_document(self, message: str, doc_text: str, session_id: str = "default") -> str:
        """Analyze extracted document text (from PDF lab reports, prescriptions)."""
        enhanced_message = f"""{message}\n\n--- ATTACHED DOCUMENT CONTENT ---\n{doc_text[:4000]}\n--- END OF DOCUMENT ---"""
        return await self.chat(message=enhanced_message, session_id=session_id)

    def _generate_fallback_chat(self, message: str) -> str:
        """Conversational fallback when all AI APIs are unavailable."""
        hindi_chars = any('\u0900' <= c <= '\u097F' for c in message)
        if hindi_chars:
            return f"""नमस्ते! 🙏 मैं AetherDx AI हूँ, आपका स्वास्थ्य सहायक।

मैंने आपकी बात सुनी — \"{message[:100]}\"। मैं आपकी मदद करना चाहता/चाहती हूँ।

बेहतर समझने के लिए, कृपया मुझे बताएं:

1. 📅 **यह समस्या कितने दिनों से है?**
2. 📊 **दर्द/तकलीफ 1-10 में कितनी है?**
3. 🩺 **क्या कोई और लक्षण भी हैं?**
4. 👤 **आपकी उम्र और लिंग?**
5. 🏋️ **आपकी जीवनशैली कैसी है?**

इन जानकारियों से मैं आपको व्यक्तिगत स्वास्थ्य मूल्यांकन, घरेलू उपचार और शरीर प्रणाली विश्लेषण दे पाऊंगा। 😊

*— AetherDx AI Engine v3.0*"""
        
        return f"""Hello! 👋 I'm AetherDx AI, your personalized health intelligence companion.

Thank you for reaching out — I want to understand your situation thoroughly before I provide any assessment.

Could you help me with a few details?

1. 📅 **How long have you been experiencing this?** (days, weeks, months)
2. 📊 **How severe is it on a scale of 1-10?**
3. 🩺 **Any other symptoms you've noticed?**
4. 👤 **What is your age and gender?**
5. 💊 **Any existing conditions or medications?**
6. 🏃 **How's your lifestyle?** (sleep, exercise, diet, stress level)

Once I have these details, I'll provide you with:
- 🫀 **Body Systems Analysis** — which systems are affected and why
- 🌿 **Safe Home Remedies** — if appropriate for your risk level
- 📊 **Personalized Risk Assessment** — with explainable factor breakdown
- 💡 **Actionable Recommendations** — tailored to your specific situation

The more I know, the more personalized my guidance can be! 😊

*— AetherDx AI Engine v3.0*"""

    async def generate_health_explanation(self, prediction_data: Dict, symptoms: List[str],
                                         explanations: List[Dict], severity: str = "moderate",
                                         duration: str = "weeks") -> str:
        """Generate a natural language explanation of ML prediction results."""
        if not self.is_available:
            return self._generate_fallback_explanation(prediction_data, symptoms, explanations)

        prompt = f"""Based on the following health risk prediction, generate a comprehensive, empathetic explanation:

# ML Metrics Input
- Symptoms: {', '.join(s.replace('_', ' ') for s in symptoms) if symptoms else 'None provided'}
- Severity: {severity} | Duration: {duration}
- Associated Factors: {chr(10).join(f"- {e['symptom']} ({e['percentage']}%)" for e in explanations) if explanations else 'None identified'}
- ML Diagnosis Suspicion: {prediction_data['primary_prediction']} (Prob: {prediction_data['primary_probability']}%)

Generate clinical reasoning with body systems analysis, home remedies (if appropriate), and explainable AI factor breakdown."""

        try:
            if self.provider == "anthropic":
                import asyncio
                response = await asyncio.to_thread(
                    self.client.messages.create, model="claude-sonnet-4-20250514", max_tokens=4096,
                    system=SYSTEM_PROMPT, messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            else:
                from google.genai import types
                client = self.gemini_client if self.gemini_client else self.client
                response = await client.aio.models.generate_content(
                    model='gemini-2.5-flash', contents=prompt,
                    config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
                )
                return response.text
        except Exception as e:
            print(f"AI explanation error: {e}")
            return self._generate_fallback_explanation(prediction_data, symptoms, explanations)

    def _generate_fallback_explanation(self, prediction_data: Dict, symptoms: List[str], explanations: List[Dict]) -> str:
        """Generate explanation when AI APIs are unavailable."""
        primary = prediction_data["primary_prediction"]
        prob = prediction_data["primary_probability"]
        symptom_list = ", ".join(s.replace("_", " ").title() for s in symptoms)
        return f"### Clinical Summary\nSymptoms: {symptom_list}.\nRisk probability indicates **{prob}%** links to **{primary}**."

    async def analyze_general_condition(self, message: str, symptoms: List[str],
                                       severity: str, duration: str) -> Dict:
        """AI Reasoning Layer for generalized diseases outside core models."""
        prompt = f"""Analyze these symptoms: {', '.join(symptoms)}
Severity: {severity}, Duration: {duration}
User Context: "{message}"

Act as a medical diagnostic reasoning engine. Identify the MOST LIKELY health issue (outside of Diabetes, Hypertension, Anemia).

RETURN ONLY RAW JSON. Format exactly as:
{{
    "primary_prediction": "Condition Name",
    "primary_probability": 0,
    "primary_risk_tier": "MODERATE",
    "model_agreement": "High confidence (AI Reasoning)",
    "predictions": [{{"condition": "Condition Name", "probability": 0, "risk_tier": "MODERATE", "risk_color": "#F59E0B"}}],
    "contributing_factors": [{{"symptom": "Symptom Name", "percentage": 0, "contribution": 0.0}}],
    "explanation": "Diagnostic explanation...",
    "risk_trend_logic": "Stable"
}}"""
        
        try:
            if not self.is_available:
                raise Exception("AI API not available")
            if self.provider == "anthropic":
                import asyncio
                response = await asyncio.to_thread(
                    self.client.messages.create, model="claude-sonnet-4-20250514", max_tokens=2048,
                    system="You are a medical JSON API. Return valid JSON only.",
                    messages=[{"role": "user", "content": prompt}]
                )
                text = response.content[0].text
            else:
                from google.genai import types
                client = self.gemini_client if self.gemini_client else self.client
                response = await client.aio.models.generate_content(
                    model='gemini-2.5-flash', contents=prompt,
                    config=types.GenerateContentConfig(system_instruction="You are a medical JSON API. Return valid JSON only.")
                )
                text = response.text
            
            clean_json = text.strip()
            if clean_json.startswith("```json"): clean_json = clean_json[7:]
            if clean_json.startswith("```"): clean_json = clean_json[3:]
            if clean_json.endswith("```"): clean_json = clean_json[:-3]
            return json.loads(clean_json.strip())
        except Exception:
            return {
                "primary_prediction": "General Consultation Required",
                "primary_probability": 50.0,
                "primary_risk_tier": "MODERATE",
                "model_agreement": "Baseline Analysis",
                "predictions": [{"condition": "General Health Issue", "probability": 50.0, "risk_tier": "MODERATE", "risk_color": "#F59E0B"}],
                "contributing_factors": [{"symptom": s, "percentage": 100/max(1, len(symptoms)), "contribution": 0.5} for s in symptoms],
                "explanation": "Reported symptoms require broader clinical examination.",
                "risk_trend_logic": "Stable"
            }

    async def generate_follow_up_questions(self, symptoms: List[str], current_severity: Optional[str] = None) -> List[Dict]:
        """Provides native dynamic follow-up logic."""
        questions = []
        if not current_severity:
            questions.append({
                "id": "severity", "question": "Severity of symptoms?", "type": "choice",
                "options": [
                    {"label": "Mild", "value": "mild", "description": "Minimal impact"},
                    {"label": "Moderate", "value": "moderate", "description": "Noticeable impact"},
                    {"label": "Severe", "value": "severe", "description": "Highly impactful"}
                ]
            })
        questions.append({
            "id": "duration", "question": "Duration of symptoms?", "type": "choice",
            "options": [
                {"label": "Days", "value": "days", "description": "Less than 1 week"},
                {"label": "Weeks", "value": "weeks", "description": "1-4 weeks"},
                {"label": "Months", "value": "months", "description": "More than 1 month"}
            ]
        })
        return questions

    def clear_session(self, session_id: str = "default"):
        """Clear a chat session."""
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]

# Singleton instance
gemini_service = GeminiService()

