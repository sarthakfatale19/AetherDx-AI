"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ArrowRight, Shield, Sparkles } from "lucide-react";
import type { AssessmentResult } from "@/hooks/useAssessment";
import ConfidenceBars from "../viz/ConfidenceBars";
import DigitalTwin from "../viz/DigitalTwin";
import HealthAutopilot from "../viz/HealthAutopilot";
import RiskTrendGraph from "../viz/RiskTrendGraph";
import ReportExportActions from "../viz/ReportExportActions";

interface AssessmentResultProps {
  result: AssessmentResult;
  onReset: () => void;
}

export default function AssessmentResultView({ result, onReset }: AssessmentResultProps) {
  const score = result.form_score;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (circumference * score.score) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
          style={{ background: `${score.color}15`, border: `1px solid ${score.color}30` }}
        >
          {score.tier === "LOW" ? <CheckCircle size={24} color={score.color} /> : <AlertTriangle size={24} color={score.color} />}
        </motion.div>
        <h2 className="text-xl font-bold text-white">Assessment Complete</h2>
        <p className="text-xs text-[#666] mt-1">AetherDx AI Engine v1.0 — Full Analysis</p>
      </div>

      {/* Score Circle + Primary Prediction */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl p-5 text-center"
          style={{ background: `${score.color}08`, border: `1px solid ${score.color}20` }}
        >
          <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Risk Score</p>
          <div className="relative w-28 h-28 mx-auto mb-2">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
              <motion.circle cx="60" cy="60" r="54" fill="none"
                stroke={score.color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: score.color }}>
                {Math.round(score.score)}
              </span>
              <span className="text-[9px] text-[#555]">/ 100</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: `${score.color}15`, color: score.color }}>
            {score.label}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Primary Finding</p>
          <p className="text-lg font-bold text-white mb-1">{result.primary_prediction}</p>
          <p className="text-2xl font-bold" style={{ color: score.color }}>
            {result.primary_probability}%
          </p>
          <p className="text-[10px] text-[#555] mt-2">
            Model Agreement: {result.model_agreement}
          </p>
          <p className="text-[10px] text-[#555]">
            Risk Tier: {result.primary_risk_tier}
          </p>
        </motion.div>
      </div>

      {/* PDF Export & Sharing */}
      <ReportExportActions 
        score={score.score} 
        tier={score.tier} 
        primaryFinding={result.primary_prediction}
        predictions={result.predictions}
        contributingFactors={result.contributing_factors}
        formReasoning={result.form_reasoning}
        recommendations={result.personalized_recommendations}
        adaptiveScore={result.adaptive_score}
      />

      {/* Daily Autopilot */}
      <HealthAutopilot recommendations={result.personalized_recommendations || []} score={score.score} />

      {/* Condition Analysis */}
      {result.predictions && result.predictions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
            Condition Analysis
          </h3>
          <ConfidenceBars predictions={result.predictions} />
        </motion.div>
      )}

      {/* Compound Risks */}
      {result.compound_risks && result.compound_risks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Compound Risk Patterns
          </h3>
          <div className="space-y-2">
            {result.compound_risks.map((risk: any, i: number) => (
              <div key={i} className="rounded-xl p-3"
                style={{
                  background: risk.severity === "high" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                  border: `1px solid ${risk.severity === "high" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                }}>
                <p className="text-xs font-semibold" style={{ color: risk.severity === "high" ? "#EF4444" : "#F59E0B" }}>
                  {risk.risk}
                </p>
                <p className="text-[11px] text-[#888] mt-1">{risk.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* XAI Reasoning */}
      {result.form_reasoning && result.form_reasoning.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-[#818CF8]" />
            Why This Score?
          </h3>
          <div className="space-y-1.5">
            {result.form_reasoning.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                <span className="text-xs text-[#C0C0C0] flex-1">{r.factor}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: `${r.color}15`, color: r.color }}>
                  {r.impact}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Plan */}
      {result.action_plan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            Personalized Action Plan
          </h3>
          <p className="text-xs font-semibold mb-3" style={{ color: score.color }}>
            {result.action_plan.urgency_label}
          </p>
          <div className="space-y-2">
            {result.action_plan.actions.map((action: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="rounded-xl p-3.5 border border-white/5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{action.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{action.action}</p>
                    <p className="text-[11px] text-[#888] mt-1 leading-relaxed">{action.detail}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded text-[#666] border border-white/5">
                    {action.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Risk Trend */}
      {result.risk_trend && result.risk_trend.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            30-Day Risk Projection
          </h3>
          <DigitalTwin data={result.risk_trend} condition={result.primary_prediction} />
        </motion.div>
      )}

      {/* Past Trend */}
      <RiskTrendGraph />

      {/* ABHA + System Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <Shield size={10} className="text-green-400" />
          <span className="text-[9px] font-semibold text-green-400">ABHA Compatible</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <Sparkles size={10} className="text-[#818CF8]" />
          <span className="text-[9px] font-semibold text-[#818CF8]">Explainable AI</span>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onReset}
          className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-[#888] border border-white/10 hover:border-white/20 hover:text-white transition-all">
          New Assessment
        </button>
        <Link href="/" className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-center text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}>
          Chat with AI <ArrowRight size={14} />
        </Link>
      </div>

      <p className="text-center text-[10px] text-[#333] mt-2">
        This is an AI-powered risk assessment, not a medical diagnosis. Always consult a healthcare professional.
      </p>
    </motion.div>
  );
}
