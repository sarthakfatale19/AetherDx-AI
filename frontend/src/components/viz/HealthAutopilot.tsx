"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Sparkles, Stethoscope, Apple, Dumbbell, Moon, Droplets, Heart, AlertTriangle } from "lucide-react";

interface Recommendation {
  action: string;
  priority: string;
  category: string;
  detail?: string;
}

interface HealthAutopilotProps {
  recommendations: Recommendation[];
  score?: number;
}

const CATEGORY_CONFIG: Record<string, { emoji: React.ReactNode; color: string }> = {
  monitoring: { emoji: <Stethoscope size={14} />, color: "#818CF8" },
  diet: { emoji: <Apple size={14} />, color: "#22C55E" },
  exercise: { emoji: <Dumbbell size={14} />, color: "#F59E0B" },
  sleep: { emoji: <Moon size={14} />, color: "#A78BFA" },
  wellness: { emoji: <Heart size={14} />, color: "#EC4899" },
  hydration: { emoji: <Droplets size={14} />, color: "#06B6D4" },
  medical: { emoji: <AlertTriangle size={14} />, color: "#EF4444" },
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function HealthAutopilot({ recommendations, score }: HealthAutopilotProps) {
  // Sort by priority and generate task list from recommendations
  const safeRecs = Array.isArray(recommendations) ? recommendations : [];
  const sortedRecs = useMemo(() => {
    return [...safeRecs].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
    );
  }, [safeRecs]);

  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const toggleTask = (index: number) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      // Check if all completed
      if (next.size === sortedRecs.length && sortedRecs.length > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

      return next;
    });
  };

  const progress = sortedRecs.length > 0
    ? Math.round((completedIds.size / sortedRecs.length) * 100)
    : 0;

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500/15 text-red-400 border-red-500/25",
      high: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      low: "bg-green-500/10 text-green-400 border-green-500/20",
    };
    return colors[priority] || colors.medium;
  };

  if (safeRecs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5 mb-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-[#818CF8]" />
          Health Autopilot — Action Plan
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-md border transition-all"
            style={{
              background: progress === 100 ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.1)",
              color: progress === 100 ? "#22C55E" : "#818CF8",
              borderColor: progress === 100 ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.2)",
            }}
          >
            {progress}% Done
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 bg-black/20 rounded-full h-1.5 overflow-hidden border border-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: progress === 100
              ? "linear-gradient(90deg, #22C55E, #4ADE80)"
              : "linear-gradient(90deg, #6366F1, #818CF8)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {sortedRecs.map((rec, i) => {
          const isDone = completedIds.has(i);
          const catConfig = CATEGORY_CONFIG[rec.category] || CATEGORY_CONFIG.wellness;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => toggleTask(i)}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                isDone
                  ? "bg-[#22C55E]/5 border-[#22C55E]/15"
                  : "bg-[#1A1A1A]/80 border-white/5 hover:border-white/10 hover:bg-[#1A1A1A]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full border mt-0.5 transition-all flex-shrink-0 ${
                  isDone ? "border-[#22C55E] bg-[#22C55E]" : "border-[#555]"
                }`}
              >
                {isDone && <CheckCircle2 size={12} className="text-black" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ color: catConfig.color }}>{catConfig.emoji}</span>
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isDone ? "text-[#22C55E] line-through opacity-60" : "text-[#E0E0E0]"
                    }`}
                  >
                    {rec.action}
                  </p>
                </div>
                {rec.detail && (
                  <p className={`text-[11px] mt-1 ml-6 leading-relaxed ${isDone ? "text-[#555]" : "text-[#888]"}`}>
                    {rec.detail}
                  </p>
                )}
              </div>

              {/* Priority badge */}
              <span
                className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${getPriorityBadge(rec.priority)}`}
              >
                {rec.priority}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center mt-4 p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20"
          >
            <p className="text-sm font-semibold text-[#22C55E]">
              🎉 Amazing! You&apos;ve completed all health actions!
            </p>
            <p className="text-[10px] text-[#22C55E]/70 mt-1">
              Consistent follow-through significantly reduces health risks.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="text-[10px] text-[#444] mt-3 text-center italic">
        Tasks are personalized based on your risk profile and lifestyle analysis.
      </p>
    </motion.div>
  );
}
