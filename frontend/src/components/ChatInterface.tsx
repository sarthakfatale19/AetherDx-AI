"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Paperclip, Loader2, Sparkles, Globe, X, FileText, Image as ImageIcon } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import HeroScreen from "./HeroScreen";
import UserMessage from "./messages/UserMessage";
import AIMessage from "./messages/AIMessage";
import FollowUpQuestion from "./messages/FollowUpQuestion";

export default function ChatInterface() {
  const {
    messages,
    isLoading,
    chatStarted,
    sendMessage,
    handleFollowUp,
    sendFeedback,
    attachedFile,
    setAttachedFile,
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const langPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isListening, isSupported,
    confidence, language, toggleListening, changeLanguage, supportedLanguages
  } = useVoiceInput({
    onVoiceText: (text) => setInputValue(text),
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close language picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) {
        setShowLangPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage(text);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload an image (JPG, PNG) or PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be under 20MB.');
      return;
    }
    setAttachedFile(file);
    e.target.value = ''; // Reset so same file can be re-selected
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleFollowUpSelect = (questionId: string, value: string) => {
    handleFollowUp(questionId, value);
    const labels: Record<string, Record<string, string>> = {
      severity: {
        mild: "My symptoms are mild — noticeable but manageable",
        moderate: "My symptoms are moderate — affecting daily activities",
        severe: "My symptoms are severe — significantly impacting my life",
      },
      duration: {
        days: "I've had these symptoms for a few days",
        weeks: "I've had these symptoms for several weeks",
        months: "I've had these symptoms for months",
      },
    };
    const msg = labels[questionId]?.[value] || value;
    sendMessage(msg);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const currentLang = supportedLanguages.find(l => l.code === language);

  return (
    <div className="flex flex-col h-screen relative">
      {/* Chat Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!chatStarted ? (
            <motion.div
              key="hero"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <HeroScreen onSuggestionClick={handleSuggestionClick} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto px-4 pt-6 pb-44"
            >
              {/* Chat Header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
                <span className="text-sm font-medium text-[#A0A0A0]">
                  Health Risk Analysis
                </span>
                <span className="text-xs text-[#444] ml-auto">
                  AetherDx AI Engine v1.0
                </span>
              </motion.div>

              {/* Messages */}
              {messages.map((msg, i) => {
                if (msg.role === "user") {
                  return (
                    <UserMessage
                      key={msg.id}
                      content={msg.content || ""}
                      index={i}
                    />
                  );
                }

                if (msg.role === "follow_up" && msg.followUpQuestions) {
                  return (
                    <div key={msg.id}>
                      {msg.content && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start mb-3"
                        >
                          <div className="message-bubble ai">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center">
                                <span className="text-[10px]">✴</span>
                              </div>
                              <span className="text-xs text-[#A0A0A0] uppercase tracking-wide font-medium">
                                AetherDx AI
                              </span>
                            </div>
                            <p className="text-sm text-[#C0C0C0]">{msg.content}</p>
                            {msg.suggestions && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {msg.suggestions.map((s: string) => (
                                  <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
                                    className="chip text-xs"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {msg.followUpQuestions.map((q: any) => (
                        <FollowUpQuestion
                          key={q.id}
                          question={q.question}
                          type={q.type}
                          options={q.options}
                          onSelect={(val) => handleFollowUpSelect(q.id, val)}
                        />
                      ))}
                    </div>
                  );
                }

                // Conversational Q&A response
                if (msg.role === "chat") {
                  return (
                    <AIMessage
                      key={msg.id}
                      explanation={msg.explanation}
                      isStreaming={msg.isStreaming}
                      index={i}
                      onFeedback={(isPos: boolean) => sendFeedback(isPos)}
                    />
                  );
                }

                // AI prediction with full intelligence dashboard
                return (
                  <AIMessage
                    key={msg.id}
                    predictions={msg.predictions}
                    riskTier={msg.riskTier}
                    riskProbability={msg.riskProbability}
                    riskCondition={msg.riskCondition}
                    modelAgreement={msg.modelAgreement}
                    contributingFactors={msg.contributingFactors}
                    explanation={msg.explanation}
                    riskTrend={msg.riskTrend}
                    isStreaming={msg.isStreaming}
                    index={i}
                    adaptiveScore={msg.adaptiveScore}
                    personalizedRecommendations={msg.personalizedRecommendations}
                    behavioralDrift={msg.behavioralDrift}
                    abhaReport={msg.abhaReport}
                    edgeReadiness={msg.edgeReadiness}
                    sessionLearning={msg.sessionLearning}
                    onFeedback={(isPos: boolean) => sendFeedback(isPos)}
                  />
                );
              })}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-4"
                >
                  <div className="message-bubble ai flex items-center gap-3 py-4">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center">
                      <span className="text-[10px]">✴</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[#6366F1]"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#666]">Running adaptive analysis...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-[68px] right-0 z-40" style={{ background: "rgba(13,13,13,0.98)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Fade gradient above bar */}
        <div className="absolute inset-x-0 -top-10 h-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(13,13,13,0.98))" }} />
        <div className="max-w-3xl mx-auto px-4 pb-5 pt-3">
          {/* No background fade needed — parent is already opaque */}

          <motion.div
            className="glass-input rounded-2xl relative"
            animate={isLoading ? { borderColor: "rgba(99,102,241,0.2)" } : {}}
          >
            {/* File attachment preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 text-xs text-[#A78BFA] max-w-full">
                  {attachedFile.type.startsWith("image/") ? (
                    <ImageIcon size={14} className="flex-shrink-0" aria-hidden />
                  ) : (
                    <FileText size={14} className="flex-shrink-0" />
                  )}
                  <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                  <span className="text-[10px] text-[#666]">
                    {(attachedFile.size / 1024).toFixed(0)}KB
                  </span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2 p-3">
              {/* Attachment */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                id="btn-attach"
                className="p-2 rounded-xl text-[#555] hover:text-[#A0A0A0] hover:bg-white/5 transition-all flex-shrink-0"
                title="Attach image or PDF"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={18} />
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                id="chat-input"
                value={inputValue}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about health, or describe symptoms..."
                className="flex-1 bg-transparent text-sm text-[#E0E0E0] placeholder:text-[#444] resize-none outline-none min-h-[24px] max-h-[120px] py-1.5 leading-relaxed"
                rows={1}
                disabled={isLoading}
              />

              {/* Language Picker */}
              {isSupported && (
                <div className="relative" ref={langPickerRef}>
                  <button
                    id="btn-language"
                    onClick={() => setShowLangPicker(!showLangPicker)}
                    className="p-2 rounded-xl text-[#555] hover:text-[#A0A0A0] hover:bg-white/5 transition-all flex-shrink-0 flex items-center gap-1"
                    title={`Voice: ${currentLang?.label || "English"}`}
                  >
                    <Globe size={15} />
                    <span className="text-[10px]">{currentLang?.flag}</span>
                  </button>

                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 w-56 rounded-xl overflow-hidden z-50"
                        style={{
                          background: "rgba(20,20,20,0.95)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          backdropFilter: "blur(20px)",
                        }}
                      >
                        <div className="p-2 border-b border-white/5">
                          <span className="text-[10px] text-[#888] uppercase tracking-widest px-2">
                            Voice Language
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                          {supportedLanguages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                changeLanguage(lang.code);
                                setShowLangPicker(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all
                                ${language === lang.code
                                  ? "bg-[#6366F1]/15 text-[#818CF8]"
                                  : "text-[#A0A0A0] hover:bg-white/5 hover:text-white"
                                }`}
                            >
                              <span className="text-sm">{lang.flag}</span>
                              <span className="flex-1">{lang.label}</span>
                              {language === lang.code && (
                                <span className="text-[9px] text-[#6366F1]">●</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Voice */}
              {isSupported && (
                <button
                  id="btn-voice"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                    isListening
                      ? "text-red-400 bg-red-500/10"
                      : "text-[#555] hover:text-[#A0A0A0] hover:bg-white/5"
                  }`}
                  title={isListening ? "Stop recording" : `Voice input (${currentLang?.label})`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              {/* Send */}
              <motion.button
                id="btn-send"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25"
                    : "text-[#333] cursor-not-allowed"
                }`}
                whileHover={inputValue.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={inputValue.trim() && !isLoading ? { scale: 0.95 } : {}}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </motion.button>
            </div>

            {/* Voice indicator with language + confidence */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-3 flex items-center gap-2"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-red-400 rounded-full"
                        animate={{ height: [8, 18, 8] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-red-400">
                    Listening in {currentLang?.label}...
                  </span>
                  {confidence > 0 && (
                    <span className="text-[10px] text-[#666] ml-auto">
                      Confidence: {confidence}%
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-center text-[10px] text-[#3A3A3A] mt-2.5 select-none">
            AetherDx AI provides health risk assessments, not medical diagnoses. Always consult a healthcare professional. 
            <span className="mx-1">·</span>
            ABHA Ready · Edge Compatible · Explainable AI
          </p>
        </div>
      </div>
    </div>
  );
}
