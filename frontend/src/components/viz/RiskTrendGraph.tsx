"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface RiskTrendGraphProps {
  riskHistory?: number[];
  interactionCount?: number;
}

export default function RiskTrendGraph({ riskHistory = [], interactionCount = 0 }: RiskTrendGraphProps) {
  const [view, setView] = useState<"session" | "projected">("session");

  // Build data from actual risk history or use defaults
  const sessionData = riskHistory.length > 0
    ? riskHistory.map((score, i) => ({
        label: `#${i + 1}`,
        score: Math.round(score),
      }))
    : [
        { label: "Start", score: 50 },
      ];

  // Projected 30-day trend based on last known score
  const lastScore = riskHistory.length > 0 ? riskHistory[riskHistory.length - 1] : 50;
  const projectedData = [
    { label: "Today", score: Math.round(lastScore) },
    { label: "Day 7", score: Math.round(lastScore * 0.95) },
    { label: "Day 14", score: Math.round(lastScore * 0.88) },
    { label: "Day 21", score: Math.round(lastScore * 0.78) },
    { label: "Day 30", score: Math.round(lastScore * 0.65) },
  ];

  const chartData = view === "session" ? sessionData : projectedData;

  // Calculate trend
  let trendPct = 0;
  let trendDir: "improving" | "worsening" | "stable" = "stable";
  if (riskHistory.length >= 2) {
    const first = riskHistory[0];
    const last = riskHistory[riskHistory.length - 1];
    trendPct = Math.round(((last - first) / Math.max(first, 1)) * 100);
    trendDir = trendPct < -3 ? "improving" : trendPct > 3 ? "worsening" : "stable";
  }

  const trendColor = trendDir === "improving" ? "#22C55E" : trendDir === "worsening" ? "#EF4444" : "#F59E0B";
  const TrendIcon = trendDir === "improving" ? TrendingDown : trendDir === "worsening" ? TrendingUp : Minus;
  const chartColor = trendDir === "worsening" ? "#EF4444" : trendDir === "improving" ? "#22C55E" : "#F59E0B";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5 mb-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity size={16} className="text-[#F59E0B]" />
          Risk Trend Analysis
        </h3>
        <div className="flex items-center gap-2">
          {riskHistory.length >= 2 && (
            <span
              className="text-[10px] font-medium px-2 py-1 rounded border flex items-center gap-1"
              style={{ 
                background: `${trendColor}15`, 
                color: trendColor,
                borderColor: `${trendColor}30`,
              }}
            >
              <TrendIcon size={10} />
              {Math.abs(trendPct)}% {trendDir === "improving" ? "Improvement" : trendDir === "worsening" ? "Increase" : "Stable"}
            </span>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-3 bg-[#1A1A1A] p-0.5 rounded-lg border border-white/5 w-fit">
        <button
          onClick={() => setView("session")}
          className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
            view === "session"
              ? "bg-[#2A2A2A] text-white shadow-sm"
              : "text-[#666] hover:text-[#AAA]"
          }`}
        >
          Session ({interactionCount || riskHistory.length} queries)
        </button>
        <button
          onClick={() => setView("projected")}
          className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
            view === "projected"
              ? "bg-[#2A2A2A] text-white shadow-sm"
              : "text-[#666] hover:text-[#AAA]"
          }`}
        >
          30-Day Projection
        </button>
      </div>

      <div className="h-32 mt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <defs>
              <linearGradient id="riskTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#666" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#555" }}
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
                fontSize: "11px",
                color: "#E0E0E0",
              }}
              formatter={(value: any) => [`${value}%`, "Risk Score"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={chartColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#riskTrendGrad)"
              dot={{ r: 3, fill: chartColor, stroke: "#0D0D0D", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: chartColor, stroke: "#0D0D0D", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-[#555] text-center mt-2 italic">
        {view === "session"
          ? `Risk scores across ${riskHistory.length || 1} interaction${riskHistory.length !== 1 ? "s" : ""} in this session.`
          : "Projected improvement with sustained lifestyle intervention and medical guidance."}
      </p>
    </motion.div>
  );
}
