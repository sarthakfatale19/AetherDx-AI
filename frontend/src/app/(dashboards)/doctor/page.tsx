import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ShieldCheck, HeartPulse, Stethoscope } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DoctorDashboard() {
  const authSession = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-8 md:p-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Stethoscope className="text-blue-400" size={32} />
              Clinical Dashboard
            </h1>
            <p className="text-zinc-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              Connected as {authSession?.user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition">
              Assess Patient
            </Link>
            <Link href="/api/auth/signout" className="px-5 py-2 rounded-xl text-sm font-medium text-red-400 bg-red-400/5 hover:bg-red-400/10 transition border border-red-500/10">
              Sign Out
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <HeartPulse className="text-zinc-400 mb-2 relative z-10" />
            <span className="text-3xl font-bold text-white relative z-10">42</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium relative z-10">Pending Patient Triages</span>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
