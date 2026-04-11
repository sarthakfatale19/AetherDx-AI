"use client";

import { motion } from "framer-motion";
import type { LifestyleData } from "@/hooks/useAssessment";

interface FormLifestyleProps {
  lifestyle: LifestyleData;
  onUpdate: (field: keyof LifestyleData, value: number | null) => void;
}

const LIFESTYLE_ITEMS = [
  { key: "sleep_hours" as const, label: "Sleep", emoji: "😴", unit: "hrs/night", min: 0, max: 14, step: 0.5, good: 7, subtitle: "Recommended: 7-9 hours" },
  { key: "stress_level" as const, label: "Stress Level", emoji: "😰", unit: "/10", min: 0, max: 10, step: 1, good: 3, invert: true, subtitle: "0 = Calm, 10 = Extreme" },
  { key: "exercise_mins_week" as const, label: "Exercise", emoji: "🏃", unit: "min/week", min: 0, max: 500, step: 15, good: 150, subtitle: "Recommended: 150+ min" },
  { key: "diet_score" as const, label: "Diet Quality", emoji: "🥗", unit: "/10", min: 0, max: 10, step: 1, good: 7, subtitle: "0 = Poor, 10 = Excellent" },
  { key: "water_glasses" as const, label: "Water Intake", emoji: "💧", unit: "glasses/day", min: 0, max: 15, step: 1, good: 8, subtitle: "Recommended: 8+ glasses" },
];

function getBarColor(value: number | null, good: number, invert = false): string {
  if (value === null) return "#333";
  if (invert) {
    if (value <= good) return "#22C55E";
    if (value <= good * 2) return "#F59E0B";
    return "#EF4444";
  }
  if (value >= good) return "#22C55E";
  if (value >= good * 0.5) return "#F59E0B";
  return "#EF4444";
}

export default function FormLifestyle({ lifestyle, onUpdate }: FormLifestyleProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          Lifestyle Factors
        </h3>
        <p className="text-[11px] text-[#555] mb-4">These factors are integrated into your risk model</p>
      </div>

      {LIFESTYLE_ITEMS.map((item, i) => {
        const value = lifestyle[item.key];
        const color = getBarColor(value, item.good, item.invert);
        const pct = value !== null
          ? Math.min(100, (value / item.max) * 100)
          : 0;

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl p-4 border border-white/5"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-[#C0C0C0]">{item.label}</p>
                  <p className="text-[9px] text-[#444]">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold" style={{ color: value !== null ? color : "#333" }}>
                  {value !== null ? value : "—"}
                </span>
                <span className="text-[10px] text-[#555]">{item.unit}</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={item.min} max={item.max} step={item.step}
              value={value ?? item.min}
              onChange={e => onUpdate(item.key, parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
              }}
            />

            {/* Progress bar beneath */}
            <div className="h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
