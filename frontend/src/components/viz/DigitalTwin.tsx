"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface DataPoint {
  day: number;
  risk_percentage: number;
  label: string;
}

interface DigitalTwinProps {
  data: DataPoint[];
  condition: string;
}

export default function DigitalTwin({ data, condition }: DigitalTwinProps) {
  const [lifestyle, setLifestyle] = useState<"current" | "improved">("current");
  
  // Calculate simulated improved data
  const simulatedData = data.map((d, index) => {
    if (lifestyle === "current") return d;
    
    // Gradual risk reduction for improved lifestyle
    const reductionFactor = index === 0 ? 1 : 1 - (0.015 * index); // Up to ~45% reduction over 30 days
    return {
      ...d,
      risk_percentage: Math.max(10, Math.round(d.risk_percentage * reductionFactor))
    };
  });

  const maxRisk = Math.max(...simulatedData.map((d) => d.risk_percentage));
  const getColor = (risk: number) => {
    if (risk >= 60) return "#EF4444";
    if (risk >= 30) return "#F59E0B";
    return "#22C55E";
  };

  const lineColor = getColor(maxRisk);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-xl p-5"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[#A0A0A0]">
          Digital Twin Future Simulation — {condition}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-md transition-colors"
          style={{ background: `${lineColor}15`, color: lineColor }}
        >
          {lifestyle === "current" ? "Expected Path" : "Mitigated Path"}
        </span>
      </div>

      <div className="h-44 mb-4">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={simulatedData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <defs>
              <linearGradient id="riskGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#666" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#666" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#E0E0E0",
              }}
              formatter={(value: any) => [`${value}%`, "Simulated Risk"]}
            />
            <Area
              type="monotone"
              dataKey="risk_percentage"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#riskGradient2)"
              dot={false}
              activeDot={{
                r: 4,
                fill: lineColor,
                stroke: "#0D0D0D",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 mt-2 bg-[#1A1A1A] p-1 rounded-lg border border-white/5">
        <button 
          onClick={() => setLifestyle("current")}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            lifestyle === "current" 
              ? "bg-[#2A2A2A] text-white shadow-sm" 
              : "text-[#666] hover:text-[#AAA]"
          }`}
        >
          Current Path
        </button>
        <button 
          onClick={() => setLifestyle("improved")}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            lifestyle === "improved" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm" 
              : "text-[#666] hover:text-[#AAA]"
          }`}
        >
          Improved Lifestyle (-30 Days)
        </button>
      </div>

      <p className="text-[11px] text-[#555] mt-4 italic text-center">
        {lifestyle === "current" 
          ? "* Based on current habits. Without change, risk trend will persist." 
          : "* Sustained intervention significantly reduces risk trajectories."}
      </p>
    </motion.div>
  );
}
