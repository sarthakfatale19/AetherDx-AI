"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Clock, CheckCircle2, AlertTriangle, BookOpen,
  X, ShieldAlert, Lock
} from "lucide-react";

const DATA_TYPE_OPTIONS = [
  { id: "labs", label: "Lab Reports", icon: "🔬", desc: "Blood tests, pathology" },
  { id: "vitals", label: "Vitals", icon: "❤️", desc: "BP, pulse, temperature" },
  { id: "prescriptions", label: "Prescriptions", icon: "💊", desc: "Current & past medications" },
  { id: "conditions", label: "Conditions", icon: "🏥", desc: "Diagnosed conditions" },
  { id: "diagnostics", label: "Diagnostics", icon: "📊", desc: "X-rays, ECG, imaging" },
];

const DURATION_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "3 months" },
  { value: 365, label: "1 year" },
];

interface ConsentManagerProps {
  onConsent: (dataTypes: string[], durationDays: number) => Promise<any>;
  onRevoke?: () => Promise<any>;
  consentArtifact?: any;
  loading: boolean;
  profile: any;
}

export default function ConsentManager({
  onConsent, onRevoke, consentArtifact, loading, profile
}: ConsentManagerProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["labs", "vitals", "prescriptions", "conditions", "diagnostics"]);
  const [duration, setDuration] = useState(30);
  const [showRevoke, setShowRevoke] = useState(false);

  const isActive = consentArtifact && consentArtifact.status === "GRANTED";

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleConsent = async () => {
    if (selectedTypes.length === 0) return;
    await onConsent(selectedTypes, duration);
  };

  const handleRevoke = async () => {
    if (onRevoke) {
      await onRevoke();
      setShowRevoke(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            Health Data Consent
          </h2>
          <p className="text-xs text-[#888]">ABDM-compliant consent management</p>
        </div>
      </div>

      {/* Active Consent View */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-sm font-semibold text-green-400">Consent Active</span>
            </div>
            <button
              onClick={() => setShowRevoke(true)}
              className="text-[10px] text-[#888] hover:text-red-400 px-2 py-1 rounded transition-colors"
            >
              Revoke
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-[#888]">
            <p><span className="text-[#555]">ID:</span> {consentArtifact.consent_id?.slice(0, 16)}...</p>
            <p><span className="text-[#555]">Types:</span> {consentArtifact.data_types?.join(", ")}</p>
            <p><span className="text-[#555]">Expires:</span> {consentArtifact.expiry ? new Date(consentArtifact.expiry).toLocaleDateString() : "N/A"}</p>
            <p><span className="text-[#555]">HIP:</span> {consentArtifact.hip?.name || "N/A"}</p>
          </div>

          {/* Audit Trail */}
          {consentArtifact.audit_trail?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-500/10">
              <p className="text-[9px] text-[#555] uppercase tracking-wider mb-1">Audit Trail</p>
              {consentArtifact.audit_trail.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-[10px] text-[#888]">
                  <Lock size={8} className="text-[#555]" />
                  <span>{entry.action}</span>
                  <span className="text-[#555]">— {entry.by}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Revoke Confirmation Dialog */}
      <AnimatePresence>
        {showRevoke && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl p-4"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">Revoke Consent?</span>
              <button onClick={() => setShowRevoke(false)} className="ml-auto text-[#888] hover:text-white">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-[#888] mb-3">
              This will immediately revoke access to your health data. All fetched data will be purged.
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRevoke}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all"
              >
                Yes, Revoke
              </button>
              <button
                onClick={() => setShowRevoke(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#888] bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Consent Form (only shown when no active consent) */}
      {!isActive && (
        <>
          {/* Data Type Selection */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-3">
              Select Health Data
            </p>
            <div className="space-y-2">
              {DATA_TYPE_OPTIONS.map((opt) => {
                const selected = selectedTypes.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleType(opt.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      selected
                        ? "bg-[#6366F1]/10 border border-[#6366F1]/25"
                        : "bg-white/[0.02] border border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${selected ? "text-white" : "text-[#888]"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[9px] text-[#555]">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      selected ? "bg-[#6366F1] border-[#6366F1]" : "border-white/15"
                    }`}>
                      {selected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selection */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-[#888]" />
              <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">Consent Duration</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    duration === opt.value
                      ? "bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/25"
                      : "bg-white/[0.02] text-[#888] border border-white/5 hover:border-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Purpose Notice */}
          <div
            className="rounded-2xl p-3 flex items-start gap-2"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}
          >
            <BookOpen size={14} className="text-[#818CF8] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#999]">
                <span className="font-medium text-[#818CF8]">Purpose:</span> AI Risk Prediction & Health Intelligence
              </p>
              <p className="text-[9px] text-[#555] mt-0.5">
                Your data will be processed in-memory only and never stored permanently. {" "}
                You can revoke consent at any time.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleConsent}
            disabled={loading || selectedTypes.length === 0}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white
                       bg-gradient-to-r from-green-600 to-emerald-500
                       hover:from-green-500 hover:to-emerald-400
                       disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-all"
            id="consent-approve-btn"
            style={{ boxShadow: selectedTypes.length > 0 ? "0 4px 20px rgba(34,197,94,0.2)" : "none" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Requesting...
              </span>
            ) : (
              <>
                <Shield size={16} />
                Grant Consent ({selectedTypes.length} data types, {duration} days)
              </>
            )}
          </button>
        </>
      )}
    </motion.div>
  );
}
