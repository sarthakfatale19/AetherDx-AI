"use client";

import { motion } from "framer-motion";
import { Brain, Heart, Droplets, Activity } from "lucide-react";

interface SymptomPickerProps {
  onSymptomSelect: (symptoms: string) => void;
}

const bodyAreas = [
  {
    icon: Brain,
    area: "Head & Neurological",
    color: "#818CF8",
    symptoms: [
      { label: "Headache", key: "headache" },
      { label: "Dizziness", key: "dizziness" },
      { label: "Blurred Vision", key: "blurred_vision" },
      { label: "Numbness", key: "numbness" },
    ],
  },
  {
    icon: Heart,
    area: "Cardiovascular",
    color: "#EF4444",
    symptoms: [
      { label: "Chest Pain", key: "chest_pain" },
      { label: "Shortness of Breath", key: "shortness_of_breath" },
      { label: "Swelling", key: "swelling" },
      { label: "Fatigue", key: "fatigue" },
    ],
  },
  {
    icon: Droplets,
    area: "Metabolic",
    color: "#F59E0B",
    symptoms: [
      { label: "Excessive Thirst", key: "excessive_thirst" },
      { label: "Frequent Urination", key: "frequent_urination" },
      { label: "Weight Changes", key: "weight_change" },
      { label: "Slow Healing", key: "slow_healing" },
    ],
  },
  {
    icon: Activity,
    area: "General",
    color: "#22C55E",
    symptoms: [
      { label: "Pale Skin", key: "pale_skin" },
      { label: "Cold Hands", key: "cold_hands" },
      { label: "Dark Urine", key: "dark_urine" },
      { label: "Exhaustion", key: "fatigue" },
    ],
  },
];

export default function SymptomPicker({ onSymptomSelect }: SymptomPickerProps) {
  const handleSelect = (areaName: string, symptomLabels: string[]) => {
    const prompt = `I am experiencing ${symptomLabels.join(", ").toLowerCase()}`;
    onSymptomSelect(prompt);
  };

  return (
    <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto mt-6">
      {bodyAreas.map((area, i) => {
        const Icon = area.icon;
        return (
          <motion.button
            key={area.area}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(area.area, area.symptoms.map(s => s.label))}
            className="group p-4 rounded-xl text-left transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid rgba(255,255,255,0.06)`,
            }}
            id={`symptom-area-${area.area.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: `${area.color}15` }}
              >
                <Icon size={16} color={area.color} />
              </div>
              <span className="text-xs font-semibold text-[#E0E0E0] group-hover:text-white transition-colors">
                {area.area}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {area.symptoms.map((s) => (
                <span
                  key={s.key}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-[#888] 
                             group-hover:bg-white/[0.06] group-hover:text-[#B0B0B0] transition-all"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
