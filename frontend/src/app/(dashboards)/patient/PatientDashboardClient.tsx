"use client";

import { useABHA } from "@/hooks/useABHA";
import ConsentManager from "@/components/abha/ConsentManager";
import { UserCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ClientProps {
  email: string | null | undefined;
}

export default function PatientDashboardClient({ email }: ClientProps) {
  const abha = useABHA();
  const router = useRouter();

  const handleNewAssessment = (e: React.MouseEvent) => {
    e.preventDefault();
    if (abha.consentArtifact && abha.consentArtifact.status === "GRANTED") {
       router.push("/abha");
    } else {
       alert("Please grant Health Data Consent below in order to securely launch the AI assessment.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-8 md:p-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UserCircle className="text-emerald-400" size={32} />
              Health Profile
            </h1>
            <p className="text-zinc-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              Connected as {email}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNewAssessment}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition"
            >
              New Assessment
            </button>
            <Link href="/api/auth/signout" className="px-5 py-2 rounded-xl text-sm font-medium text-red-400 bg-red-400/5 hover:bg-red-400/10 transition border border-red-500/10">
              Sign Out
            </Link>
          </div>
        </header>

        {/* DPDP Compliance Card */}
        <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 relative overflow-hidden text-center mb-12">
            <ShieldAlert size={40} className="text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white">Your data is secured at rest.</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-2">
                AetherDx ensures DPDP compliance. Your clinical data is isolated and strictly encrypted tracking all diagnostic sessions.
            </p>
        </div>

        {/* Centralized Consent Manager */}
        <div className="mt-8 border-t border-white/5 pt-12">
          <ConsentManager
             onConsent={abha.requestConsent}
             onRevoke={abha.revokeConsent}
             consentArtifact={abha.consentArtifact}
             loading={abha.loading}
             profile={abha.profile}
          />
        </div>

      </div>
    </div>
  );
}
