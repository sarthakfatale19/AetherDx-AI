"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SymptomEntryData } from "@/hooks/useAssessment";
import { useState } from "react";

interface FormSymptomsProps {
  symptoms: SymptomEntryData[];
  onToggle: (symptom: string) => void;
  onUpdate: (symptom: string, field: string, value: any) => void;
}

const SYMPTOM_CATEGORIES = [
  {
    label: "Head & Neurological",
    color: "#818CF8",
    items: [
      { key: "headache", label: "Headache", emoji: "🤕" },
      { key: "dizziness", label: "Dizziness", emoji: "😵" },
      { key: "blurred_vision", label: "Blurred Vision", emoji: "👁️" },
      { key: "numbness_tingling", label: "Numbness / Tingling", emoji: "🖐️" },
    ],
  },
  {
    label: "Cardiovascular",
    color: "#EF4444",
    items: [
      { key: "chest_pain", label: "Chest Pain", emoji: "💔" },
      { key: "shortness_of_breath", label: "Breathing Difficulty", emoji: "🫁" },
      { key: "swelling", label: "Swelling / Edema", emoji: "🦶" },
    ],
  },
  {
    label: "Metabolic",
    color: "#F59E0B",
    items: [
      { key: "excessive_thirst", label: "Excessive Thirst", emoji: "🥤" },
      { key: "frequent_urination", label: "Frequent Urination", emoji: "🚿" },
      { key: "weight_change", label: "Weight Change", emoji: "⚖️" },
      { key: "dark_urine", label: "Dark Urine", emoji: "🟤" },
    ],
  },
  {
    label: "General",
    color: "#22C55E",
    items: [
      { key: "fatigue", label: "Fatigue / Weakness", emoji: "😴" },
      { key: "pale_skin", label: "Pale Skin", emoji: "🫥" },
      { key: "cold_hands", label: "Cold Hands/Feet", emoji: "🥶" },
      { key: "slow_healing", label: "Slow Healing", emoji: "🩹" },
    ],
  },
];

function SeveritySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color = value >= 8 ? "#EF4444" : value >= 5 ? "#F59E0B" : "#22C55E";
  return (
    <div className="flex w-full items-center justify-between gap-2 mt-1">
      <span className="text-[10px] text-[#555] whitespace-nowrap">Mild</span>
      <input
        type="range" min="0" max="10" step="1" value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 min-w-0 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value * 10}%, rgba(255,255,255,0.06) ${value * 10}%)`,
        }}
      />
      <span className="text-[10px] text-[#555] whitespace-nowrap">Severe</span>
      <span className="text-xs font-bold min-w-[1.25rem] text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export default function FormSymptoms({ symptoms, onToggle, onUpdate }: FormSymptomsProps) {
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);
  const selectedKeys = new Set(symptoms.map(s => s.symptom));

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Select Your Symptoms
        </h3>
        <p className="text-[11px] text-[#555] mb-4">
          Tap to select, then adjust severity and details
        </p>
      </div>

      {SYMPTOM_CATEGORIES.map((cat, ci) => (
        <motion.div key={cat.label}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.08 }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: cat.color }}>{cat.label}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {cat.items.map(item => {
              const isSelected = selectedKeys.has(item.key);
              const entry = symptoms.find(s => s.symptom === item.key);
              const isExpanded = expandedSymptom === item.key;

              return (
                <div key={item.key}>
                  <motion.button
                    onClick={() => {
                      onToggle(item.key);
                      if (!isSelected) setExpandedSymptom(item.key);
                      else if (isExpanded) setExpandedSymptom(null);
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full text-left rounded-xl p-3 transition-all break-words whitespace-normal ${
                      isSelected
                        ? "border-[1.5px]"
                        : "border border-white/5 hover:border-white/10"
                    }`}
                    style={isSelected ? {
                      background: `${cat.color}12`,
                      borderColor: `${cat.color}40`,
                    } : {
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-base shrink-0">{item.emoji}</span>
                        <span className={`text-sm md:text-xs font-medium truncate ${isSelected ? "text-white" : "text-[#888]"}`}>
                          {item.label}
                        </span>
                      </div>
                      {isSelected && (
                        <ChevronDown
                          size={14} className="shrink-0 text-[#666] transition-transform"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                          onClick={e => { e.stopPropagation(); setExpandedSymptom(isExpanded ? null : item.key); }}
                        />
                      )}
                    </div>
                  </motion.button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isSelected && isExpanded && entry && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-b-xl px-4 pb-4 mt-[-4px] pt-4 overflow-hidden w-full"
                        style={{ background: `${cat.color}06`, borderLeft: `1.5px solid ${cat.color}40`, borderRight: `1.5px solid ${cat.color}40`, borderBottom: `1.5px solid ${cat.color}40` }}
                      >
                        {/* Severity */}
                        <div className="mt-2 w-full flex flex-col gap-1">
                          <SeveritySlider value={entry.severity} onChange={v => onUpdate(item.key, "severity", v)} />
                        </div>

                        {/* Duration */}
                        <div className="w-full mt-4">
                          <span className="block text-[10px] text-[#555] mb-1.5 font-medium">Duration:</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {["days", "weeks", "months"].map(d => (
                              <button key={d} onClick={() => onUpdate(item.key, "duration", d)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  entry.duration === d
                                    ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30"
                                    : "text-[#555] border border-white/5 hover:text-[#888]"
                                }`}>
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Trend */}
                        <div className="w-full mt-4">
                          <span className="block text-[10px] text-[#555] mb-1.5 font-medium">Trend:</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {[
                              { key: "improving", icon: TrendingDown, label: "Better", color: "#22C55E" },
                              { key: "stable", icon: Minus, label: "Same", color: "#666" },
                              { key: "worsening", icon: TrendingUp, label: "Worse", color: "#EF4444" },
                            ].map(t => {
                              const TIcon = t.icon;
                              return (
                                <button key={t.key} onClick={() => onUpdate(item.key, "trend", t.key)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                    entry.trend === t.key
                                      ? "border-white/20"
                                      : "border-white/5 hover:border-white/10"
                                  }`}
                                  style={entry.trend === t.key ? { background: `${t.color}15`, color: t.color } : { color: "#555" }}>
                                  <TIcon size={12} /> <span className="whitespace-nowrap">{t.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Selected count */}
      {symptoms.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center text-[11px] text-[#555] pt-2">
          {symptoms.length} symptom{symptoms.length !== 1 ? "s" : ""} selected
        </motion.div>
      )}
    </div>
  );
}
