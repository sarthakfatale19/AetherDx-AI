"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, Shield, XCircle, Activity, Heart } from "lucide-react";
import { useState } from "react";

type EmergencyLevel = "warning" | "high_risk" | "critical" | null;

interface EmergencyIntelligenceProps {
  riskTier?: string;
  explanation?: string;
  redFlags?: string[];
  riskScore?: number;
}

const RED_FLAG_KEYWORDS = [
  "chest pain", "difficulty breathing", "shortness of breath",
  "loss of consciousness", "fainting", "severe dehydration",
  "vision loss", "stroke", "numbness", "cannot speak",
  "high fever", "heart attack", "cardiac", "seizure",
  "unconscious", "not breathing", "choking",
];

function detectEmergencyLevel(props: EmergencyIntelligenceProps): EmergencyLevel {
  const { riskTier, explanation, redFlags, riskScore } = props;

  // Critical: explicit red flags or risk score > 85
  if ((redFlags && redFlags.length > 0) || (riskScore && riskScore >= 85)) {
    return "critical";
  }

  // Check explanation text for red flag keywords
  const lowerExplanation = (explanation || "").toLowerCase();
  const foundKeywords = RED_FLAG_KEYWORDS.filter(k => lowerExplanation.includes(k));

  if (foundKeywords.length >= 2) return "critical";
  if (foundKeywords.length === 1 || riskTier === "HIGH") return "high_risk";
  if (riskScore && riskScore >= 60) return "warning";

  return null;
}

export default function EmergencyIntelligence(props: EmergencyIntelligenceProps) {
  const [dismissed, setDismissed] = useState(false);
  const level = detectEmergencyLevel(props);

  if (!level || dismissed) return null;

  const configs = {
    warning: {
      icon: AlertTriangle,
      title: "Health Advisory",
      subtitle: "Your symptoms may require attention",
      description: "Based on our analysis, we recommend monitoring your condition closely. If symptoms worsen or persist, consider scheduling a consultation with your healthcare provider.",
      bgClass: "bg-amber-500/5 border-amber-500/20",
      iconColor: "text-amber-400",
      titleColor: "text-amber-300",
      pulseClass: "",
    },
    high_risk: {
      icon: Activity,
      title: "Elevated Risk Detected",
      subtitle: "Medical attention is recommended",
      description: "Your symptom profile indicates a potential health concern that warrants professional evaluation. We recommend contacting your doctor within the next 24–48 hours for a thorough assessment.",
      bgClass: "bg-red-500/5 border-red-500/20",
      iconColor: "text-red-400",
      titleColor: "text-red-300",
      pulseClass: "",
    },
    critical: {
      icon: Heart,
      title: "Urgent: Critical Symptoms Detected",
      subtitle: "Please seek immediate medical attention",
      description: "Emergency red flags have been identified in your symptom profile. This requires urgent medical evaluation. If you are experiencing any of the following, please call emergency services immediately.",
      bgClass: "bg-red-500/8 border-red-500/30 emergency-pulse",
      iconColor: "text-red-400",
      titleColor: "text-red-200",
      pulseClass: "emergency-pulse",
    },
  };

  const config = configs[level];
  const IconComp = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4 }}
        className={`rounded-xl p-4 border ${config.bgClass} ${config.pulseClass} relative overflow-hidden`}
      >
        {/* Subtle ambient glow */}
        {level === "critical" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${level === "critical" ? "bg-red-500/15" : level === "high_risk" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
            <IconComp size={18} className={config.iconColor} />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-sm font-semibold ${config.titleColor}`}>
                  {level === "critical" ? "🚨 " : level === "high_risk" ? "🔴 " : "⚠️ "}
                  {config.title}
                </h4>
                <p className="text-[11px] text-[#888] mt-0.5">{config.subtitle}</p>
              </div>
              {level !== "critical" && (
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 rounded-full hover:bg-white/5 text-[#555] hover:text-[#AAA] transition-colors"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
              {config.description}
            </p>

            {/* Red flag list for critical */}
            {level === "critical" && props.redFlags && props.redFlags.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {props.redFlags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    {flag.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                ))}
              </div>
            )}

            {/* Emergency contact for critical & high_risk */}
            {(level === "critical" || level === "high_risk") && (
              <div className="mt-3 flex items-center gap-2">
                <a
                  href="tel:112"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    level === "critical"
                      ? "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                  }`}
                >
                  <Phone size={12} />
                  Call Emergency Services (112)
                </a>
                <span className="text-[10px] text-[#555]">or your local emergency number</span>
              </div>
            )}
          </div>
        </div>

        {/* Safety badge */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
          <Shield size={10} className="text-[#555]" />
          <span className="text-[9px] text-[#555]">
            AetherDx Safety & Triage Engine v2.0 — Always consult a healthcare professional
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
