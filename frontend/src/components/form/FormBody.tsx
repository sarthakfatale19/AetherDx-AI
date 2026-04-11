"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BodyMetricsData } from "@/hooks/useAssessment";

interface FormBodyProps {
  bodyMetrics: BodyMetricsData;
  bmiInfo: { value: number; category: string } | null;
  onBodyChange: (field: keyof BodyMetricsData, value: any) => void;
}

export default function FormBody({ bodyMetrics, bmiInfo, onBodyChange }: FormBodyProps) {
  const bmiColor = bmiInfo
    ? bmiInfo.value >= 30 || bmiInfo.value < 18.5
      ? "#EF4444"
      : bmiInfo.value >= 25
      ? "#F59E0B"
      : "#22C55E"
    : "#555";

  return (
    <div className="space-y-5">
      {/* Height & Weight */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
          Measurements
        </h3>
        <p className="text-[11px] text-[#555] mb-4">Used to calculate BMI and metabolic indicators</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Height</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bodyMetrics.height_cm ?? ""}
                onChange={e => onBodyChange("height_cm", e.target.value === "" ? null : parseFloat(e.target.value))}
                placeholder="—"
                className="w-full bg-black/30 rounded-xl px-3 py-2.5 text-lg font-bold text-white outline-none border border-white/5 focus:border-[#6366F1]/40 text-center transition-all"
              />
              <span className="text-xs text-[#555]">cm</span>
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Weight</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bodyMetrics.weight_kg ?? ""}
                onChange={e => onBodyChange("weight_kg", e.target.value === "" ? null : parseFloat(e.target.value))}
                placeholder="—"
                className="w-full bg-black/30 rounded-xl px-3 py-2.5 text-lg font-bold text-white outline-none border border-white/5 focus:border-[#6366F1]/40 text-center transition-all"
              />
              <span className="text-xs text-[#555]">kg</span>
            </div>
          </div>
        </div>

        {/* BMI Display */}
        <AnimatePresence>
          {bmiInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 rounded-xl p-3 flex items-center justify-between"
              style={{ background: `${bmiColor}10`, border: `1px solid ${bmiColor}20` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888]">BMI:</span>
                <span className="text-lg font-bold" style={{ color: bmiColor }}>{bmiInfo.value}</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${bmiColor}15`, color: bmiColor }}>
                {bmiInfo.category}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Age and Sex */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Demographics
        </h3>
        <p className="text-[11px] text-[#555] mb-4">Helps calibrate risk thresholds accurately</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Age</p>
            <input
              type="number"
              value={bodyMetrics.age ?? ""}
              onChange={e => onBodyChange("age", e.target.value === "" ? null : parseInt(e.target.value))}
              placeholder="—"
              className="w-full bg-black/30 rounded-xl px-3 py-2.5 text-lg font-bold text-white outline-none border border-white/5 focus:border-[#6366F1]/40 text-center transition-all"
            />
          </div>

          <div className="rounded-2xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Sex</p>
            <div className="flex gap-1.5">
              {["male", "female", "other"].map(s => (
                <button
                  key={s}
                  onClick={() => onBodyChange("sex", s)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    bodyMetrics.sex === s
                      ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30"
                      : "bg-black/20 text-[#555] border border-white/5 hover:text-[#888]"
                  }`}
                >
                  {s === "male" ? "♂" : s === "female" ? "♀" : "⚧"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
