"""
Conversational and Reasoning AI Providers (LLM Orchestration)
Integrates OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), and Google (Gemini)
via simulated/live endpoints managed by the FallbackOrchestrator.
"""

import os
from typing import Dict, Optional
from gateway.orchestrator import orchestrator
from openai import OpenAI
from services.gemini_service import gemini_service
import asyncio

class ChatGPTProvider:
    """OpenAI GPT-4o Provider Wrapper."""
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def analyze_health_data(self, context: str) -> str:
        if not self.api_key or not self.client:
            # Simulate enterprise OpenAI XAI response
            return "Based on clinical clustering algorithms (via OpenAI integration simulation), the patient's symptoms present a moderate cardiovascular correlation, isolated from acute metabolic deviations. Recommending immediate ECG screening if chest pain persists."
        
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a clinical reasoning AI. Provide a concise, expert analysis of the provided patient health data."},
                {"role": "user", "content": context}
            ]
        )
        return response.choices[0].message.content


class AnthropicProvider:
    """Anthropic Claude 3.5 Sonnet Provider Wrapper."""
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")

    def analyze_health_data(self, context: str) -> str:
        if not self.api_key:
            # Simulate enterprise Anthropic reasoning
            return "From an Anthropic safety-first reasoning paradigm, the combination of SpO2 fluctuations and elevated heart rate signals an urgent respiratory constraint. We prioritize a safe, immediate referral rather than delayed observation."
        raise NotImplementedError("Anthropic API call requires sdk integration.")


class GeminiProvider:
    """Google Gemini Pro Provider Wrapper."""
    def __init__(self):
        self.service = gemini_service

    def analyze_health_data(self, context: str) -> str:
        if not self.service.is_available:
            # Simulate Google's internal deep analysis
            return "Gemini cross-referenced historical anomalies and determined a 98% probability that current lifestyle factors are exacerbating benign tachycardia. Adjusting hydration models in the orchestration layer mitigates risk."
        
        # Call the live service with the new SYSTEM_PROMPT
        # Since this provider is currently called synchronously, we run the async method
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        return loop.run_until_complete(self.service.chat(context))


class LLMOrchestrationService:
    """
    Exposes unified diagnostic reasoning via the gateway fallback system.
    """
    def __init__(self):
        self.openai = ChatGPTProvider()
        self.anthropic = AnthropicProvider()
        self.gemini = GeminiProvider()

    def generate_clinical_explanation(self, context_data: Dict) -> Dict:
        """
        Attempts to generate an explanation using Anthropic (primary), falls back
        to OpenAI (secondary), and then Gemini (tertiary).
        """
        prompt = str(context_data)
        
        # Build task list for orchestrator
        tasks = [
            ("Google_Gemini", slice(self.gemini.analyze_health_data, prompt)),
            ("OpenAI_GPT4o", slice(self.openai.analyze_health_data, prompt)),
            ("Anthropic_Claude", slice(self.anthropic.analyze_health_data, prompt)),
        ]
        
        # We simulate the func calls via lambda
        callables = [
            ("Google_Gemini", lambda: self.gemini.analyze_health_data(prompt)),
            ("OpenAI_GPT4o", lambda: self.openai.analyze_health_data(prompt)),
            ("Anthropic_Claude", lambda: self.anthropic.analyze_health_data(prompt))
        ]
        
        default_fail = "The orchestration layer's AI reasoning providers are currently offline."
        result, provider = orchestrator.execute_with_fallback(callables, default_response=default_fail)

        return {
            "source_provider": provider,
            "reasoning": result,
            "mode": "live" if os.environ.get(f"{provider.split('_')[0].upper()}_API_KEY") else "simulated_orchestration"
        }

# Singleton
llm_orchestrator = LLMOrchestrationService()
