"use client";

import { motion } from "framer-motion";
import { Shield, Wifi, WifiOff, FileText, Cpu } from "lucide-react";

interface SystemBadgesProps {
  abhaReport?: { report_id: string; standard: string };
  edgeReadiness?: { model_size_kb: number; inference_time_ms: number; offline_capable: boolean };
}

export default function SystemBadges({ abhaReport, edgeReadiness }: SystemBadgesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5"
    >
      {/* ABHA Badge */}
      {abhaReport && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        bg-[#22C55E]/[0.04] border border-[#22C55E]/15 group cursor-default">
          <Shield size={11} className="text-[#22C55E]" />
          <span className="text-[9px] font-semibold text-[#22C55E] uppercase tracking-wider">
            ABHA Ready
          </span>
          <span className="text-[8px] text-[#555] font-normal normal-case tracking-normal hidden group-hover:inline transition-all">
            — {abhaReport.standard}
          </span>
        </div>
      )}

      {/* Edge/Offline Badge */}
      {edgeReadiness && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        bg-[#818CF8]/[0.04] border border-[#818CF8]/15 group cursor-default">
          <Cpu size={11} className="text-[#818CF8]" />
          <span className="text-[9px] font-semibold text-[#818CF8] uppercase tracking-wider">
            Edge Ready
          </span>
          <span className="text-[8px] text-[#555] font-normal normal-case tracking-normal hidden group-hover:inline transition-all">
            — {edgeReadiness.model_size_kb}KB · {edgeReadiness.inference_time_ms}ms
          </span>
        </div>
      )}

      {/* Offline Capable */}
      {edgeReadiness?.offline_capable && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        bg-[#F59E0B]/[0.04] border border-[#F59E0B]/15">
          <WifiOff size={11} className="text-[#F59E0B]" />
          <span className="text-[9px] font-semibold text-[#F59E0B] uppercase tracking-wider">
            Offline Capable
          </span>
        </div>
      )}

      {/* Report ID */}
      {abhaReport && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        bg-white/[0.02] border border-white/5">
          <FileText size={11} className="text-[#555]" />
          <span className="text-[9px] text-[#555] font-mono">
            {abhaReport.report_id}
          </span>
        </div>
      )}
    </motion.div>
  );
}
