"use client";

import { motion } from "framer-motion";
import { Thermometer, Heart, Wind, Activity } from "lucide-react";
import type { VitalsData } from "@/hooks/useAssessment";

interface FormVitalsProps {
  vitals: VitalsData;
  onVitalChange: (field: keyof VitalsData, value: number | null) => void;
}

function getSeverityColor(value: number | null, low: number, high: number): string {
  if (value === null) return "#333";
  if (value < low || value > high) return "#EF4444";
  return "#22C55E";
}

function VitalCard({
  icon: Icon, label, unit, value, onChange, color, subtitle, min, max, step,
}: {
  icon: any; label: string; unit: string; value: number | null;
  onChange: (v: number | null) => void; color: string; subtitle?: string;
  min?: number; max?: number; step?: number;
}) {
  const isOutOfRange = value !== null && min !== undefined && max !== undefined && (value < min || value > max);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 transition-all"
      style={{ background: `${color}08`, border: `1px solid ${color}25` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#C0C0C0]">{label}</p>
          {subtitle && <p className="text-[9px] text-[#555]">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={e => {
            const v = e.target.value;
            onChange(v === "" ? null : parseFloat(v));
          }}
          placeholder="—"
          className={`w-full bg-black/30 rounded-xl px-3 py-2.5 text-lg font-bold text-white outline-none transition-all text-center ${isOutOfRange ? 'border-2 border-red-500/60' : 'border border-white/5 focus:border-[#6366F1]/40'}`}
          style={{ color: isOutOfRange ? '#EF4444' : (value !== null ? color : "#555") }}
        />
        <span className="text-xs text-[#555] font-medium whitespace-nowrap">{unit}</span>
      </div>
      {isOutOfRange && (
        <p className="text-[9px] text-red-400 mt-1 text-center">Valid range: {min}–{max}{unit}</p>
      )}
    </motion.div>
  );
}

export default function FormVitals({ vitals, onVitalChange }: FormVitalsProps) {
  const tempColor = getSeverityColor(vitals.temperature_f, 96, 100.4);
  const hrColor = getSeverityColor(vitals.heart_rate, 60, 100);
  const spo2Color = vitals.spo2 !== null ? (vitals.spo2 < 95 ? "#EF4444" : "#22C55E") : "#333";
  const bpColor = vitals.bp_systolic !== null
    ? (vitals.bp_systolic >= 140 ? "#EF4444" : vitals.bp_systolic >= 130 ? "#F59E0B" : "#22C55E")
    : "#333";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          Vital Signs
        </h3>
        <p className="text-[11px] text-[#555] mb-4">Enter any measurements you have available</p>
        <div className="grid grid-cols-2 gap-3">
          <VitalCard
            icon={Thermometer} label="Temperature" unit="°F"
            value={vitals.temperature_f} onChange={v => onVitalChange("temperature_f", v)}
            color={tempColor} subtitle="Normal: 97–99°F" min={90} max={115} step={0.1}
          />
          <VitalCard
            icon={Heart} label="Heart Rate" unit="bpm"
            value={vitals.heart_rate} onChange={v => onVitalChange("heart_rate", v)}
            color={hrColor} subtitle="Normal: 60–100" min={20} max={250}
          />
          <VitalCard
            icon={Wind} label="SpO2" unit="%"
            value={vitals.spo2} onChange={v => onVitalChange("spo2", v)}
            color={spo2Color} subtitle="Normal: 95–100%" min={50} max={100}
          />

          {/* Blood Pressure inline */}
          <div className="rounded-2xl p-4 transition-all"
            style={{ background: `${bpColor}08`, border: `1px solid ${bpColor}25` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${bpColor}15` }}>
                <Activity size={16} color={bpColor} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#C0C0C0]">Blood Pressure</p>
                <p className="text-[9px] text-[#555]">Normal: 120/80 mmHg</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <input type="number" value={vitals.bp_systolic ?? ""}
                onChange={e => onVitalChange("bp_systolic", e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="SYS"
                className="w-1/2 bg-black/30 rounded-xl px-2 py-2.5 text-lg font-bold outline-none border border-white/5 focus:border-[#6366F1]/40 text-center transition-all"
                style={{ color: vitals.bp_systolic !== null ? bpColor : "#555" }} />
              <span className="text-[#555] font-bold">/</span>
              <input type="number" value={vitals.bp_diastolic ?? ""}
                onChange={e => onVitalChange("bp_diastolic", e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="DIA"
                className="w-1/2 bg-black/30 rounded-xl px-2 py-2.5 text-lg font-bold outline-none border border-white/5 focus:border-[#6366F1]/40 text-center transition-all"
                style={{ color: vitals.bp_diastolic !== null ? bpColor : "#555" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
