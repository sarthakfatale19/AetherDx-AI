"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { RealtimeScore } from "@/hooks/useAssessment";

interface LiveRiskGaugeProps {
  score: RealtimeScore | null;
}

export default function LiveRiskGauge({ score }: LiveRiskGaugeProps) {
  if (!score || !score.inputs_provided) {
    return (
      <div className="rounded-2xl p-5 border border-white/5 text-center"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="w-20 h-20 mx-auto rounded-full border-4 border-white/5 flex items-center justify-center mb-3">
          <span className="text-2xl text-[#333]">—</span>
        </div>
        <p className="text-xs text-[#444]">Fill in health data to see your live risk score</p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (circumference * score.score) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-5 overflow-hidden"
      style={{ background: `${score.color}08`, border: `1px solid ${score.color}25` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap size={14} color={score.color} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
          Live Risk Score
        </span>
      </div>

      {/* Gauge */}
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
            <motion.circle
              cx="48" cy="48" r="42" fill="none"
              stroke={score.color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* Glow */}
            <motion.circle
              cx="48" cy="48" r="42" fill="none"
              stroke={score.color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              style={{ filter: "blur(4px)", opacity: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-bold"
              style={{ color: score.color }}
              key={score.score}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {Math.round(score.score)}
            </motion.span>
            <span className="text-[9px] text-[#555]">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {/* Tier badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${score.color}15`, color: score.color }}>
              {score.label}
            </span>
          </div>

          {/* Top factors */}
          <div className="space-y-1">
            {score.factors.filter(f => f.points > 0).slice(0, 4).map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.color }} />
                <span className="text-[10px] text-[#888] flex-1 truncate">{f.name}</span>
                <span className="text-[10px] font-semibold" style={{ color: f.color }}>
                  +{typeof f.points === 'number' ? f.points.toFixed(0) : f.points}
                </span>
              </motion.div>
            ))}
            {score.factors.filter(f => f.points > 0).length === 0 && (
              <p className="text-[10px] text-[#444]">All indicators normal</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
