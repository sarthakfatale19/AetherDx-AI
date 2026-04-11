"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  Clock,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
  Trash2,
  ClipboardList,
  Shield,
} from "lucide-react";

const navItems = [
  { icon: MessageSquarePlus, label: "New Chat", id: "new" },
  { icon: ClipboardList, label: "Health Form", id: "assess" },
  { icon: Shield, label: "ABHA Health", id: "abha" },
  { icon: Clock, label: "History", id: "history" },
  { icon: Cpu, label: "AI Models", id: "models" },
  { icon: Activity, label: "Health", id: "health" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface ChatHistoryItem {
  id: string;
  title: string;
  time: string;
}

interface SidebarProps {
  onNewChat: () => void;
  chatHistory: ChatHistoryItem[];
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}

export default function Sidebar({ onNewChat, chatHistory, onSelectChat, onDeleteChat }: SidebarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState("new");
  const [showPanel, setShowPanel] = useState<string | null>(null);

  const handleNavClick = (id: string) => {
    setActiveItem(id);
    if (id === "new") {
      onNewChat();
      setShowPanel(null);
    } else if (id === "assess") {
      router.push("/assess");
    } else if (id === "abha") {
      router.push("/abha");
    } else if (id === "history") {
      setExpanded(true);
      setShowPanel(showPanel === "history" ? null : "history");
    } else if (id === "models") {
      setExpanded(true);
      setShowPanel(showPanel === "models" ? null : "models");
    } else if (id === "health") {
      setExpanded(true);
      setShowPanel(showPanel === "health" ? null : "health");
    } else if (id === "settings") {
      setExpanded(true);
      setShowPanel(showPanel === "settings" ? null : "settings");
    }
  };

  const panelWidth = showPanel ? 280 : expanded ? 200 : 68;

  return (
    <motion.aside
      initial={{ width: 68 }}
      animate={{ width: panelWidth }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-row"
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Icon Rail */}
      <div className="w-[68px] flex-shrink-0 flex flex-col glass-strong h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">✴</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id || showPanel === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`sidebar-icon ${isActive ? "active" : ""}`}
                title={item.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </nav>

        {/* Expand Toggle */}
        <button
          id="sidebar-toggle"
          onClick={() => {
            if (showPanel) {
              setShowPanel(null);
              setExpanded(false);
            } else {
              setExpanded(!expanded);
            }
          }}
          className="mx-3 mb-4 sidebar-icon"
        >
          {expanded || showPanel ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Expandable Panel */}
      <AnimatePresence>
        {(expanded || showPanel) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: showPanel ? 212 : 132, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="h-full overflow-hidden border-l border-white/5"
            style={{ background: "rgba(15,15,15,0.95)" }}
          >
            <div className="h-full flex flex-col p-3 pt-5 overflow-y-auto">
              {/* History Panel */}
              {showPanel === "history" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">History</h3>
                    <button onClick={() => setShowPanel(null)} className="text-[#555] hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  {chatHistory.length === 0 ? (
                    <p className="text-xs text-[#555] italic">No chat history yet</p>
                  ) : (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
                        onClick={() => onSelectChat?.(chat.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#C0C0C0] truncate">{chat.title}</p>
                          <p className="text-[10px] text-[#555]">{chat.time}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat.id); }}
                          className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* Models Panel */}
              {showPanel === "models" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">AI Models</h3>
                    <button onClick={() => setShowPanel(null)} className="text-[#555] hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  {[
                    { name: "Random Forest", status: "Primary", acc: "99.8%" },
                    { name: "Logistic Regression", status: "Active", acc: "98.5%" },
                    { name: "Naive Bayes", status: "Active", acc: "97.2%" },
                    { name: "Decision Tree", status: "Active", acc: "96.8%" },
                  ].map((model) => (
                    <div key={model.name} className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#E0E0E0] font-medium">{model.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          model.status === "Primary"
                            ? "bg-[#6366F1]/15 text-[#818CF8]"
                            : "bg-white/5 text-[#666]"
                        }`}>
                          {model.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-[#22C55E]" style={{ width: model.acc }} />
                        </div>
                        <span className="text-[10px] text-[#666]">{model.acc}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Health Panel */}
              {showPanel === "health" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Health</h3>
                    <button onClick={() => setShowPanel(null)} className="text-[#555] hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-[#666] uppercase tracking-wide">System Status</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      <span className="text-xs text-[#22C55E]">All Systems Operational</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-[#666] uppercase tracking-wide">Engine</span>
                    <p className="text-xs text-[#C0C0C0] mt-1">AetherDx AI Engine v1.0</p>
                  </div>
                  <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-[#666] uppercase tracking-wide">Conditions</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["Diabetes", "Hypertension", "Anemia"].map((c) => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#A0A0A0]">{c}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Settings Panel */}
              {showPanel === "settings" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Settings</h3>
                    <button onClick={() => setShowPanel(null)} className="text-[#555] hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-[#666] uppercase tracking-wide">Theme</span>
                    <p className="text-xs text-[#C0C0C0] mt-1">Dark Mode</p>
                  </div>
                  <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-[#666] uppercase tracking-wide">Version</span>
                    <p className="text-xs text-[#C0C0C0] mt-1">v1.0.0</p>
                  </div>
                </motion.div>
              )}

              {/* Default expanded view - just labels */}
              {!showPanel && expanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3 px-1">Navigation</p>
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-all ${
                        activeItem === item.id
                          ? "text-[#818CF8] bg-[#6366F1]/10"
                          : "text-[#888] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
