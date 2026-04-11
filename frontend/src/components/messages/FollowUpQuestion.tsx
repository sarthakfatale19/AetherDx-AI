"use client";

import { motion } from "framer-motion";

interface FollowUpOption {
  label: string;
  value: string;
  description?: string;
}

interface FollowUpQuestionProps {
  question: string;
  type: string;
  options: FollowUpOption[];
  onSelect: (value: string) => void;
}

export default function FollowUpQuestion({
  question,
  type,
  options,
  onSelect,
}: FollowUpQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4"
    >
      <div className="message-bubble ai max-w-[85%]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center">
            <span className="text-[10px]">✴</span>
          </div>
          <span className="text-xs text-[#A0A0A0] uppercase tracking-wide font-medium">
            Follow-Up
          </span>
        </div>

        <p className="text-sm text-[#E0E0E0] mb-4">{question}</p>

        <div className="flex flex-wrap gap-2">
          {options.map((option, i) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(option.value)}
              className="group px-4 py-2.5 rounded-xl border border-white/8 bg-white/3 
                         hover:bg-[#6366F1]/12 hover:border-[#6366F1]/30
                         transition-all duration-200 text-left"
            >
              <span className="block text-sm font-medium text-[#E0E0E0] group-hover:text-white">
                {option.label}
              </span>
              {option.description && (
                <span className="block text-xs text-[#666] group-hover:text-[#A0A0A0] mt-0.5">
                  {option.description}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
