"use client";

import { useState, useCallback } from "react";

// ── Types ──

export type ABHAStep = "login" | "otp" | "consent" | "data" | "predict";

export interface ABHAProfile {
  name: string;
  abha_number: string;
  abha_address?: string;
  gender: string;
  year_of_birth: number;
  date_of_birth?: string;
  mobile: string;
  state: string;
  district?: string;
  phr_address?: string;
}

export interface ConsentArtifact {
  consent_id: string;
  status: string;
  data_types: string[];
  purpose: { text: string };
  date_range: { from: string; to: string };
  expiry: string;
  hip: { name: string };
  audit_trail?: Array<{ action: string; timestamp: string; by: string }>;
}

export interface FHIRSummary {
  total_observations: number;
  total_conditions: number;
  total_medications: number;
  total_reports: number;
  risk_flags: string[];
  lab_highlights: Array<{
    name: string;
    value: number;
    unit: string;
    status: string;
    date?: string;
  }>;
  alerts: string[];
  diagnostic_conclusions: Array<{
    report: string;
    conclusion: string;
    date: string;
  }>;
  time_series_available: string[];
}

export interface TrendData {
  feature: string;
  current_value: number;
  previous_value: number;
  change: number;
  pct_change: number;
  direction: "worsening" | "improving" | "stable";
  grade: string;
  unit: string;
  projection_30d: number;
  projection_90d: number;
  history: Array<{ value: number; date: string }>;
}

export interface TrendAnalysis {
  trends: Record<string, TrendData>;
  overall_direction: string;
  worsening_indicators: number;
  improving_indicators: number;
  total_tracked: number;
}

export interface Recommendation {
  title: string;
  description: string;
  actions: string[];
  urgency: string;
  icon: string;
}

export interface RiskProjection {
  day: number;
  risk_percentage: number;
  label: string;
}

export interface ABHAPrediction {
  prediction: any;
  explanations: any[];
  shap_explanation: any;
  lime_explanation: any;
  risk_summary: string;
  fhir_summary: FHIRSummary;
  fhir_features: Record<string, number>;
  risk_flags: string[];
  trend_analysis: TrendAnalysis | null;
  risk_projection: RiskProjection[];
  recommendations: Recommendation[];
  sync_result: any;
  data_source: {
    abha_records: number;
    conditions: number;
    medications: number;
    diagnostic_reports: number;
    symptoms_added: number;
    time_series_features: number;
  };
  model_info: {
    primary_model: string;
    total_models: number;
    has_xgboost: boolean;
    model_scores: Record<string, number>;
  };
}

export interface ABHAState {
  step: ABHAStep;
  loading: boolean;
  error: string | null;
  txnId: string | null;
  sessionId: string | null;
  profile: ABHAProfile | null;
  consentId: string | null;
  consentArtifact: ConsentArtifact | null;
  fhirData: any | null;
  fhirSummary: FHIRSummary | null;
  mlFeatures: Record<string, number> | null;
  trendAnalysis: TrendAnalysis | null;
  timeSeries: Record<string, any[]> | null;
  prediction: ABHAPrediction | null;
  mode: string;
  syncing: boolean;
}

const API_BASE = ""; // Relative paths for same-domain Vercel deployment

export function useABHA() {
  const [state, setState] = useState<ABHAState>({
    step: "login",
    loading: false,
    error: null,
    txnId: null,
    sessionId: null,
    profile: null,
    consentId: null,
    consentArtifact: null,
    fhirData: null,
    fhirSummary: null,
    mlFeatures: null,
    trendAnalysis: null,
    timeSeries: null,
    prediction: null,
    mode: "simulation",
    syncing: false,
  });

  const setError = (error: string | null) => setState((s) => ({ ...s, error, loading: false }));
  const setLoading = (loading: boolean) => setState((s) => ({ ...s, loading, error: null }));

  // ── Step 1: Initiate ABHA Login ──
  const initiateLogin = useCallback(async (abhaId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abha/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abha_id: abhaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      setState((s) => ({
        ...s,
        loading: false,
        txnId: data.txn_id,
        step: "otp",
        mode: data.mode || "simulation",
      }));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // ── Step 2: Verify OTP ──
  const verifyOTP = useCallback(async (otp: string) => {
    if (!state.txnId) return setError("No transaction ID");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abha/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txn_id: state.txnId, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "OTP verification failed");
      setState((s) => ({
        ...s,
        loading: false,
        sessionId: data.session_id,
        profile: data.profile,
        step: "consent",
      }));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [state.txnId]);

  // ── Step 3: Request Consent ──
  const requestConsent = useCallback(
    async (dataTypes: string[], durationDays: number = 30) => {
      if (!state.sessionId) return setError("No session");
      setLoading(true);
      try {
        const reqRes = await fetch(`${API_BASE}/api/abha/consent/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: state.sessionId,
            data_types: dataTypes,
            purpose: "AI Risk Prediction",
            duration_days: durationDays,
          }),
        });
        const reqData = await reqRes.json();
        if (!reqRes.ok) throw new Error(reqData.detail || "Consent request failed");

        // Auto-approve in simulation mode
        const approveRes = await fetch(`${API_BASE}/api/abha/consent/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consent_id: reqData.consent_id }),
        });
        await approveRes.json();

        setState((s) => ({
          ...s,
          loading: false,
          consentId: reqData.consent_id,
          consentArtifact: { ...reqData.artifact, status: "GRANTED" },
          step: "data",
        }));
        return reqData;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [state.sessionId]
  );

  // ── Step 4: Fetch Health Data ──
  const fetchHealthData = useCallback(async () => {
    if (!state.consentId) return setError("No consent");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abha/data/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_id: state.consentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Data fetch failed");
      setState((s) => ({
        ...s,
        loading: false,
        fhirData: data.parsed_data,
        fhirSummary: data.summary,
        mlFeatures: data.ml_features,
        trendAnalysis: data.trend_analysis,
        timeSeries: data.time_series,
      }));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [state.consentId]);

  // ── Step 5: Run Enhanced Prediction ──
  const runPrediction = useCallback(
    async (symptoms: string[] = []) => {
      if (!state.consentId) return setError("No consent");
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/abha/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consent_id: state.consentId,
            symptoms,
            severity: "moderate",
            duration: "weeks",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Prediction failed");
        setState((s) => ({
          ...s,
          loading: false,
          prediction: data,
          step: "predict",
        }));
        return data;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [state.consentId]
  );

  // ── Sync Data ──
  const syncData = useCallback(async () => {
    if (!state.consentId) return;
    setState((s) => ({ ...s, syncing: true }));
    try {
      const res = await fetch(`${API_BASE}/api/abha/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_id: state.consentId }),
      });
      const data = await res.json();
      if (data.prediction) {
        setState((s) => ({
          ...s,
          syncing: false,
          prediction: data.prediction,
        }));
      } else {
        setState((s) => ({ ...s, syncing: false }));
      }
      return data;
    } catch {
      setState((s) => ({ ...s, syncing: false }));
    }
  }, [state.consentId]);

  // ── Revoke Consent ──
  const revokeConsent = useCallback(async () => {
    if (!state.consentId) return;
    try {
      await fetch(`${API_BASE}/api/abha/consent/revoke/${state.consentId}`, { method: "DELETE" });
      setState((s) => ({
        ...s,
        consentId: null,
        consentArtifact: null,
        fhirData: null,
        fhirSummary: null,
        mlFeatures: null,
        trendAnalysis: null,
        timeSeries: null,
        prediction: null,
        step: "consent",
      }));
    } catch {}
  }, [state.consentId]);

  // ── Reset ──
  const reset = useCallback(() => {
    setState({
      step: "login",
      loading: false,
      error: null,
      txnId: null,
      sessionId: null,
      profile: null,
      consentId: null,
      consentArtifact: null,
      fhirData: null,
      fhirSummary: null,
      mlFeatures: null,
      trendAnalysis: null,
      timeSeries: null,
      prediction: null,
      mode: "simulation",
      syncing: false,
    });
  }, []);

  return {
    ...state,
    initiateLogin,
    verifyOTP,
    requestConsent,
    fetchHealthData,
    runPrediction,
    syncData,
    revokeConsent,
    reset,
  };
}
