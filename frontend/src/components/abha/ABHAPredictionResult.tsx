"use client";

import { motion } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, Database, Sparkles,
  Shield, Activity, AlertTriangle, CheckCircle2, RefreshCw,
  Download, Heart, Minus, Zap
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import type { ABHAPrediction } from "@/hooks/useABHA";
import { generateABHAReport } from "./ABHAReportPDF";
import dynamic from "next/dynamic";

const AnatomicalModel3D = dynamic(() => import("@/components/viz/AnatomicalModel3D"), { ssr: false });

interface ABHAPredictionResultProps {
  prediction: ABHAPrediction;
  onSync?: () => void;
  syncing?: boolean;
}

function RiskGauge({ score, tier }: { score: number; tier: string }) {
  const color = tier === "HIGH" ? "#EF4444" : tier === "MODERATE" ? "#F59E0B" : "#22C55E";
  const glowColor = tier === "HIGH" ? "rgba(239,68,68,0.3)" : tier === "MODERATE" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id={`gauge-grad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle cx="65" cy="65" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          <motion.circle
            cx="65" cy="65" r="45" fill="none"
            stroke={`url(#gauge-grad-${tier})`}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            transform="rotate(-90 65 65)"
            filter="url(#glow)"
          />
          <text x="65" y="60" textAnchor="middle" className="text-3xl font-bold" fill="white" fontFamily="var(--font-outfit)">
            {Math.round(score)}
          </text>
          <text x="65" y="78" textAnchor="middle" className="text-[10px]" fill="#666">/ 100</text>
        </svg>
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 40px ${glowColor}`, opacity: 0.3 }} />
      </div>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-xs font-semibold mt-2 px-4 py-1.5 rounded-full"
        style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
      >
        {tier} Risk
      </motion.span>
    </div>
  );
}

function SHAPChart({ waterfall }: { waterfall: any[] }) {
  if (!waterfall?.length) return null;

  const data = waterfall.map((w: any) => ({
    name: w.feature?.length > 14 ? w.feature.slice(0, 14) + "…" : w.feature,
    value: w.value,
    direction: w.direction,
  }));

  return (
    <ResponsiveContainer width="100%" height={waterfall.length * 32 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#fff" }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((entry: any, i: number) => (
            <Cell key={i} fill={entry.direction === "increases_risk" ? "rgba(239,68,68,0.7)" : "rgba(34,197,94,0.7)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RiskTrendChart({ projections }: { projections: any[] }) {
  if (!projections?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={projections} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
        <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip
          contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: "#fff" }}
          formatter={(val: any) => [`${val}%`, "Risk"]}
        />
        <Line
          type="monotone" dataKey="risk_percentage"
          stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: "#6366F1" }}
          activeDot={{ r: 5, fill: "#818CF8" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function ABHAPredictionResult({ prediction, onSync, syncing }: ABHAPredictionResultProps) {
  const {
    prediction: pred, shap_explanation, lime_explanation,
    fhir_summary, data_source, risk_flags,
    trend_analysis, risk_projection, recommendations,
    risk_summary, model_info
  } = prediction;

  const topPred = pred?.predictions?.[0];
  const score = topPred?.probability || 0;
  const tier = topPred?.risk_tier || "LOW";

  const handleDownloadPDF = () => {
    generateABHAReport(prediction);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center mb-3"
          style={{ boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}
        >
          <Brain size={24} className="text-white" />
        </motion.div>
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
          ABHA-Enhanced AI Prediction
        </h2>
        <p className="text-xs text-[#888] mt-1">
          Powered by {data_source.abha_records} ABHA records · {model_info?.primary_model || "ML"} Engine
        </p>
      </div>

      {/* Visual Diagnostic Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: 3D Body Representation */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
        >
           <AnatomicalModel3D 
             riskTier={tier as "HIGH" | "MODERATE" | "LOW"} 
             condition={topPred?.condition || "Healthy"}
             probability={score}
             contributingFactors={shap_explanation?.waterfall?.map((w: any) => w.feature) || []}
           />
        </motion.div>

        {/* Right: Risk Telemetry */}
        <div className="space-y-4 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6 text-center border border-white/10 h-full flex flex-col justify-center items-center"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <p className="text-[10px] text-[#888] uppercase tracking-wider mb-4">Aggregated Risk Score</p>
              <RiskGauge score={score} tier={tier} />
              
              <div className="mt-6 pt-6 border-t border-white/5 w-full">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Primary Finding</p>
                  <p className="text-xl font-bold text-white tracking-wide">{topPred?.condition || "Healthy"}</p>
                  <p className="text-[10px] text-[#666] mt-2">
                    <Zap size={10} className="inline mr-1" />
                    Agreement: {pred?.model_agreement}
                  </p>
                  
                  {pred?.predictions?.length > 1 && (
                    <div className="mt-4 space-y-1.5 pt-4 border-t border-white/5 w-full">
                      {pred.predictions.slice(1, 3).map((p: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-[#888]">{p.condition}</span>
                          <span style={{ color: p.risk_color === "red" ? "#EF4444" : p.risk_color === "amber" ? "#F59E0B" : "#666" }}>
                            {p.probability}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </motion.div>
        </div>
      </div>

      {/* SHAP Waterfall */}
      {shap_explanation?.waterfall?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#818CF8]" />
            <h3 className="text-sm font-semibold text-white">Why This Score?</h3>
            <span className="text-[9px] text-[#666] ml-auto px-2 py-0.5 rounded bg-white/5">
              {shap_explanation.method?.split(" ")[0]}
            </span>
          </div>
          <SHAPChart waterfall={shap_explanation.waterfall} />
          <p className="text-[9px] text-[#555] mt-2">
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: "rgba(239,68,68,0.7)" }} />Increases risk
            <span className="inline-block w-2 h-2 rounded-sm ml-3 mr-1" style={{ background: "rgba(34,197,94,0.7)" }} />Decreases risk
          </p>
        </motion.div>
      )}

      {/* Risk Trend Projection */}
      {risk_projection?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-[#818CF8]" />
            <h3 className="text-sm font-semibold text-white">30-Day Risk Projection</h3>
            {trend_analysis && (
              <span className={`text-[9px] ml-auto px-2 py-0.5 rounded flex items-center gap-1 ${
                trend_analysis.overall_direction === "worsening"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : trend_analysis.overall_direction === "improving"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-white/5 text-[#888] border border-white/10"
              }`}>
                {trend_analysis.overall_direction === "worsening" ? <TrendingUp size={10} /> :
                 trend_analysis.overall_direction === "improving" ? <TrendingDown size={10} /> :
                 <Minus size={10} />}
                {trend_analysis.overall_direction}
              </span>
            )}
          </div>
          <RiskTrendChart projections={risk_projection} />
        </motion.div>
      )}

      {/* Lab Trend Indicators */}
      {trend_analysis && Object.keys(trend_analysis.trends).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-3">Clinical Trends</p>
          <div className="space-y-2">
            {Object.entries(trend_analysis.trends).map(([key, trend]: [string, any], i: number) => {
              const dirColor =
                trend.direction === "worsening" ? "#EF4444"
                : trend.direction === "improving" ? "#22C55E"
                : "#888";
              return (
                <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[10px] text-[#888] w-28 truncate">{key.replace(/_/g, " ")}</span>
                  <span className="text-xs font-bold text-white">{trend.current_value}</span>
                  <span className="text-[10px] text-[#666]">{trend.unit}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: dirColor }}>
                      {trend.pct_change > 0 ? "+" : ""}{trend.pct_change}%
                    </span>
                    {trend.direction === "worsening" ? <TrendingUp size={10} style={{ color: dirColor }} /> :
                     trend.direction === "improving" ? <TrendingDown size={10} style={{ color: dirColor }} /> :
                     <Minus size={10} style={{ color: dirColor }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-green-400" />
            <h3 className="text-sm font-semibold text-white">Preventive Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="rounded-xl p-3"
                style={{
                  background: rec.urgency === "critical" ? "rgba(239,68,68,0.06)"
                    : rec.urgency === "high" ? "rgba(245,158,11,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${
                    rec.urgency === "critical" ? "rgba(239,68,68,0.15)"
                    : rec.urgency === "high" ? "rgba(245,158,11,0.15)"
                    : "rgba(255,255,255,0.06)"
                  }`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{rec.icon}</span>
                  <span className="text-xs font-semibold text-white">{rec.title}</span>
                  <span className={`text-[9px] ml-auto px-1.5 py-0.5 rounded ${
                    rec.urgency === "critical" ? "bg-red-500/10 text-red-400"
                    : rec.urgency === "high" ? "bg-amber-500/10 text-amber-400"
                    : "bg-white/5 text-[#888]"
                  }`}>
                    {rec.urgency}
                  </span>
                </div>
                <p className="text-[10px] text-[#888] mb-2">{rec.description}</p>
                <ul className="space-y-0.5">
                  {rec.actions.map((action: string, j: number) => (
                    <li key={j} className="text-[10px] text-[#999] flex items-start gap-1.5">
                      <CheckCircle2 size={10} className="text-green-500/50 mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Data Source Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Database size={14} className="text-[#888]" />
          <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">Data Sources</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Lab Records", value: data_source.abha_records, color: "#6366F1" },
            { label: "Conditions", value: data_source.conditions, color: "#F59E0B" },
            { label: "Medications", value: data_source.medications, color: "#22C55E" },
            { label: "Reports", value: data_source.diagnostic_reports || 0, color: "#EF4444" },
          ].map((d) => (
            <div key={d.label} className="text-center py-2 rounded-lg bg-white/[0.02]">
              <p className="text-lg font-bold" style={{ color: d.color }}>{d.value}</p>
              <p className="text-[9px] text-[#666]">{d.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Clinical Alerts */}
      {fhir_summary?.alerts?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-400" />
            <p className="text-xs font-semibold text-red-400">Clinical Alerts from ABHA</p>
          </div>
          {fhir_summary.alerts.map((a, i) => (
            <p key={i} className="text-xs text-red-300/80 mb-0.5">• {a}</p>
          ))}
        </div>
      )}

      {/* Risk Flags */}
      {risk_flags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {risk_flags.map((flag, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded border bg-amber-500/5 border-amber-500/15 text-amber-400">
              {flag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-center pt-2">
        <button
          onClick={handleDownloadPDF}
          className="px-5 py-2.5 rounded-xl text-xs font-medium text-white
                     bg-gradient-to-r from-[#6366F1] to-[#818CF8]
                     hover:from-[#5558E8] hover:to-[#727AE8]
                     flex items-center gap-2 transition-all"
          id="download-pdf-btn"
        >
          <Download size={14} /> Download Report
        </button>
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-[#888]
                       bg-white/[0.03] border border-white/10
                       hover:bg-white/[0.06] hover:text-white
                       disabled:opacity-40 flex items-center gap-2 transition-all"
            id="sync-data-btn"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Data"}
          </button>
        )}
      </div>

      {/* Compliance Badge */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-[#555] pt-2">
        <Shield size={12} />
        ABDM Compliant · AES-256 Encrypted · Consent-Based Access
        {model_info && (
          <span className="ml-1 text-[#444]">· {model_info.primary_model} ({model_info.total_models} models)</span>
        )}
      </div>
    </motion.div>
  );
}
