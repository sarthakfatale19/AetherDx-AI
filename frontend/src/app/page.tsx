"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [chatKey, setChatKey] = useState(0);
  const [chatHistory, setChatHistory] = useState([
    { id: "welcome", title: "Welcome to AetherDx AI", time: "Just now" },
  ]);

  const handleNewChat = useCallback(() => {
    setChatKey((prev) => prev + 1);
    setChatHistory((prev) => [
      { id: `chat_${Date.now()}`, title: "New Analysis Session", time: "Just now" },
      ...prev,
    ]);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChatHistory((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <main className="flex h-screen bg-[#0D0D0D]">
      <Sidebar
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex-1 ml-[68px]">
        <ChatInterface key={chatKey} />
      </div>
    </main>
  );
}
