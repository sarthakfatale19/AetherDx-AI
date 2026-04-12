"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface VitalsData {
  temperature_f: number | null;
  heart_rate: number | null;
  spo2: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
}

export interface BodyMetricsData {
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  sex: string | null;
}

export interface SymptomEntryData {
  symptom: string;
  severity: number;
  duration: string;
  trend: string;
}

export interface LifestyleData {
  sleep_hours: number | null;
  stress_level: number | null;
  exercise_mins_week: number | null;
  diet_score: number | null;
  water_glasses: number | null;
}

export interface EmergencyAlert {
  type: string;
  field?: string;
  value?: any;
  message: string;
}

export interface EmergencyState {
  is_emergency: boolean;
  alerts: EmergencyAlert[];
  action: string;
  emergency_number: string;
  message: string | null;
}

export interface ScoreFactor {
  name: string;
  points: number;
  color: string;
}

export interface RealtimeScore {
  score: number;
  health_score: number;
  tier: string;
  label: string;
  color: string;
  factors: ScoreFactor[];
  inputs_provided: boolean;
}

export interface AssessmentResult {
  type: string;
  predictions: any[];
  primary_prediction: string;
  primary_probability: number;
  primary_risk_tier: string;
  model_agreement: string;
  contributing_factors: any[];
  form_reasoning: any[];
  form_score: RealtimeScore;
  adaptive_score: any;
  emergency: EmergencyState;
  derived_features: any;
  compound_risks: any[];
  bmi: { value: number; category: string } | null;
  action_plan: any;
  risk_trend: any[];
  active_symptoms: any[];
  abha_report: any;
  personalized_recommendations: any[];
  edge_readiness: any;
}

const DEFAULT_VITALS: VitalsData = {
  temperature_f: null, heart_rate: null, spo2: null,
  bp_systolic: null, bp_diastolic: null,
};

const DEFAULT_BODY: BodyMetricsData = {
  height_cm: null, weight_kg: null, age: null, sex: null,
};

const DEFAULT_LIFESTYLE: LifestyleData = {
  sleep_hours: null, stress_level: null, exercise_mins_week: null,
  diet_score: null, water_glasses: null,
};

export function useAssessment() {
  const [vitals, setVitals] = useState<VitalsData>(DEFAULT_VITALS);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricsData>(DEFAULT_BODY);
  const [symptoms, setSymptoms] = useState<SymptomEntryData[]>([]);
  const [lifestyle, setLifestyle] = useState<LifestyleData>(DEFAULT_LIFESTYLE);
  const [freeText, setFreeText] = useState("");

  const [realtimeScore, setRealtimeScore] = useState<RealtimeScore | null>(null);
  const [emergency, setEmergency] = useState<EmergencyState | null>(null);
  const [bmiInfo, setBmiInfo] = useState<{ value: number; category: string } | null>(null);
  const [compoundRisks, setCompoundRisks] = useState<any[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pauseRealtimeRef = useRef(false);

  // Validate vitals ranges before sending to API (prevents 422 errors)
  const validateVitals = useCallback((v: VitalsData): VitalsData => {
    const validated = { ...v };
    if (validated.spo2 !== null) {
      if (validated.spo2 < 50 || validated.spo2 > 100) validated.spo2 = null;
    }
    if (validated.temperature_f !== null) {
      if (validated.temperature_f < 90 || validated.temperature_f > 115) validated.temperature_f = null;
    }
    if (validated.heart_rate !== null) {
      if (validated.heart_rate < 20 || validated.heart_rate > 250) validated.heart_rate = null;
    }
    if (validated.bp_systolic !== null) {
      if (validated.bp_systolic < 40 || validated.bp_systolic > 300) validated.bp_systolic = null;
    }
    if (validated.bp_diastolic !== null) {
      if (validated.bp_diastolic < 40 || validated.bp_diastolic > 300) validated.bp_diastolic = null;
    }
    return validated;
  }, []);

  // Deeply sanitize object: Convert empty strings and NaNs to null
  const sanitizePayload = useCallback((obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === "number" && isNaN(obj)) return null;
    if (typeof obj === "string") {
      const trimmed = obj.trim();
      return trimmed === "" ? null : trimmed;
    }
    if (Array.isArray(obj)) return obj.map(sanitizePayload);
    if (typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizePayload(value);
      }
      return sanitized;
    }
    return obj;
  }, []);

  // Debounced real-time API call — fully error-safe
  const fetchRealtimeScore = useCallback(() => {
    // Don't fetch during submission or after result is shown
    if (pauseRealtimeRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Cancel previous in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const rawBody: any = { session_id: "default" };
        
        const validatedVitals = validateVitals(vitals);
        const hasVitals = Object.values(validatedVitals).some(v => v !== null && !Number.isNaN(v));
        if (hasVitals) rawBody.vitals = validatedVitals;
        
        const hasBody = bodyMetrics.height_cm !== null || bodyMetrics.weight_kg !== null || bodyMetrics.age !== null || bodyMetrics.sex !== null;
        if (hasBody) rawBody.body_metrics = bodyMetrics;
        if (symptoms.length > 0) rawBody.symptoms = symptoms;
        const hasLifestyle = Object.values(lifestyle).some(v => v !== null && !Number.isNaN(v));
        if (hasLifestyle) rawBody.lifestyle = lifestyle;

        if (!hasVitals && !hasBody && symptoms.length === 0 && !hasLifestyle) return;

        const sanitizedBody = sanitizePayload(rawBody);

        const res = await fetch(`${API_URL}/api/assess/realtime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitizedBody),
          signal: controller.signal,
        });
        if (!res.ok) return; // silently ignore HTTP errors
        const data = await res.json();
        
        // Only update if we haven't been paused (e.g. submission happened)
        if (!pauseRealtimeRef.current) {
          setRealtimeScore(data.score);
          setEmergency(data.emergency);
          setBmiInfo(data.bmi);
          setCompoundRisks(data.compound_risks || []);
          if (data.emergency?.is_emergency) setEmergencyDismissed(false);
        }
      } catch {
        // Silently ignore ALL errors (network, abort, parse, etc.)
        // This prevents the Next.js error overlay from blocking the UI
      }
    }, 800); // Increased debounce to reduce lag
  }, [vitals, bodyMetrics, symptoms, lifestyle, sanitizePayload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const updateVital = useCallback((field: keyof VitalsData, value: number | null) => {
    setVitals(prev => {
      const next = { ...prev, [field]: value };
      return next;
    });
    setTimeout(fetchRealtimeScore, 0);
  }, [fetchRealtimeScore]);

  const updateBodyMetric = useCallback((field: keyof BodyMetricsData, value: any) => {
    setBodyMetrics(prev => ({ ...prev, [field]: value }));
    setTimeout(fetchRealtimeScore, 0);
  }, [fetchRealtimeScore]);

  const toggleSymptom = useCallback((symptom: string) => {
    setSymptoms(prev => {
      const exists = prev.find(s => s.symptom === symptom);
      if (exists) {
        return prev.filter(s => s.symptom !== symptom);
      }
      return [...prev, { symptom, severity: 5, duration: "weeks", trend: "stable" }];
    });
    setTimeout(fetchRealtimeScore, 0);
  }, [fetchRealtimeScore]);

  const updateSymptomDetail = useCallback((symptom: string, field: string, value: any) => {
    setSymptoms(prev =>
      prev.map(s => s.symptom === symptom ? { ...s, [field]: value } : s)
    );
    setTimeout(fetchRealtimeScore, 0);
  }, [fetchRealtimeScore]);

  const updateLifestyle = useCallback((field: keyof LifestyleData, value: number | null) => {
    setLifestyle(prev => ({ ...prev, [field]: value }));
    setTimeout(fetchRealtimeScore, 0);
  }, [fetchRealtimeScore]);

  const submitAssessment = useCallback(async () => {
    setIsSubmitting(true);
    
    // Pause realtime scoring during submission to prevent interference
    pauseRealtimeRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    try {
      const rawBody: any = { session_id: "default" };
      const validatedVitals = validateVitals(vitals);
      const hasVitals = Object.values(validatedVitals).some(v => v !== null && !Number.isNaN(v));
      if (hasVitals) rawBody.vitals = validatedVitals;
      const hasBody = bodyMetrics.height_cm !== null || bodyMetrics.weight_kg !== null || bodyMetrics.age !== null || bodyMetrics.sex !== null;
      if (hasBody) rawBody.body_metrics = bodyMetrics;
      if (symptoms.length > 0) rawBody.symptoms = symptoms;
      const hasLifestyle = Object.values(lifestyle).some(v => v !== null && !Number.isNaN(v));
      if (hasLifestyle) rawBody.lifestyle = lifestyle;
      if (freeText.trim()) rawBody.free_text = freeText;

      // ==========================================
      // UIIL Layer: Local Normalization & Processing
      // ==========================================
      const detectedCompounds = [];
      const hasDiabetesSymptom = symptoms.some(s => s.symptom === "frequent_urination" || s.symptom === "excessive_thirst");
      const hasFatigue = symptoms.some(s => s.symptom === "fatigue");
      if (hasDiabetesSymptom && hasFatigue) {
        detectedCompounds.push({ risk: "Metabolic Exhaustion", severity: "high", components: ["fatigue", "diabetes_symptoms"] });
      }
      
      const hasChestPain = symptoms.some(s => s.symptom === "chest_pain");
      const hasBreathing = symptoms.some(s => s.symptom === "shortness_of_breath");
      if (hasChestPain && hasBreathing) {
        detectedCompounds.push({ risk: "Cardiopulmonary Distress", severity: "critical", components: ["chest_pain", "shortness_of_breath"] });
      }

      // Append mathematically normalized UIIL features to the drop payload
      if (detectedCompounds.length > 0) {
        rawBody.uiil_processed_compounds = detectedCompounds;
      }

      const sanitizedBody = sanitizePayload(rawBody);

      const res = await fetch(`${API_URL}/api/assess/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedBody),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        console.error("Submit API error:", res.status, errText);
        alert(`Assessment failed (${res.status}). Please try again.`);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Could not connect to the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
      // Keep realtime paused — results are showing now
    }
  }, [vitals, bodyMetrics, symptoms, lifestyle, freeText, sanitizePayload]);

  const dismissEmergency = useCallback(() => {
    setEmergencyDismissed(true);
  }, []);

  const resetForm = useCallback(() => {
    setVitals(DEFAULT_VITALS);
    setBodyMetrics(DEFAULT_BODY);
    setSymptoms([]);
    setLifestyle(DEFAULT_LIFESTYLE);
    setFreeText("");
    setRealtimeScore(null);
    setEmergency(null);
    setBmiInfo(null);
    setCompoundRisks([]);
    setResult(null);
    setCurrentStep(0);
    setEmergencyDismissed(false);
    // Re-enable realtime scoring for next assessment
    pauseRealtimeRef.current = false;
  }, []);

  return {
    // State
    vitals, bodyMetrics, symptoms, lifestyle, freeText,
    realtimeScore, emergency, bmiInfo, compoundRisks,
    result, isSubmitting, currentStep, emergencyDismissed,
    // Actions
    updateVital, updateBodyMetric,
    toggleSymptom, updateSymptomDetail,
    updateLifestyle, setFreeText,
    setCurrentStep, submitAssessment,
    dismissEmergency, resetForm,
  };
}
