"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Mail, Lock, ShieldAlert, Fingerprint } from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  
  // Auth Modes
  const [loginMethod, setLoginMethod] = useState<"credentials" | "abha">("credentials");
  
  // Credentials State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);

  // ABHA State
  const [abhaId, setAbhaId] = useState("");
  const [abhaTxnId, setAbhaTxnId] = useState("");
  const [abhaOtp, setAbhaOtp] = useState("");
  const [needsAbhaOtp, setNeedsAbhaOtp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        mfaToken: mfaToken || undefined,
      });

      if (res?.error) {
        if (res.error === "MFA_REQUIRED") {
          setNeedsMfa(true);
        } else {
          setError(res.error);
        }
      } else {
        router.push("/dashboard-router");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbhaInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/v1/patient/login/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Aligning with standard ABDM OTP flow expectations natively implemented inside Python backend
        body: JSON.stringify({ authMode: "MOBILE_OTP", identifier: abhaId }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate ABHA log in via gateway.");
      }

      const data = await response.json();
      setAbhaTxnId(data.transactionId);
      setNeedsAbhaOtp(true);
    } catch (err: any) {
      setError(err.message || "Could not reach ABDM gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbhaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/v1/patient/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: abhaTxnId, otp: abhaOtp }),
      });

      if (!response.ok) {
        throw new Error("Invalid OTP or expired transaction.");
      }

      const data = await response.json();
      if (data.accessToken) {
         router.push("/dashboard-router");
         router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Could not verify ABHA OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-[2rem] border border-white/10 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(30,30,30,0.8), rgba(20,20,20,0.9))",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}
      >
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
        
        <div className="text-center mb-8 relative z-10">
          <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-colors duration-500 ${loginMethod === 'abha' ? 'from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'from-indigo-500 to-purple-600 shadow-indigo-500/30'}`}>
            {loginMethod === 'abha' ? <Fingerprint className="text-white" size={24} /> : <ShieldCheck className="text-white" size={24} />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to AetherDx</h2>
          <p className="text-sm text-zinc-400 mt-2">
            {loginMethod === 'abha' ? "ABDM Secure Health Access." : "Secure access for clinical intelligence."}
          </p>
        </div>

        {/* Method Toggle */}
        {(!needsMfa && !needsAbhaOtp) && (
          <div className="flex bg-black/40 p-1 rounded-xl mb-6 relative z-10">
            <button
              type="button"
              onClick={() => { setLoginMethod("credentials"); setError(""); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${loginMethod === "credentials" ? "bg-white/10 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Email Setup
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod("abha"); setError(""); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${loginMethod === "abha" ? "bg-emerald-500/20 text-emerald-400 shadow" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              ABHA Identity
            </button>
          </div>
        )}

        <form onSubmit={
          loginMethod === "credentials" 
            ? handleCredentialsSubmit 
            : (needsAbhaOtp ? handleAbhaVerify : handleAbhaInit)
        } className="space-y-4 relative z-10">
          
          <AnimatePresence mode="wait">
            {/* --- CREDENTIALS MODE --- */}
            {loginMethod === "credentials" && !needsMfa && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-zinc-400 ml-1 mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      placeholder="doctor@aetherdx.ai"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 ml-1 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {loginMethod === "credentials" && needsMfa && (
              <motion.div
                key="mfa"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 text-center pb-2"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <ShieldAlert className="text-indigo-400" size={20} />
                </div>
                <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                <p className="text-xs text-zinc-400 px-4">
                  Please enter the 6-digit verification code from your authenticator app.
                </p>
                <div>
                  <input
                    type="text"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all mt-2"
                    placeholder="______"
                    maxLength={6}
                  />
                </div>
              </motion.div>
            )}

            {/* --- ABHA MODE --- */}
            {loginMethod === "abha" && !needsAbhaOtp && (
              <motion.div
                key="abha-id"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-emerald-400/80 ml-1 mb-1 block">ABHA Number / Identity</label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50" size={16} />
                    <input
                      type="text"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      required
                      className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-10 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      placeholder="user@abdm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {loginMethod === "abha" && needsAbhaOtp && (
              <motion.div
                key="abha-otp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 text-center pb-2"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <ShieldAlert className="text-emerald-400" size={20} />
                </div>
                <h3 className="text-white font-medium">Verify ABHA OTP</h3>
                <p className="text-xs text-zinc-400 px-4">
                  We've initiated an ABDM transaction. Enter the OTP sent to your registered mobile number.
                </p>
                <div>
                  <input
                    type="text"
                    value={abhaOtp}
                    onChange={(e) => setAbhaOtp(e.target.value)}
                    required
                    className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all mt-2"
                    placeholder="______"
                    maxLength={6}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-medium text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 text-white
              ${loginMethod === "abha" ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]"}`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 
              (loginMethod === "abha" ? (needsAbhaOtp ? "Log into AetherDx" : "Request OTP") : (needsMfa ? "Verify Identity" : "Continue"))
            }
          </button>
        </form>

        {(!needsMfa && !needsAbhaOtp) && (
          <div className="mt-6 text-center text-xs text-zinc-500 relative z-10">
            Don&apos;t have an account? <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Register</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
