"use client";

import jsPDF from "jspdf";
import type { ABHAPrediction } from "@/hooks/useABHA";

/**
 * Generate a downloadable PDF health report from ABHA prediction data.
 * Uses jsPDF for structured clinical report format.
 */
export function generateABHAReport(prediction: ABHAPrediction) {
  const doc = new jsPDF();
  const { prediction: pred, shap_explanation, fhir_summary, data_source, risk_flags, recommendations, trend_analysis, model_info } = prediction;
  const topPred = pred?.predictions?.[0];
  const score = topPred?.probability || 0;
  const tier = topPred?.risk_tier || "LOW";
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  let y = 15;

  // ── Header ──
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, 210, 40, "F");

  doc.setFillColor(99, 102, 241);
  doc.roundedRect(15, y, 8, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("AetherDx AI — Health Intelligence Report", 28, y + 6);

  y += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(`ABDM Compliant · Generated: ${now}`, 28, y + 3);
  doc.text("ABHA-Enhanced · Consent-Based Access", 28, y + 8);

  y += 18;

  // ── Divider ──
  doc.setDrawColor(50, 50, 50);
  doc.line(15, y, 195, y);
  y += 8;

  // ── Risk Assessment ──
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RISK ASSESSMENT", 15, y);
  y += 8;

  const riskColor: [number, number, number] =
    tier === "HIGH" ? [239, 68, 68] :
    tier === "MODERATE" ? [245, 158, 11] :
    [34, 197, 94];

  doc.setFillColor(...riskColor);
  doc.roundedRect(15, y, 50, 25, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${Math.round(score)}%`, 30, y + 14);
  doc.setFontSize(8);
  doc.text(`${tier} RISK`, 30, y + 20);

  // Primary finding
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Primary Finding:", 75, y + 8);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(topPred?.condition || "Healthy", 75, y + 16);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Model Agreement: ${pred?.model_agreement || "N/A"}`, 75, y + 22);

  y += 32;

  // ── Other predictions ──
  if (pred?.predictions?.length > 1) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Other Conditions Assessed:", 15, y);
    y += 5;
    pred.predictions.slice(1, 4).forEach((p: any) => {
      doc.setTextColor(180, 180, 180);
      doc.text(`  • ${p.condition}: ${p.probability}% (${p.risk_tier})`, 15, y);
      y += 4.5;
    });
    y += 3;
  }

  // ── Divider ──
  doc.setDrawColor(50, 50, 50);
  doc.line(15, y, 195, y);
  y += 8;

  // ── Data Sources ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DATA SOURCES", 15, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  const sources = [
    `Lab Records: ${data_source.abha_records}`,
    `Conditions: ${data_source.conditions}`,
    `Medications: ${data_source.medications}`,
    `Diagnostic Reports: ${data_source.diagnostic_reports || 0}`,
    `Time-Series Features: ${data_source.time_series_features || 0}`,
  ];
  sources.forEach((s) => {
    doc.text(`  • ${s}`, 15, y);
    y += 4.5;
  });
  y += 3;

  // ── Clinical Alerts ──
  if (fhir_summary?.alerts?.length) {
    doc.setDrawColor(50, 50, 50);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("⚠ CLINICAL ALERTS", 15, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 150, 150);
    fhir_summary.alerts.forEach((alert) => {
      doc.text(`  • ${alert}`, 15, y);
      y += 4.5;
    });
    y += 3;
  }

  // ── Explainable AI ──
  if (shap_explanation?.contributions?.length) {
    doc.setDrawColor(50, 50, 50);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(129, 140, 248);
    doc.text("EXPLAINABLE AI — Contributing Factors", 15, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    shap_explanation.contributions.slice(0, 6).forEach((c: any) => {
      const arrow = c.direction === "increases_risk" ? "↑" : "↓";
      const col: [number, number, number] = c.direction === "increases_risk" ? [239, 130, 130] : [130, 200, 130];
      doc.setTextColor(...col);
      doc.text(`  ${arrow} ${c.feature}: SHAP impact ${c.shap_value?.toFixed(3) || "N/A"}`, 15, y);
      y += 4.5;
    });
    y += 3;
  }

  // ── Risk Flags ──
  if (risk_flags?.length) {
    doc.setDrawColor(50, 50, 50);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11);
    doc.text("RISK FLAGS", 15, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 180, 100);
    const flagText = risk_flags.map((f) => f.replace(/_/g, " ")).join(", ");
    const splitFlags = doc.splitTextToSize(flagText, 170);
    doc.text(splitFlags, 15, y);
    y += splitFlags.length * 4.5 + 3;
  }

  // ── Recommendations ──
  if (recommendations?.length && y < 250) {
    doc.setDrawColor(50, 50, 50);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text("PREVENTIVE RECOMMENDATIONS", 15, y);
    y += 7;

    recommendations.slice(0, 3).forEach((rec: any) => {
      if (y > 270) return;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 220, 220);
      doc.text(`${rec.icon} ${rec.title} [${rec.urgency}]`, 15, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 160);
      rec.actions.slice(0, 3).forEach((action: string) => {
        if (y > 275) return;
        doc.text(`    • ${action}`, 15, y);
        y += 4;
      });
      y += 2;
    });
  }

  // ── Footer ──
  doc.setDrawColor(50, 50, 50);
  doc.line(15, 280, 195, 280);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("This report is generated by AetherDx AI Engine and is for informational purposes only.", 15, 284);
  doc.text("It should not be used as a substitute for professional medical advice. Consult a healthcare provider.", 15, 288);
  doc.text(`Model: ${model_info?.primary_model || "ML Engine"} | ABDM Compliant | ${now}`, 15, 292);

  // Save
  const filename = `AetherDx_Health_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
