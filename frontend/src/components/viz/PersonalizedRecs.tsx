"use client";

import { motion } from "framer-motion";
import { Sparkles, CheckCircle, ArrowRight } from "lucide-react";

interface Recommendation {
  action: string;
  priority: string;
  category: string;
  detail: string;
}

interface PersonalizedRecsProps {
  recommendations: Recommendation[];
}

const priorityStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  urgent: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", text: "#EF4444", badge: "bg-[#EF4444]/15 text-[#EF4444]" },
  high: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", text: "#F59E0B", badge: "bg-[#F59E0B]/15 text-[#F59E0B]" },
  medium: { bg: "rgba(99,102,241,0.04)", border: "rgba(99,102,241,0.15)", text: "#818CF8", badge: "bg-[#6366F1]/15 text-[#818CF8]" },
  low: { bg: "rgba(34,197,94,0.04)", border: "rgba(34,197,94,0.15)", text: "#22C55E", badge: "bg-[#22C55E]/15 text-[#22C55E]" },
};

const categoryIcons: Record<string, string> = {
  monitoring: "📊",
  diet: "🥗",
  exercise: "🏃",
  wellness: "🧘",
  sleep: "😴",
  medical: "🏥",
};

export default function PersonalizedRecs({ recommendations }: PersonalizedRecsProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
        Personalized Action Plan
        <span className="text-[10px] text-[#555] font-normal ml-auto flex items-center gap-1">
          <Sparkles size={10} />
          AI-Generated
        </span>
      </h3>

      <div className="space-y-2">
        {recommendations.map((rec, i) => {
          const style = priorityStyles[rec.priority] || priorityStyles.medium;
          const icon = categoryIcons[rec.category] || "💡";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 + i * 0.1 }}
              className="rounded-xl p-3 group cursor-default"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-sm mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#E0E0E0]">
                      {rec.action}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${style.badge}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#888] leading-relaxed">
                    {rec.detail}
                  </p>
                </div>
                <ArrowRight size={12} className="text-[#444] group-hover:text-[#888] transition-colors mt-1 flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
