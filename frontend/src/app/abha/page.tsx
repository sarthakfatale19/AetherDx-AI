"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, RotateCcw, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { useABHA, type ABHAStep } from "@/hooks/useABHA";
import ABHALoginCard from "@/components/abha/ABHALoginCard";
import ConsentManager from "@/components/abha/ConsentManager";
import FHIRDataView from "@/components/abha/FHIRDataView";
import ABHAPredictionResult from "@/components/abha/ABHAPredictionResult";

const STEPS: { id: ABHAStep; label: string; num: number }[] = [
  { id: "login", label: "Login", num: 1 },
  { id: "otp", label: "Verify", num: 2 },
  { id: "consent", label: "Consent", num: 3 },
  { id: "data", label: "Data", num: 4 },
  { id: "predict", label: "AI Prediction", num: 5 },
];

function StepIndicator({ currentStep }: { currentStep: ABHAStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <motion.div
              animate={{
                background: isCurrent
                  ? "linear-gradient(135deg, #6366F1, #818CF8)"
                  : isCompleted
                  ? "rgba(34,197,94,0.2)"
                  : "rgba(255,255,255,0.03)",
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                border: isCurrent
                  ? "1px solid rgba(99,102,241,0.4)"
                  : isCompleted
                  ? "1px solid rgba(34,197,94,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {isCompleted ? (
                <CheckCircle2 size={14} className="text-green-400" />
              ) : (
                <span className={`text-[10px] font-bold ${isCurrent ? "text-white" : "text-[#555]"}`}>
                  {step.num}
                </span>
              )}
            </motion.div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={12} className={isCompleted ? "text-green-500/30" : "text-[#333]"} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ABHAPage() {
  const abha = useABHA();
  const [symptoms, setSymptoms] = useState<string[]>([]);

  const handleProceedToPredict = async () => {
    await abha.runPrediction(symptoms);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8"
      style={{ marginLeft: "68px", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 50%)" }}
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            ABHA Health Intelligence
          </h1>
          <span className="text-[9px] px-2 py-0.5 rounded bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20">
            {abha.mode === "simulation" ? "🧪 Simulation" : "🔐 Live"}
          </span>
        </div>
        <p className="text-xs text-[#888]">Secure, consent-based health intelligence powered by ABDM</p>
      </motion.div>

      {/* Session Bar */}
      {abha.profile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="w-full max-w-lg mb-4"
        >
          <div className="flex items-center justify-between px-4 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-[10px] font-bold text-white">
                {abha.profile.name?.[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-white">{abha.profile.name}</p>
                <p className="text-[9px] text-[#666]">{abha.profile.abha_number}</p>
              </div>
            </div>
            <button
              onClick={abha.reset}
              className="text-[10px] text-[#666] hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={10} /> Logout
            </button>
          </div>
        </motion.div>
      )}

      {/* Step Indicator */}
      <StepIndicator currentStep={abha.step} />

      {/* Error Banner */}
      <AnimatePresence>
        {abha.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-lg mb-4 px-4 py-3 rounded-xl text-xs text-red-300"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            ⚠️ {abha.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1 & 2: Login + OTP */}
        {(abha.step === "login" || abha.step === "otp") && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <ABHALoginCard
              onLogin={abha.initiateLogin}
              onVerify={abha.verifyOTP}
              loading={abha.loading}
              step={abha.step}
              mode={abha.mode}
            />
          </motion.div>
        )}

        {/* Step 3: Consent */}
        {abha.step === "consent" && (
          <motion.div
            key="consent"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <ConsentManager
              onConsent={abha.requestConsent}
              onRevoke={abha.revokeConsent}
              consentArtifact={abha.consentArtifact}
              loading={abha.loading}
              profile={abha.profile}
            />
          </motion.div>
        )}

        {/* Step 4: Data View + Predict CTA */}
        {abha.step === "data" && (
          <motion.div
            key="data"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg mx-auto space-y-4"
          >
            {/* Fetch Data Button (if not yet fetched) */}
            {!abha.fhirData && (
              <button
                onClick={abha.fetchHealthData}
                disabled={abha.loading}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white
                           bg-gradient-to-r from-[#6366F1] to-[#818CF8]
                           hover:from-[#5558E8] hover:to-[#727AE8]
                           disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                id="fetch-data-btn"
              >
                {abha.loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Fetching health records...
                  </span>
                ) : (
                  <>
                    <Shield size={16} /> Fetch Health Records
                  </>
                )}
              </button>
            )}

            {/* Data View */}
            {abha.fhirData && abha.fhirSummary && abha.mlFeatures && (
              <>
                <FHIRDataView
                  parsedData={abha.fhirData}
                  summary={abha.fhirSummary}
                  mlFeatures={abha.mlFeatures}
                />

                {/* Symptom Input */}
                <div className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">
                    Additional Symptoms (Optional)
                  </p>
                  <p className="text-[9px] text-[#555] mb-3">
                    Add symptoms to combine with your ABHA health records for a more comprehensive assessment.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["fatigue", "headache", "dizziness", "frequent_urination", "excessive_thirst", "shortness_of_breath", "chest_pain", "blurred_vision"].map((s) => {
                      const active = symptoms.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() =>
                            setSymptoms((prev) =>
                              active ? prev.filter((x) => x !== s) : [...prev, s]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${
                            active
                              ? "bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/25"
                              : "bg-white/[0.02] text-[#888] border border-white/5 hover:border-white/10"
                          }`}
                        >
                          {s.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Run Prediction Button */}
                <button
                  onClick={handleProceedToPredict}
                  disabled={abha.loading}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white
                             bg-gradient-to-r from-[#6366F1] to-[#818CF8]
                             hover:from-[#5558E8] hover:to-[#727AE8]
                             disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                  id="run-prediction-btn"
                  style={{ boxShadow: "0 4px 20px rgba(99,102,241,0.2)" }}
                >
                  {abha.loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Running AI analysis...
                    </span>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Run ABHA-Enhanced AI Prediction
                      {symptoms.length > 0 && (
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded">
                          +{symptoms.length} symptoms
                        </span>
                      )}
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Step 5: Prediction Results */}
        {abha.step === "predict" && abha.prediction && (
          <motion.div
            key="predict"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <ABHAPredictionResult
              prediction={abha.prediction}
              onSync={abha.syncData}
              syncing={abha.syncing}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {abha.step === "predict" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-3 mt-6"
        >
          <button
            onClick={() => window.location.href = "/"}
            className="px-5 py-2 rounded-xl text-xs text-[#888] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all"
          >
            ← Back to Chat
          </button>
          <button
            onClick={abha.reset}
            className="px-5 py-2 rounded-xl text-xs text-[#888] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all flex items-center gap-1"
          >
            <RotateCcw size={12} /> New Assessment
          </button>
        </motion.div>
      )}
    </div>
  );
}
