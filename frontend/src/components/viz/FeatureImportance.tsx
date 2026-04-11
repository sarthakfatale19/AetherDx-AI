"use client";

import { motion } from "framer-motion";

interface Factor {
  symptom: string;
  percentage: number;
  contribution: number;
}

interface FeatureImportanceProps {
  factors: Factor[];
}

const barColors = [
  "#6366F1",
  "#818CF8",
  "#A78BFA",
  "#C4B5FD",
  "#DDD6FE",
];

export default function FeatureImportance({ factors }: FeatureImportanceProps) {
  return (
    <div className="space-y-2.5">
      {factors.map((factor, i) => (
        <motion.div
          key={factor.symptom}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.4 }}
          className="group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#C0C0C0] group-hover:text-white transition-colors">
              {factor.symptom}
            </span>
            <motion.span
              className="text-xs font-semibold"
              style={{ color: barColors[i] || barColors[4] }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.12 }}
            >
              {factor.percentage}%
            </motion.span>
          </div>

          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${barColors[i] || barColors[4]}80, ${barColors[i] || barColors[4]})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${factor.percentage}%` }}
              transition={{
                duration: 1,
                delay: 0.3 + i * 0.12,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
