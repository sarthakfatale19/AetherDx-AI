"use client";

import { motion } from "framer-motion";

interface Prediction {
  condition: string;
  probability: number;
  risk_tier: string;
  risk_color: string;
}

interface ConfidenceBarsProps {
  predictions: Prediction[];
}

const colorMap: Record<string, string> = {
  red: "#EF4444",
  amber: "#F59E0B",
  green: "#22C55E",
};

export default function ConfidenceBars({ predictions }: ConfidenceBarsProps) {
  return (
    <div className="space-y-3">
      {predictions.map((pred, i) => {
        const color = colorMap[pred.risk_color] || "#6366F1";
        return (
          <motion.div
            key={pred.condition}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#E0E0E0]">
                {pred.condition}
              </span>
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-xs font-bold"
                  style={{ color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                >
                  {pred.probability}%
                </motion.span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                  style={{
                    background: `${color}15`,
                    color,
                  }}
                >
                  {pred.risk_tier}
                </span>
              </div>
            </div>

            <div className="progress-bar-track">
              <motion.div
                className="progress-bar-fill"
                style={{
                  background: `linear-gradient(90deg, ${color}90, ${color})`,
                  boxShadow: `0 0 8px ${color}40`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pred.probability, 2)}%` }}
                transition={{
                  duration: 1.2,
                  delay: 0.3 + i * 0.15,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
