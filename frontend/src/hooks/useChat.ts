"use client";

import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "ai" | "follow_up" | "chat";
  content?: string;
  predictions?: any[];
  riskTier?: string;
  riskProbability?: number;
  riskCondition?: string;
  modelAgreement?: string;
  contributingFactors?: any[];
  explanation?: string;
  riskTrend?: any[];
  followUpQuestions?: any[];
  isStreaming?: boolean;
  suggestions?: string[];
  // Adaptive intelligence fields
  adaptiveScore?: any;
  personalizedRecommendations?: any[];
  lifestyleAssessment?: any;
  behavioralDrift?: any;
  abhaReport?: any;
  edgeReadiness?: any;
  sessionLearning?: any;
  // File attachment
  attachedFileName?: string;
  attachedFileType?: string;
}

const API_URL = ""; // Relative paths will use the current domain on Vercel

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [severity, setSeverity] = useState("moderate");
  const [duration, setDuration] = useState("weeks");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const sendMessage = useCallback(
    async (text: string, file?: File | null) => {
      if ((!text.trim() && !file) || isLoading) return;

      setChatStarted(true);
      setIsLoading(true);

      const fileToSend = file || attachedFile;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
        attachedFileName: fileToSend?.name,
        attachedFileType: fileToSend?.type,
      };
      setMessages((prev) => [...prev, userMsg]);
      setAttachedFile(null); // Clear after use

      const aiMsgId = generateId();

      try {
        let data: any;

        if (fileToSend) {
          // Use multipart FormData for file uploads
          const formData = new FormData();
          formData.append("message", text);
          formData.append("severity", severity);
          formData.append("duration", duration);
          formData.append("session_id", "default");
          formData.append("file", fileToSend);

          const response = await fetch(`${API_URL}/api/predict/upload`, {
            method: "POST",
            body: formData,
          });
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          data = await response.json();
        } else {
          // Normal JSON request
          const response = await fetch(`${API_URL}/api/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              severity,
              duration,
              stream: false,
              session_id: "default",
            }),
          });
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          data = await response.json();
        }

        if (data.type === "chat") {
          const aiMsg: Message = {
            id: aiMsgId,
            role: "chat",
            explanation: data.message,
            isStreaming: false,
            adaptiveScore: data.adaptive_score,
            sessionLearning: data.session_learning,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else if (data.type === "prediction") {
          const aiMsg: Message = {
            id: aiMsgId,
            role: "ai",
            predictions: data.predictions,
            riskTier: data.primary_risk_tier,
            riskProbability: data.primary_probability,
            riskCondition: data.primary_prediction,
            modelAgreement: data.model_agreement,
            contributingFactors: data.contributing_factors,
            explanation: data.explanation,
            riskTrend: data.risk_trend,
            isStreaming: false,
            // Adaptive intelligence
            adaptiveScore: data.adaptive_score,
            personalizedRecommendations: data.personalized_recommendations,
            lifestyleAssessment: data.lifestyle_assessment,
            behavioralDrift: data.behavioral_drift,
            abhaReport: data.abha_report,
            edgeReadiness: data.edge_readiness,
            sessionLearning: data.session_learning,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else if (data.type === "follow_up") {
          const aiMsg: Message = {
            id: aiMsgId,
            role: "follow_up",
            content: data.message,
            suggestions: data.suggestions,
            followUpQuestions: data.follow_up_questions,
            isStreaming: false,
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } catch (err: any) {
        console.error("Chat error:", err);
        const errorMsg: Message = {
          id: aiMsgId,
          role: "chat",
          explanation:
            "I apologize, but I'm unable to connect to the analysis engine. Please ensure the backend server is running on port 8000 and try again.",
          isStreaming: false,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, severity, duration, attachedFile]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setChatStarted(false);
    setSeverity("moderate");
    setDuration("weeks");
    setAttachedFile(null);
  }, []);

  const handleFollowUp = useCallback((type: string, value: string) => {
    if (type === "severity") setSeverity(value);
    else if (type === "duration") setDuration(value);
  }, []);

  const sendFeedback = useCallback(async (isPositive: boolean, comment: string = "") => {
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "default",
          is_positive: isPositive,
          comment,
        }),
      });
    } catch (err) {
      console.error("Feedback error:", err);
    }
  }, []);

  return {
    messages,
    isLoading,
    chatStarted,
    severity,
    duration,
    attachedFile,
    sendMessage,
    clearChat,
    handleFollowUp,
    setSeverity,
    setDuration,
    setAttachedFile,
    sendFeedback,
  };
}

