"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  BarChart3,
  Brain,
  BookOpen,
  HeartPulse,
  Shield,
  Sparkles,
  ChevronDown,
  Cpu,
} from "lucide-react";
import SymptomPicker from "./SymptomPicker";

const suggestions = [
  { icon: Stethoscope, label: "Symptoms", prompt: "I'm not feeling well and need help understanding my symptoms" },
  { icon: BarChart3, label: "Risk Prediction", prompt: "Can you help me assess my health risk?" },
  { icon: Brain, label: "AI Diagnosis", prompt: "I'd like an AI-assisted health analysis" },
  { icon: BookOpen, label: "Treatment Guide", prompt: "What treatment options are available for my condition?" },
  { icon: HeartPulse, label: "Health Insights", prompt: "I want to learn about preventive health care" },
];

interface HeroScreenProps {
  onSuggestionClick: (prompt: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function HeroScreen({ onSuggestionClick }: HeroScreenProps) {
  const greeting = getGreeting();
  const [showArch, setShowArch] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-72 pt-12 relative">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-[0.03] blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366F1, transparent)" }} />
      <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full opacity-[0.02] blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #22C55E, transparent)" }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center shadow-2xl shadow-[#6366F1]/20">
          <span className="text-white text-3xl">✴</span>
        </div>
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-[#6366F1]"
          animate={{ scale: [1, 1.3, 1.3], opacity: [0.4, 0, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight text-center"
      >
        AetherDx AI
      </motion.h1>

      {/* Time-based greeting */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-base text-[#888] mb-1"
      >
        {greeting}! 👋
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-[#666] mb-8 text-center max-w-md"
      >
        Predict. Prevent. Personalize Healthcare.
      </motion.p>

      {/* Health Assessment CTA - Most Prominent */}
      <motion.a
        href="/assess"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.5, type: "spring" }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-3 px-8 py-4 w-full max-w-sm rounded-[1.25rem] text-sm font-bold text-white mb-8 transition-all relative overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
          boxShadow: "0 10px 40px -10px rgba(99,102,241,0.5)",
        }}
        id="cta-health-assessment"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-xl">🩺</span>
        <span className="tracking-wide text-base">Start Health Assessment</span>
        <Sparkles size={16} className="text-white/80" />
      </motion.a>

      {/* Feature badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center flex-wrap justify-center gap-2 md:gap-3 mb-10 max-w-full"
      >
        {[
          { icon: Shield, label: "HIPAA-Aware", color: "#22C55E" },
          { icon: Sparkles, label: "4 AI Models", color: "#6366F1" },
          { icon: Brain, label: "Explainable AI", color: "#F59E0B" },
        ].map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: `${badge.color}08`, border: `1px solid ${badge.color}20` }}
            >
              <Icon size={12} color={badge.color} />
              <span className="text-[10px] font-semibold tracking-wider" style={{ color: badge.color }}>
                {badge.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Architecture Intelligence Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="w-full max-w-2xl mb-8 px-2"
      >
        <button
          onClick={() => setShowArch(!showArch)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-2xl text-left transition-all group"
          style={{
            background: "rgba(99,102,241,0.04)",
            border: "1px solid rgba(99,102,241,0.12)",
          }}
          id="arch-toggle-btn"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#818CF8]/20 flex items-center justify-center">
              <Cpu size={14} className="text-[#818CF8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">How AetherDx Thinks</p>
              <p className="text-[9px] text-[#666]">Gemini-class multi-stage intelligence pipeline</p>
            </div>
          </div>
          <motion.div animate={{ rotate: showArch ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={16} className="text-[#666] group-hover:text-[#818CF8] transition-colors" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showArch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="mt-2 rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {[
                  { step: "01", title: "Preprocessing & Intent", color: "#22C55E",
                    desc: "Raw input is tokenized, normalized, and classified into intents (greeting, symptom, query) with parallel entity extraction (symptoms, duration, severity)." },
                  { step: "02", title: "Contextual Memory", color: "#6366F1",
                    desc: "A rolling memory engine stores recent interactions, compressed semantic summaries, and inferred user state for contextually-aware multi-turn conversations." },
                  { step: "03", title: "Probabilistic Reasoning", color: "#F59E0B",
                    desc: "Symptoms are mapped to clinical features and correlated with structured datasets (anemia, diabetes, cardiovascular) using XGBoost and weighted probability matrices." },
                  { step: "04", title: "Tool Augmentation & 3D Viz", color: "#EF4444",
                    desc: "External APIs (ABHA/FHIR, hospital search) are invoked dynamically. Results are rendered over an immersive volumetric 3D Anatomical Glass Body synced to SHAP metrics." },
                  { step: "05", title: "Adaptive Feedback Loop", color: "#818CF8",
                    desc: "Each interaction refines predictions dynamically within DPDP-compliant constraints, creating continuous learning cycles that enhance accuracy and personalization." },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}
                    >
                      <span className="text-[9px] font-black" style={{ color: item.color }}>{item.step}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-[10px] text-[#777] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}

                <div className="pt-3 border-t border-white/5 text-center">
                  <p className="text-[9px] text-[#555]">
                    This combination of NLU, contextual memory, probabilistic reasoning, and tool integration is what makes AetherDx feel intelligent, adaptive, and reliable.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Suggestion Chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap justify-center gap-2.5 mb-10 max-w-2xl px-2"
      >
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.06 }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSuggestionClick(s.prompt)}
              className="chip flex items-center gap-2 text-sm px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[#E0E0E0] border border-white/5 transition-all"
              id={`suggestion-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon size={14} className="text-[#818CF8]" />
              {s.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Body-area Symptom Picker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="w-full max-w-3xl"
      >
        <SymptomPicker onSymptomSelect={onSuggestionClick} />
      </motion.div>
    </div>
  );
}
