"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Fingerprint, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

interface ABHALoginCardProps {
  onLogin: (abhaId: string) => Promise<any>;
  onVerify: (otp: string) => Promise<any>;
  step: "login" | "otp";
  loading: boolean;
  mode?: string;
}

export default function ABHALoginCard({ onLogin, onVerify, step, loading, mode }: ABHALoginCardProps) {
  const [abhaId, setAbhaId] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {/* ABDM Badge */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8F65] flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#FF8F65] tracking-wider">ABDM CERTIFIED</p>
          <p className="text-[10px] text-[#666]">Ayushman Bharat Digital Mission</p>
        </div>
      </div>

      {/* Login Card */}
      <div
        className="rounded-2xl p-6 backdrop-blur-lg"
        style={{
          background: "linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(99,102,241,0.08) 100%)",
          border: "1px solid rgba(255,107,53,0.15)",
        }}
      >
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Fingerprint size={20} className="text-[#FF8F65]" />
          {step === "login" ? "Connect Your ABHA" : "Verify OTP"}
        </h2>
        <p className="text-xs text-[#888] mb-5">
          {step === "login"
            ? "Enter your 14-digit ABHA Number or ABHA Address to securely access your health records."
            : "Enter the 6-digit OTP sent to your registered mobile number."}
        </p>

        <AnimatePresence mode="wait">
          {step === "login" ? (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">
                ABHA Number / Address
              </label>
              <input
                type="text"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
                placeholder="XX-XXXX-XXXX-XXXX or user@abdm"
                className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] border border-white/10 text-white text-sm placeholder-[#555]
                           focus:outline-none focus:border-[#FF8F65]/50 focus:ring-1 focus:ring-[#FF8F65]/20 transition-all"
                id="abha-id-input"
              />
              <button
                onClick={() => abhaId.length >= 4 && onLogin(abhaId)}
                disabled={loading || abhaId.length < 4}
                className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white
                           bg-gradient-to-r from-[#FF6B35] to-[#FF8F65]
                           hover:from-[#FF5520] hover:to-[#FF7F55]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 transition-all"
                id="abha-login-btn"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Send OTP <ArrowRight size={14} />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">
                Enter OTP
              </label>
              <div className="flex gap-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newOtp = otp.split("");
                      newOtp[i] = val;
                      setOtp(newOtp.join(""));
                      if (val && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement).focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-[#1A1A1A] border border-white/10 text-white
                               focus:outline-none focus:border-[#FF8F65]/50 focus:ring-1 focus:ring-[#FF8F65]/20 transition-all"
                    id={`otp-input-${i}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#FF8F65] mb-3">💡 Simulation: Use OTP 123456</p>
              <button
                onClick={() => otp.length === 6 && onVerify(otp)}
                disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white
                           bg-gradient-to-r from-[#6366F1] to-[#818CF8]
                           hover:from-[#5558E8] hover:to-[#727AE8]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 transition-all"
                id="abha-verify-btn"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Verify & Connect
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Simulation hint */}
      {mode === "simulation" && step === "otp" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-[#555] text-center mt-3">
          💡 Simulation mode — use OTP: <span className="text-[#818CF8] font-mono">123456</span>
        </motion.p>
      )}
    </motion.div>
  );
}
