"use client";

import { useState } from "react";
import { Download, Share2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { generatePDFReport } from "./PDFReportGenerator";

interface ReportExportActionsProps {
  score: number;
  tier: string;
  primaryFinding: string;
  predictions?: any[];
  contributingFactors?: any[];
  formReasoning?: any[];
  recommendations?: any[];
  adaptiveScore?: any;
}

export default function ReportExportActions({
  score,
  tier,
  primaryFinding,
  predictions,
  contributingFactors,
  formReasoning,
  recommendations,
  adaptiveScore,
}: ReportExportActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      generatePDFReport({
        predictions: predictions || [],
        condition: primaryFinding,
        probability: score,
        riskTier: tier,
        contributingFactors: contributingFactors || formReasoning || [],
        explanation: `AetherDx AI Risk Assessment\nPrimary Finding: ${primaryFinding}\nRisk Score: ${Math.round(score)}/100\nRisk Tier: ${tier}`,
        healthScore: Math.round(100 - score),
        adaptiveScore,
        recommendations,
        redFlags: adaptiveScore?.detected_red_flags,
      });
      setDownloaded(true);
      // Reset downloaded state after 3 seconds
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getWhatsAppLink = () => {
    const text = `I just checked my health on AetherDx AI! \nRisk Score: ${Math.round(score)}/100 (${tier} Risk)\nFinding: ${primaryFinding}\nGet your own assessment: https://aetherdx.ai`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-3 mb-6"
    >
      <button 
        onClick={handleDownload}
        disabled={downloading}
        className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
          downloaded 
            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
            : "bg-[#2A2A2A] text-white hover:bg-[#333] border border-white/10"
        }`}
      >
        {downloading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : downloaded ? (
          <CheckCircle2 size={16} />
        ) : (
          <Download size={16} />
        )}
        {downloading ? "Generating PDF..." : downloaded ? "Downloaded ✓" : "Download Report"}
      </button>

      <a 
        href={getWhatsAppLink()}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 font-semibold text-sm hover:bg-[#25D366]/20 transition-all"
      >
        <Share2 size={16} />
        Share to WhatsApp
      </a>
    </motion.div>
  );
}
