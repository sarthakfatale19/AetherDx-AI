"use client";

import { motion } from "framer-motion";

interface UserMessageProps {
  content: string;
  index: number;
}

export default function UserMessage({ content, index }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex justify-end mb-4"
    >
      <div className="message-bubble user">
        <p className="text-sm text-white/90">{content}</p>
      </div>
    </motion.div>
  );
}
