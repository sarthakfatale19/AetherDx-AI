"use client";

import jsPDF from "jspdf";

interface PDFReportData {
  predictions: any[];
  condition: string;
  probability: number;
  riskTier: string;
  contributingFactors: any[];
  explanation: string;
  healthScore?: number;
  adaptiveScore?: any;
  recommendations?: any[];
  redFlags?: string[];
  sceneImage?: string;
}

// Color helpers
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],    // #6366F1
  dark: [13, 13, 13] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  muted: [160, 160, 160] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  bg: [26, 26, 26] as [number, number, number],
};

function getRiskColor(tier: string): [number, number, number] {
  if (tier === "HIGH") return COLORS.red;
  if (tier === "MODERATE") return COLORS.amber;
  return COLORS.green;
}

export function generatePDFReport(data: PDFReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const reportId = `ATH-${Date.now().toString(36).toUpperCase()}`;
  const riskColor = getRiskColor(data.riskTier);
  const healthScore = data.healthScore ?? Math.round(100 - data.probability);

  // ====== PAGE 1: HEADER ======
  // Dark header strip
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Brand line
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 50, pageWidth, 2, "F");

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("AetherDx AI", margin, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Health Risk Assessment Report", margin, 30);

  doc.setFontSize(8);
  doc.text(`Report ID: ${reportId}`, margin, 40);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, pageWidth - margin, 40, { align: "right" });
  doc.text("Engine: AetherDx AI Engine v2.0", pageWidth - margin, 46, { align: "right" });

  y = 62;

  // ====== PRIMARY RISK ASSESSMENT ======
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, "F");

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PRIMARY RISK ASSESSMENT", margin + 6, y + 8);

  doc.setFontSize(16);
  doc.setTextColor(...riskColor);
  doc.text(data.condition, margin + 6, y + 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Probability: ${data.probability}%`, margin + 6, y + 30);
  doc.text(`Risk Level: ${data.riskTier}`, margin + 80, y + 30);
  doc.text(`Health Score: ${healthScore}/100`, margin + 130, y + 30);

  // Risk indicator dot
  doc.setFillColor(...riskColor);
  doc.circle(pageWidth - margin - 10, y + 20, 6, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.probability}`, pageWidth - margin - 10, y + 22, { align: "center" });

  y += 50;

  // ====== CONDITION ANALYSIS ======
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CONDITION ANALYSIS", margin, y);
  y += 3;

  // Separator line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 50, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  if (data.predictions && data.predictions.length > 0) {
    data.predictions.forEach((p: any) => {
      const pColor = getRiskColor(p.risk_tier || "LOW");
      doc.setFillColor(...pColor);
      doc.circle(margin + 2.5, y - 1, 1.5, "F");
      doc.text(`${p.condition} — ${p.probability}% (${p.risk_tier || "N/A"})`, margin + 8, y);
      y += 6;
    });
  }

  y += 5;

  // ====== CONTRIBUTING FACTORS ======
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRIBUTING FACTORS", margin, y);
  y += 3;

  doc.setDrawColor(...COLORS.amber);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 50, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  if (data.contributingFactors && data.contributingFactors.length > 0) {
    data.contributingFactors.forEach((f: any) => {
      const name = (f.symptom || f.factor || "Unknown").replace(/_/g, " ");
      const pct = f.percentage || f.contribution_percentage || 0;

      // Draw mini progress bar
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin, y - 2, contentWidth, 8, 1.5, 1.5, "F");

      const barWidth = Math.min((pct / 100) * contentWidth, contentWidth);
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(margin, y - 2, barWidth, 8, 1.5, 1.5, "F");

      doc.setTextColor(...COLORS.white);
      doc.setFontSize(7);
      doc.text(`${name}: ${Math.round(pct)}%`, margin + 3, y + 2.5);

      y += 11;
    });
  }

  y += 5;

  // ====== 3D ANATOMICAL INSIGHTS ======
  if (data.sceneImage) {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3D ANATOMICAL RISK MAPPING", margin, y);
    y += 3;

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 50, y);
    y += 7;

    doc.addImage(data.sceneImage, "JPEG", margin, y, contentWidth, 60);
    y += 65;
  }

  // ====== DETAILED ANALYSIS ======
  if (data.explanation) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DETAILED ANALYSIS", margin, y);
    y += 3;

    doc.setDrawColor(...COLORS.green);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 50, y);
    y += 7;

    // Clean markdown from explanation
    const cleanText = data.explanation
      .replace(/[#*]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/---/g, "");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const lines = doc.splitTextToSize(cleanText, contentWidth);
    for (const line of lines) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 4;
    }
  }

  // ====== RECOMMENDATIONS (Page 2 if needed) ======
  if (data.recommendations && data.recommendations.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    y += 5;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONALIZED RECOMMENDATIONS", margin, y);
    y += 3;

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 50, y);
    y += 7;

    data.recommendations.forEach((rec: any, i: number) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }

      const priorityColor = rec.priority === "urgent" ? COLORS.red
        : rec.priority === "high" ? COLORS.amber
        : COLORS.green;

      doc.setFillColor(...priorityColor);
      doc.circle(margin + 2.5, y - 1, 1.5, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(`${rec.action}`, margin + 8, y);
      y += 5;

      if (rec.detail) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        const detailLines = doc.splitTextToSize(rec.detail, contentWidth - 10);
        detailLines.forEach((dl: string) => {
          doc.text(dl, margin + 8, y);
          y += 3.5;
        });
      }

      y += 3;
    });
  }

  // ====== RED FLAG ALERTS ======
  if (data.redFlags && data.redFlags.length > 0) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }

    y += 5;
    doc.setFillColor(255, 240, 240);
    doc.roundedRect(margin, y, contentWidth, 6 + data.redFlags.length * 6, 2, 2, "F");

    doc.setTextColor(...COLORS.red);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("🚨 EMERGENCY RED FLAGS DETECTED", margin + 5, y + 5);
    y += 10;

    data.redFlags.forEach((flag) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${flag.replace(/_/g, " ")}`, margin + 8, y);
      y += 5;
    });

    y += 5;
  }

  // ====== FOOTER — DISCLAIMER ======
  const addFooter = (pageNum: number) => {
    const totalPages = doc.getNumberOfPages();
    doc.setPage(pageNum);

    // Footer bar
    doc.setFillColor(240, 240, 245);
    doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      "DISCLAIMER: This report is generated by AetherDx AI Engine v2.0 and is for informational purposes only. It is NOT a medical diagnosis.",
      margin,
      pageHeight - 13
    );
    doc.text(
      "Always consult a qualified healthcare professional for proper evaluation and treatment.",
      margin,
      pageHeight - 9
    );
    doc.text(
      `AetherDx AI — Predict. Prevent. Personalize. | Page ${pageNum}/${totalPages}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: "right" }
    );
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    addFooter(i);
  }

  // Save
  doc.save(`AetherDx_Health_Report_${now.toISOString().split("T")[0]}.pdf`);
}
