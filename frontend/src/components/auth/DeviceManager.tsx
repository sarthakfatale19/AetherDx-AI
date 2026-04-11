"use client";

import { motion } from "framer-motion";
import { Monitor, Smartphone, Globe, ShieldOff, CheckCircle2 } from "lucide-react";
import { useState } from "react";

// Mocking the fetched session prop for immediate visual UI layout based on NextAuth
interface ActiveSession {
  id: string;
  deviceType: string | null;
  location: string | null;
  lastActive: Date;
  isCurrent: boolean;
}

const formatRelativeTime = (date: Date) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return rtf.format(daysDifference, 'day');
};

export default function DeviceManager({ sessions: initialSessions }: { sessions: ActiveSession[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    
    // Simulating API call latency
    await new Promise(r => setTimeout(r, 800));
    
    // Optimistic UI update
    setSessions(prev => prev.filter(s => s.id !== id));
    setRevokingId(null);
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl w-full max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <ShieldOff size={18} className="text-indigo-400" />
          Active Devices
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Review the devices where you are currently logged in. Revoke any you do not recognize.</p>
      </div>

      <div className="space-y-3">
        {sessions.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-xl border ${session.isCurrent ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-black/40"}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                {session.deviceType?.toLowerCase().includes("mac") || session.deviceType?.toLowerCase().includes("windows") ? (
                  <Monitor size={18} className="text-zinc-400" />
                ) : session.deviceType?.toLowerCase().includes("iphone") ? (
                  <Smartphone size={18} className="text-zinc-400" />
                ) : (
                  <Globe size={18} className="text-zinc-400" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {session.deviceType || "Unknown Device"}
                  </span>
                  {session.isCurrent && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-sm">
                      <CheckCircle2 size={10} /> Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                  <span>{session.location || "IP Unknown"}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{session.isCurrent ? "Active now" : formatRelativeTime(session.lastActive)}</span>
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <button
                onClick={() => handleRevoke(session.id)}
                disabled={revokingId === session.id}
                className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {revokingId === session.id ? "Revoking..." : "Revoke Session"}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
