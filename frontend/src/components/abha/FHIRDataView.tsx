"use client";

import { motion } from "framer-motion";
import {
  FlaskConical, HeartPulse, Pill, AlertTriangle,
  ArrowDown, ArrowUp, Minus, FileText, LinkIcon
} from "lucide-react";
import type { FHIRSummary } from "@/hooks/useABHA";

interface FHIRDataViewProps {
  parsedData: any;
  summary: FHIRSummary;
  mlFeatures: Record<string, number>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; icon: any }> = {
    HIGH: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: ArrowUp },
    LOW: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", icon: ArrowDown },
    NORMAL: { bg: "bg-green-500/10 border-green-500/20", text: "text-green-400", icon: Minus },
  };
  const c = cfg[status] || cfg.NORMAL;
  const Icon = c.icon;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${c.bg} ${c.text} flex items-center gap-0.5`}>
      <Icon size={10} />
      {status}
    </span>
  );
}

export default function FHIRDataView({ parsedData, summary, mlFeatures }: FHIRDataViewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto space-y-4">
      {/* Alerts */}
      {summary.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-bold text-red-400">Clinical Alerts</h3>
          </div>
          <div className="space-y-1">
            {summary.alerts.map((alert, i) => (
              <p key={i} className="text-xs text-red-300/80">• {alert}</p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lab Highlights */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical size={16} className="text-[#6366F1]" />
          <h3 className="text-sm font-semibold text-white">Lab Results</h3>
          <span className="text-[10px] text-[#666] ml-auto">{summary.total_observations} records</span>
        </div>
        <div className="space-y-2">
          {summary.lab_highlights.map((lab, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between py-2 px-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div>
                <p className="text-xs text-white font-medium">{lab.name}</p>
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                  {lab.value} <span className="text-[10px] font-normal text-[#666]">{lab.unit}</span>
                </p>
              </div>
              <StatusBadge status={lab.status} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Diagnostic Reports */}
      {summary.diagnostic_conclusions?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[#818CF8]" />
            <h3 className="text-sm font-semibold text-white">Diagnostic Reports</h3>
            <span className="text-[10px] text-[#666] ml-auto">{summary.total_reports} reports</span>
          </div>
          <div className="space-y-2">
            {summary.diagnostic_conclusions.map((report, i) => (
              <div key={i} className="py-2 px-3 rounded-xl bg-white/[0.02]">
                <p className="text-xs font-medium text-[#818CF8] mb-1">{report.report}</p>
                <p className="text-[11px] text-[#999] leading-relaxed">{report.conclusion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditions */}
      {parsedData.conditions?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse size={16} className="text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-white">Medical Conditions</h3>
          </div>
          <div className="space-y-2">
            {parsedData.conditions.map((cond: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02]">
                <div>
                  <p className="text-xs text-white font-medium">{cond.display}</p>
                  {cond.onset && <p className="text-[10px] text-[#666]">Since {cond.onset}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  cond.status === "active"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-white/5 border-white/10 text-[#888]"
                }`}>
                  {cond.status || "recorded"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications */}
      {parsedData.medications?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Pill size={16} className="text-green-400" />
            <h3 className="text-sm font-semibold text-white">Active Medications</h3>
          </div>
          <div className="space-y-2">
            {parsedData.medications.map((med: any, i: number) => (
              <div key={i} className="py-2 px-3 rounded-xl bg-white/[0.02]">
                <p className="text-xs text-white font-medium">{med.name}</p>
                <p className="text-[10px] text-[#888]">{med.dosage}</p>
                {med.linked_condition && (
                  <span className="text-[9px] text-[#666] mt-1 inline-flex items-center gap-1">
                    <LinkIcon size={8} /> {med.linked_condition}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medication Interactions */}
      {parsedData.medication_interactions?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <p className="text-xs font-semibold text-amber-400">Medication Interactions Detected</p>
          </div>
          {parsedData.medication_interactions.map((intx: any, i: number) => (
            <p key={i} className="text-[10px] text-amber-300/80">
              • {intx.medications.join(" + ")} → {intx.flag.replace(/_/g, " ")} ({intx.severity})
            </p>
          ))}
        </div>
      )}

      {/* Risk Flags */}
      {summary.risk_flags.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">
            Detected Risk Factors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.risk_flags.map((flag, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-red-500/8 text-red-300 border border-red-500/15">
                {flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ML Features Preview */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
        <p className="text-[10px] font-semibold text-[#818CF8] uppercase tracking-wider mb-2">
          AI Feature Extraction
        </p>
        <p className="text-[10px] text-[#888] mb-3">
          These normalized scores (0-1) are fed into the ML prediction engine.
        </p>
        <div className="space-y-1.5">
          {Object.entries(mlFeatures)
            .filter(([_, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-[#888] w-40 truncate">{key.replace(/_/g, " ")}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(val * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8]"
                  />
                </div>
                <span className="text-[10px] text-[#999] w-10 text-right">{(val * 100).toFixed(0)}%</span>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
