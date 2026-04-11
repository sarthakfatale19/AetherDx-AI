"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, PlusCircle, Mail, Lock, Stethoscope } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "Requires 1 uppercase")
    .regex(/[\W_]/, "Requires 1 symbol"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
});

export default function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", role: "PATIENT" as const }
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        setServerError(body.message || "Registration failed.");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setServerError("An unexpected error occurred.");
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
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
            <PlusCircle className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="text-sm text-zinc-400 mt-2">Join the AetherDx health network.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <div>
            <label className="text-xs font-medium text-zinc-400 ml-1 mb-1 block flex justify-between">
              Email Address
              {errors.email && <span className="text-red-400">{errors.email.message}</span>}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                {...register("email")}
                autoComplete="email"
                className={`w-full bg-black/40 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all`}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 ml-1 mb-1 block flex justify-between">
              Password
              {errors.password && <span className="text-red-400">{errors.password.message}</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="password"
                {...register("password")}
                className={`w-full bg-black/40 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all`}
                placeholder="Secure Password"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 ml-1 mb-2 block">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer relative">
                <input type="radio" value="PATIENT" {...register("role")} className="peer sr-only" />
                <div className="p-3 text-sm text-center border text-zinc-400 border-white/10 rounded-xl peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500 peer-checked:text-emerald-400 transition-all">
                  Patient
                </div>
              </label>
              <label className="cursor-pointer relative">
                <input type="radio" value="DOCTOR" {...register("role")} className="peer sr-only" />
                <div className="p-3 text-sm flex items-center justify-center gap-2 border text-zinc-400 border-white/10 rounded-xl peer-checked:bg-blue-500/10 peer-checked:border-blue-500 peer-checked:text-blue-400 transition-all">
                  <Stethoscope size={14} /> Doctor
                </div>
              </label>
            </div>
          </div>

          {serverError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center mt-2">
              {serverError}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium text-sm py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a1a] px-2 text-zinc-500">Or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google")}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Account
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500 relative z-10">
          Already have an account? <Link href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
