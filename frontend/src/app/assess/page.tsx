"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, ClipboardList, Sparkles } from "lucide-react";
import { useAssessment } from "@/hooks/useAssessment";
import FormVitals from "@/components/form/FormVitals";
import FormBody from "@/components/form/FormBody";
import FormSymptoms from "@/components/form/FormSymptoms";
import FormLifestyle from "@/components/form/FormLifestyle";
import LiveRiskGauge from "@/components/form/LiveRiskGauge";
import EmergencyOverlay from "@/components/form/EmergencyOverlay";
import AssessmentResultView from "@/components/form/AssessmentResult";

const STEPS = [
  { label: "Vitals", icon: "🫀", description: "Temperature, heart rate, SpO2, blood pressure" },
  { label: "Body", icon: "📏", description: "Height, weight, age for BMI calculation" },
  { label: "Symptoms", icon: "🩺", description: "Select and rate your symptoms" },
  { label: "Lifestyle", icon: "🏃", description: "Sleep, stress, exercise, diet, hydration" },
];

export default function AssessPage() {
  const {
    vitals, bodyMetrics, symptoms, lifestyle,
    realtimeScore, emergency, bmiInfo, compoundRisks,
    result, isSubmitting, currentStep, emergencyDismissed,
    updateVital, updateBodyMetric,
    toggleSymptom, updateSymptomDetail,
    updateLifestyle,
    setCurrentStep, submitAssessment,
    dismissEmergency, resetForm,
  } = useAssessment();

  // Show emergency overlay
  if (emergency?.is_emergency && !emergencyDismissed) {
    return <EmergencyOverlay emergency={emergency} onDismiss={dismissEmergency} />;
  }

  // Show results
  if (result) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] px-4 py-8">
        <div className="max-w-4xl mx-auto w-full">
          <AssessmentResultView result={result} onReset={resetForm} />
        </div>
      </div>
    );
  }

  const canGoPrev = currentStep > 0;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Top Bar */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-white/5"
        style={{ background: "rgba(13,13,13,0.95)", backdropFilter: "blur(20px)" }}>
        <Link href="/" className="p-2 rounded-xl text-[#555] hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center">
            <ClipboardList size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Health Assessment</h1>
            <p className="text-[10px] text-[#555]">AetherDx AI — Structured Analysis</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <Sparkles size={10} className="text-[#818CF8]" />
          <span className="text-[9px] font-semibold text-[#818CF8]">Live Scoring</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-1 w-full">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-center ${
                  i === currentStep
                    ? "bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30"
                    : i < currentStep
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "text-[#444] border border-white/5 hover:border-white/10"
                }`}
              >
                <span>{step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-[1px] mx-0.5 flex-shrink-0 ${
                  i < currentStep ? "bg-green-500/30" : "bg-white/5"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 flex flex-col items-center">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start gap-6 w-full">
          {/* Form Panel */}
          <div className="w-full md:w-2/3 min-w-0 overflow-hidden flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">{STEPS[currentStep].icon} {STEPS[currentStep].label}</h2>
              <p className="text-xs text-[#555]">{STEPS[currentStep].description}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {currentStep === 0 && (
                  <FormVitals
                    vitals={vitals}
                    onVitalChange={updateVital}
                  />
                )}
                {currentStep === 1 && (
                  <FormBody
                    bodyMetrics={bodyMetrics}
                    bmiInfo={bmiInfo}
                    onBodyChange={updateBodyMetric}
                  />
                )}
                {currentStep === 2 && (
                  <FormSymptoms
                    symptoms={symptoms} onToggle={toggleSymptom} onUpdate={updateSymptomDetail}
                  />
                )}
                {currentStep === 3 && (
                  <FormLifestyle lifestyle={lifestyle} onUpdate={updateLifestyle} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Side Panel: Live Score */}
          <div className="hidden md:block w-full md:w-1/3 min-w-0">
            <div className="sticky top-4 space-y-4 w-full">
              <LiveRiskGauge score={realtimeScore} />

              {/* Compound Risks */}
              {compoundRisks.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-[10px] text-[#666] uppercase tracking-widest mb-2">Compound Risks</p>
                  {compoundRisks.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: r.severity === "high" ? "#EF4444" : "#F59E0B" }} />
                      <span className="text-[10px] text-[#888]">{r.risk}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Live Score */}
        <div className="md:hidden mt-6 max-w-4xl mx-auto w-full">
          <LiveRiskGauge score={realtimeScore} />
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5"
        style={{ background: "rgba(13,13,13,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 w-full">
          <button
            onClick={() => canGoPrev && setCurrentStep(currentStep - 1)}
            disabled={!canGoPrev}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canGoPrev ? "text-[#888] border border-white/10 hover:text-white hover:border-white/20" : "text-[#333] cursor-not-allowed"
            }`}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex-1" />

          {!isLastStep ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", boxShadow: "0 4px 20px rgba(99,102,241,0.2)" }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={submitAssessment}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", boxShadow: "0 4px 20px rgba(34,197,94,0.2)" }}
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
              ) : (
                <>Submit Assessment <ArrowRight size={14} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
