"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Zap } from "lucide-react";

interface AdaptiveScoreData {
  score: number;
  health_score: number;
  tier: string;
  label: string;
  color: string;
  base_score: number;
  lifestyle_modifier: number;
  drift_modifier: number;
  drift_detected: boolean;
  drift_direction: string;
  interaction_count: number;
  lifestyle: Record<string, number>;
}

interface AdaptiveScoreProps {
  data: AdaptiveScoreData;
}

export default function AdaptiveScore({ data }: AdaptiveScoreProps) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (circumference * data.health_score) / 100;

  const DriftIcon = data.drift_direction === "worsening"
    ? TrendingUp
    : data.drift_direction === "improving"
    ? TrendingDown
    : Minus;

  const driftColor = data.drift_direction === "worsening"
    ? "#EF4444"
    : data.drift_direction === "improving"
    ? "#22C55E"
    : "#666";

  const lifestyleItems = [
    { key: "sleep_quality", label: "Sleep", emoji: "😴" },
    { key: "stress_level", label: "Stress", emoji: "😰", invert: true },
    { key: "activity_level", label: "Activity", emoji: "🏃" },
    { key: "diet_quality", label: "Diet", emoji: "🥗" },
    { key: "hydration", label: "Hydration", emoji: "💧" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: `${data.color}08`, border: `1px solid ${data.color}20` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${data.color}15` }}>
        <div className="flex items-center gap-2">
          <Zap size={14} color={data.color} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
            Adaptive Health Score™
          </span>
        </div>
        {data.drift_detected && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: `${driftColor}15`, color: driftColor }}
          >
            <DriftIcon size={10} />
            {data.drift_direction === "worsening" ? "Risk Increasing" : "Improving"}
          </motion.div>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Score Circle */}
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-28 mb-2">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
              <motion.circle
                cx="60" cy="60" r="54" fill="none"
                stroke={data.color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
              />
              <motion.circle
                cx="60" cy="60" r="54" fill="none"
                stroke={data.color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                style={{ filter: "blur(3px)", opacity: 0.4 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-2xl font-bold"
                style={{ color: data.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {Math.round(data.health_score)}
              </motion.span>
              <span className="text-[9px] text-[#555]">/ 100</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${data.color}15`, color: data.color }}>
            {data.health_score >= 70 ? "Good" : data.health_score >= 40 ? "Fair" : "At Risk"}
          </span>
        </div>

        {/* Score Breakdown */}
        <div className="flex flex-col justify-center space-y-2">
          <ScoreBreakdownItem label="Base Risk" value={data.base_score} color="#818CF8" />
          <ScoreBreakdownItem label="Lifestyle" value={data.lifestyle_modifier} color="#F59E0B" showSign />
          {data.drift_modifier !== 0 && (
            <ScoreBreakdownItem label="Drift" value={data.drift_modifier} color={driftColor} showSign />
          )}
          <div className="border-t border-white/5 pt-1.5 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#888] font-semibold">Final Score</span>
              <span className="text-xs font-bold" style={{ color: data.color }}>
                {data.score.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifestyle Indicators */}
      <div className="px-4 pb-3 pt-1" style={{ borderTop: `1px solid ${data.color}10` }}>
        <p className="text-[9px] text-[#555] uppercase tracking-widest mb-2">Lifestyle Factors</p>
        <div className="flex gap-2">
          {lifestyleItems.map((item) => {
            const val = item.invert ? 1 - (data.lifestyle[item.key] || 0.5) : (data.lifestyle[item.key] || 0.5);
            const barColor = val >= 0.6 ? "#22C55E" : val >= 0.4 ? "#F59E0B" : "#EF4444";
            return (
              <div key={item.key} className="flex-1 text-center">
                <span className="text-[10px]">{item.emoji}</span>
                <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${val * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <span className="text-[8px] text-[#555] mt-0.5 block">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interaction count */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-[9px] text-[#444]">
          Session: {data.interaction_count} interaction{data.interaction_count !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1">
          <Shield size={9} className="text-[#444]" />
          <span className="text-[9px] text-[#444]">ABHA Ready</span>
        </div>
      </div>
    </motion.div>
  );
}

function ScoreBreakdownItem({ label, value, color, showSign = false }: {
  label: string; value: number; color: string; showSign?: boolean;
}) {
  const display = showSign ? (value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1)) : value.toFixed(1);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#666]">{label}</span>
      <span className="text-[11px] font-semibold" style={{ color }}>{display}</span>
    </div>
  );
}
