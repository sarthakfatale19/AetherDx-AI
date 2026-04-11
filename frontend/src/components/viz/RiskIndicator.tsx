"use client";

import { motion } from "framer-motion";
import { Shield, AlertTriangle, AlertCircle } from "lucide-react";

interface RiskIndicatorProps {
  tier: string;
  probability: number;
  condition: string;
  modelAgreement?: string;
}

const tierConfig: Record<string, {
  color: string;
  bgColor: string;
  glowClass: string;
  icon: typeof Shield;
  label: string;
  description: string;
}> = {
  LOW: {
    color: "#22C55E",
    bgColor: "rgba(34, 197, 94, 0.08)",
    glowClass: "risk-glow-green",
    icon: Shield,
    label: "Low Risk",
    description: "Indicators suggest a healthy profile",
  },
  MODERATE: {
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
    glowClass: "risk-glow-amber",
    icon: AlertTriangle,
    label: "Moderate Risk",
    description: "Some indicators warrant monitoring",
  },
  HIGH: {
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
    glowClass: "risk-glow-red",
    icon: AlertCircle,
    label: "High Risk",
    description: "Elevated indicators — consult a professional",
  },
};

export default function RiskIndicator({
  tier,
  probability,
  condition,
  modelAgreement,
}: RiskIndicatorProps) {
  const config = tierConfig[tier] || tierConfig.LOW;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-4 ${config.glowClass}`}
      style={{
        background: config.bgColor,
        border: `1px solid ${config.color}22`,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Animated Glow Circle */}
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${config.color}15` }}
            animate={{
              boxShadow: [
                `0 0 20px ${config.color}20`,
                `0 0 40px ${config.color}30`,
                `0 0 20px ${config.color}20`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Circular Progress */}
            <svg className="absolute inset-0 w-16 h-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={`${config.color}20`}
                strokeWidth="3"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={config.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={175.9}
                initial={{ strokeDashoffset: 175.9 }}
                animate={{
                  strokeDashoffset: 175.9 - (175.9 * probability) / 100,
                }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </svg>
            <Icon size={22} color={config.color} />
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
            <span className="text-xs text-[#666]">•</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#A0A0A0]"
            >
              {condition}
            </motion.span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <motion.span
              className="text-2xl font-bold"
              style={{ color: config.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {probability}%
            </motion.span>
            <span className="text-xs text-[#666]">risk probability</span>
          </div>

          <p className="text-xs text-[#666] mt-1">{config.description}</p>

          {modelAgreement && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex gap-0.5">
                {modelAgreement.split("/").length === 2 &&
                  Array.from({ length: parseInt(modelAgreement.split("/")[1]) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          i < parseInt(modelAgreement!.split("/")[0])
                            ? config.color
                            : `${config.color}30`,
                      }}
                    />
                  ))}
              </div>
              <span className="text-[11px] text-[#666]">
                {modelAgreement} models agree
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
