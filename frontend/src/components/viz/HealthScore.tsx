"use client";

import { motion } from "framer-motion";

interface HealthScoreProps {
  score: number; // 0-100
  condition: string;
  riskTier: string;
}

export default function HealthScore({ score, condition, riskTier }: HealthScoreProps) {
  // Invert: high risk = low score
  const healthScore = Math.round(100 - score);
  
  const getScoreColor = (s: number) => {
    if (s >= 70) return { main: "#22C55E", bg: "rgba(34,197,94,0.08)", label: "Good" };
    if (s >= 40) return { main: "#F59E0B", bg: "rgba(245,158,11,0.08)", label: "Fair" };
    return { main: "#EF4444", bg: "rgba(239,68,68,0.08)", label: "At Risk" };
  };

  const colors = getScoreColor(healthScore);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (circumference * healthScore) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-2xl p-5 text-center"
      style={{ background: colors.bg, border: `1px solid ${colors.main}20` }}
    >
      <p className="text-xs text-[#888] uppercase tracking-widest mb-3">
        AetherDx Health Score™
      </p>

      {/* Animated Score Circle */}
      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Score ring */}
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={colors.main}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
          />
          {/* Glow ring */}
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={colors.main}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            style={{ filter: `blur(4px)`, opacity: 0.5 }}
          />
        </svg>

        {/* Score Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color: colors.main }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {healthScore}
          </motion.span>
          <span className="text-[10px] text-[#666] uppercase tracking-wider">/ 100</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2"
          style={{ background: `${colors.main}20`, color: colors.main }}
        >
          {colors.label}
        </span>
        <p className="text-[11px] text-[#666] mt-1">
          Based on {condition} risk analysis
        </p>
      </motion.div>
    </motion.div>
  );
}
