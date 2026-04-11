"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface DriftData {
  detected: boolean;
  direction: string;
  interaction_count: number;
  risk_trend: number[];
}

interface DriftIndicatorProps {
  drift: DriftData;
}

export default function DriftIndicator({ drift }: DriftIndicatorProps) {
  if (!drift.detected || drift.interaction_count < 2) return null;

  const isWorsening = drift.direction === "worsening";
  const isImproving = drift.direction === "improving";

  const color = isWorsening ? "#EF4444" : isImproving ? "#22C55E" : "#666";
  const Icon = isWorsening ? TrendingUp : isImproving ? TrendingDown : Minus;
  const message = isWorsening
    ? "Your symptoms appear to be progressing. We recommend consulting a healthcare professional."
    : "Your health indicators are improving. Keep maintaining your current healthy habits.";

  return (
    <motion.div
      initial={{ opacity: 0, y: -5, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl p-3 mb-4"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 p-1.5 rounded-lg" style={{ background: `${color}15` }}>
          {isWorsening ? (
            <AlertTriangle size={14} color={color} />
          ) : (
            <Icon size={14} color={color} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold" style={{ color }}>
              {isWorsening ? "Behavioral Drift Detected" : "Positive Trend Detected"}
            </span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <p className="text-[11px] text-[#888] leading-relaxed">{message}</p>

          {/* Mini trend sparkline */}
          {drift.risk_trend.length >= 2 && (
            <div className="flex items-end gap-0.5 mt-2 h-4">
              {drift.risk_trend.map((val, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ background: color, opacity: 0.3 + (i / drift.risk_trend.length) * 0.7 }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / 100) * 16}px` }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
