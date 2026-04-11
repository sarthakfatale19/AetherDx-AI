"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, MapPin, X } from "lucide-react";
import type { EmergencyState } from "@/hooks/useAssessment";

interface EmergencyOverlayProps {
  emergency: EmergencyState;
  onDismiss: () => void;
}

export default function EmergencyOverlay({ emergency, onDismiss }: EmergencyOverlayProps) {
  if (!emergency.is_emergency) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-md rounded-3xl overflow-hidden"
          style={{ background: "#1A0A0A", border: "2px solid rgba(239,68,68,0.4)" }}
        >
          {/* Pulsing header */}
          <div className="relative px-6 py-8 text-center overflow-hidden">
            {/* Animated pulse rings */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle at center, rgba(239,68,68,0.15), transparent 70%)" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 relative"
              style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <AlertTriangle size={36} className="text-red-400" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <h2 className="text-xl font-bold text-red-400 mb-2">
              SEEK IMMEDIATE MEDICAL ATTENTION
            </h2>
            <p className="text-sm text-[#999]">
              Critical health indicators have been detected
            </p>
          </div>

          {/* Alert details */}
          <div className="px-6 pb-4 space-y-2">
            {emergency.alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-xl p-3 flex items-start gap-3"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-red-300">{alert.field || alert.type}</p>
                  <p className="text-[11px] text-[#888] mt-0.5">{alert.message}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 space-y-3">
            <a
              href={`tel:${emergency.emergency_number}`}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
                boxShadow: "0 8px 30px rgba(239,68,68,0.3)",
              }}
            >
              <Phone size={20} />
              Call {emergency.emergency_number} — Emergency
            </a>

            <a
              href="sms:?body=Emergency! I am experiencing high health risk alerts on my AetherDx assessment. Please check on me."
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm text-[#E0E0E0] transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <AlertTriangle size={16} />
              Notify Family (SMS)
            </a>

            <a
              href="https://www.google.com/maps/search/hospital+near+me"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm text-[#C0C0C0] transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <MapPin size={16} />
              Find Nearest Hospital
            </a>

            <button
              onClick={onDismiss}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs text-[#555] hover:text-[#888] transition-all"
            >
              <X size={14} />
              I understand the risks — Continue assessment
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
