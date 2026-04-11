"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import RiskIndicator from "../viz/RiskIndicator";
import ConfidenceBars from "../viz/ConfidenceBars";
import FeatureImportance from "../viz/FeatureImportance";
import DigitalTwin from "../viz/DigitalTwin";
import AdaptiveScore from "../viz/AdaptiveScore";
import HealthAutopilot from "../viz/HealthAutopilot";
import DriftIndicator from "../viz/DriftIndicator";
import SystemBadges from "../viz/SystemBadges";
import ExportReport from "../viz/ExportReport";
import EmergencyIntelligence from "../viz/EmergencyIntelligence";
import RiskTrendGraph from "../viz/RiskTrendGraph";
import AnatomicalModel3D from "../viz/AnatomicalModel3D";

interface Prediction {
  condition: string;
  probability: number;
  risk_tier: string;
  risk_color: string;
}

interface ContributingFactor {
  symptom: string;
  percentage: number;
  contribution: number;
}

interface RiskTrendPoint {
  day: number;
  risk_percentage: number;
  label: string;
}

interface AIMessageProps {
  predictions?: Prediction[];
  riskTier?: string;
  riskProbability?: number;
  riskCondition?: string;
  modelAgreement?: string;
  contributingFactors?: ContributingFactor[];
  explanation?: string;
  riskTrend?: RiskTrendPoint[];
  isStreaming?: boolean;
  index: number;
  // Adaptive intelligence
  adaptiveScore?: any;
  personalizedRecommendations?: any[];
  behavioralDrift?: any;
  abhaReport?: any;
  edgeReadiness?: any;
  sessionLearning?: any;
  onFeedback?: (isPositive: boolean) => void;
}

export default function AIMessage({
  predictions,
  riskTier,
  riskProbability,
  riskCondition,
  modelAgreement,
  contributingFactors,
  explanation,
  riskTrend,
  isStreaming,
  index,
  adaptiveScore,
  personalizedRecommendations,
  behavioralDrift,
  abhaReport,
  edgeReadiness,
  sessionLearning,
  onFeedback,
}: AIMessageProps) {
  const hasPrediction = riskTier && riskProbability !== undefined && riskCondition;
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [sceneImage, setSceneImage] = useState<string>("");
  const [triggerScreenshot, setTriggerScreenshot] = useState<boolean>(false);

  useEffect(() => {
    if (hasPrediction) {
      const timer = setTimeout(() => setTriggerScreenshot(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasPrediction]);

  const handleFeedbackClick = (isPositive: boolean) => {
    if (feedback) return;
    setFeedback(isPositive ? "up" : "down");
    onFeedback?.(isPositive);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="flex justify-start mb-8"
    >
      <div className="message-bubble ai w-full max-w-full md:max-w-[95%] lg:max-w-[90%] space-y-6">
        {/* AI Avatar + Label */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center">
            <span className="text-xs">✴</span>
          </div>
          <span className="text-xs font-medium text-[#A0A0A0] tracking-wide uppercase">
            AetherDx AI Engine
          </span>
          {isStreaming && (
            <span className="animate-typing-cursor text-[#6366F1] text-sm ml-1">●</span>
          )}
          {sessionLearning?.detail_level === "detailed" && (
            <span className="ml-auto text-[9px] text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded-full">
              Deep Analysis
            </span>
          )}
        </div>

        {/* Drift Warning (if detected) */}
        {behavioralDrift && behavioralDrift.detected && (
          <DriftIndicator drift={behavioralDrift} />
        )}

        {/* Adaptive Health Score + Risk Indicator (side by side) */}
        {hasPrediction && adaptiveScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AdaptiveScore data={adaptiveScore} />
            <RiskIndicator
              tier={riskTier!}
              probability={riskProbability!}
              condition={riskCondition!}
              modelAgreement={modelAgreement}
            />
          </motion.div>
        )}

        {/* Fallback for non-adaptive predictions */}
        {hasPrediction && !adaptiveScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <RiskIndicator
              tier={riskTier!}
              probability={riskProbability!}
              condition={riskCondition!}
              modelAgreement={modelAgreement}
            />
          </motion.div>
        )}

        {/* Confidence Bars */}
        {predictions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              Condition Analysis
            </h3>
            <ConfidenceBars predictions={predictions} />
          </motion.div>
        )}

        {/* Contributing Factors */}
        {contributingFactors && contributingFactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              Explainable AI — Key Factors
            </h3>
            <FeatureImportance factors={contributingFactors} />
          </motion.div>
        )}

        {/* Emergency Intelligence — v2.0 3-tier system */}
        {hasPrediction && (
          <EmergencyIntelligence
            riskTier={riskTier}
            explanation={explanation}
            redFlags={adaptiveScore?.detected_red_flags}
            riskScore={adaptiveScore?.score}
          />
        )}

        {/* Explanation Text */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="ai-content"
          >
            {renderMarkdown(explanation)}
          </motion.div>
        )}

        {/* Health Autopilot — Dynamic Action Plan (replaces static PersonalizedRecs) */}
        {personalizedRecommendations && personalizedRecommendations.length > 0 && (
          <HealthAutopilot
            recommendations={personalizedRecommendations}
            score={adaptiveScore?.health_score}
          />
        )}

        {/* Risk Trend — Dynamic Session History */}
        {hasPrediction && adaptiveScore && (
          <RiskTrendGraph
            riskHistory={adaptiveScore.risk_history || (behavioralDrift?.risk_trend) || []}
            interactionCount={adaptiveScore.interaction_count}
          />
        )}

        {/* Digital Twin - Risk Trend */}
        {riskTrend && riskTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              Pre-Symptomatic 30-Day Projection
            </h3>
            <DigitalTwin data={riskTrend} condition={riskCondition || ""} />
          </motion.div>
        )}

        {/* Desktop / Large Screen 3D Anatomical Analysis */}
        {hasPrediction && riskCondition && riskTier && (
           <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
           >
             <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
               AI-Driven Anatomical Risk Mapping
             </h3>
             <AnatomicalModel3D
               condition={riskCondition}
               riskTier={riskTier}
               probability={riskProbability || 0}
               contributingFactors={contributingFactors || []}
               triggerScreenshot={triggerScreenshot}
               onScreenshotReady={setSceneImage}
             />
           </motion.div>
        )}

        {/* Export + System Badges */}
        {hasPrediction && predictions && contributingFactors && explanation && (
          <ExportReport
            predictions={predictions}
            condition={riskCondition!}
            probability={riskProbability!}
            riskTier={riskTier!}
            contributingFactors={contributingFactors}
            explanation={explanation}
            adaptiveScore={adaptiveScore}
            recommendations={personalizedRecommendations}
            sceneImage={sceneImage}
          />
        )}

        {/* ABHA + Edge Readiness Badges */}
        {(abhaReport || edgeReadiness) && (
          <SystemBadges abhaReport={abhaReport} edgeReadiness={edgeReadiness} />
        )}

        {/* Self-Learning Feedback UI */}
        {!isStreaming && explanation && (
          <div className="pt-2 mt-2 border-t border-white/5 flex items-center gap-3">
            <span className="text-[10px] text-[#666] uppercase tracking-wider">
              Was this helpful?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleFeedbackClick(true)}
                disabled={feedback !== null}
                className={`p-1.5 rounded-full transition-all ${
                  feedback === "up" ? "bg-[#22C55E]/20 text-[#22C55E]" : "text-[#555] hover:text-[#A0A0A0] hover:bg-white/5"
                }`}
                title="Helpful"
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => handleFeedbackClick(false)}
                disabled={feedback !== null}
                className={`p-1.5 rounded-full transition-all ${
                  feedback === "down" ? "bg-[#EF4444]/20 text-[#EF4444]" : "text-[#555] hover:text-[#A0A0A0] hover:bg-white/5"
                }`}
                title="Not helpful"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
            {feedback && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-[#A0A0A0] ml-2"
              >
                Thanks for your response!
              </motion.span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Enhanced markdown renderer */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let isOrdered = false;
  let tableRows: string[][] = [];
  let inTable = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag key={`list-${elements.length}`} className={isOrdered ? "list-decimal" : "list-disc"}>
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1).filter(
        row => !row.every(cell => /^[-:]+$/.test(cell.trim()))
      );
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto rounded-lg border border-white/5 my-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {headerRow.map((cell, i) => (
                  <th key={i} className="px-3 py-2 text-left text-[#A0A0A0] font-semibold bg-white/[0.02]">
                    {renderInline(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="border-b border-white/5 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-[#C0C0C0]">
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      inTable = true;
      tableRows.push(trimmed.slice(1, -1).split("|"));
      return;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={i}>{renderInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={i}>{renderInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.includes("Health Report") || trimmed.includes("Health Analysis Report")) {
      flushList();
      elements.push(
        <div key={i} className="flex items-center gap-3 pb-3 mt-2 mb-4 border-b border-white/10">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-lg shadow-[0_0_15px_rgba(99,102,241,0.3)]">🧠</div>
           <h2 className="text-xl font-bold text-white m-0 p-0 border-0">{renderInline(trimmed.replace("🧠", "").trim())}</h2>
        </div>
      );
    } else if (trimmed.startsWith("• ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-[#818CF8] flex items-center gap-2 mt-4 mb-2 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
          {renderInline(trimmed.slice(2))}
        </h3>
      );
    } else if (trimmed.startsWith("🏡 Home Remedies:")) {
      flushList();
      elements.push(
        <div key={i} className="flex items-center gap-3 pb-2 mt-6 mb-3 border-b border-white/5">
           <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#22C55E] to-[#4ADE80] flex items-center justify-center text-base shadow-[0_0_15px_rgba(34,197,94,0.2)]">🌿</div>
           <h3 className="text-lg font-bold text-white m-0 p-0">{renderInline("Home Remedies")}</h3>
        </div>
      );
    } else if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(<blockquote key={i}>{renderInline(trimmed.slice(2))}</blockquote>);
    } else if (trimmed.match(/^\d+\.\s/)) {
      isOrdered = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      isOrdered = false;
      listItems.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={i}>{renderInline(trimmed)}</p>);
    }
  });

  flushList();
  flushTable();
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-[#818CF8] text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
