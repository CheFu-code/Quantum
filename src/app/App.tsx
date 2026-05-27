"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Settings,
  Mic,
  Image,
  Send,
  ChevronDown,
  Sparkles,
  Globe,
  Code,
  FileText,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Zap,
  Brain,
  Layers,
  Menu,
  Star,
  Clock,
  MessageSquare,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  thinking?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
}

const DEMO_NOW = new Date("2026-05-27T12:00:00.000Z");
const CHEFU_ACCOUNT_URL =
  process.env.NEXT_PUBLIC_CHEFU_ACCOUNT_URL || "https://chefuinc.com";
const QUANTUM_APP_URL =
  process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com";
const CHEFU_LOGIN_HREF = `${CHEFU_ACCOUNT_URL.replace(
  /\/$/,
  "",
)}/login?app=quantum&returnTo=${encodeURIComponent(QUANTUM_APP_URL)}`;

function demoDate(offsetMs: number) {
  return new Date(DEMO_NOW.getTime() - offsetMs);
}

const SAMPLE_CONVERSATIONS: Conversation[] = [
  { id: "1", title: "Quantum computing overview", preview: "Explain the fundamental principles...", timestamp: demoDate(1000 * 60 * 5), starred: true },
  { id: "2", title: "React architecture patterns", preview: "What are the best patterns for...", timestamp: demoDate(1000 * 60 * 60 * 2) },
  { id: "3", title: "Climate change data analysis", preview: "Analyze the CO2 emission trends...", timestamp: demoDate(1000 * 60 * 60 * 24) },
  { id: "4", title: "Neural network optimization", preview: "How do I improve training speed...", timestamp: demoDate(1000 * 60 * 60 * 48) },
  { id: "5", title: "Protein folding mechanisms", preview: "Describe how AlphaFold2 works...", timestamp: demoDate(1000 * 60 * 60 * 72) },
];

const SUGGESTIONS = [
  { icon: Brain, label: "Explain dark matter", color: "#8ab4f8" },
  { icon: Code, label: "Write a REST API", color: "#81c995" },
  { icon: Globe, label: "Summarize the news", color: "#fdd663" },
  { icon: FileText, label: "Draft a proposal", color: "#c58af9" },
];

const MODELS = [
  { id: "ultra", name: "Quantum Ultra 2.0", badge: "Advanced", color: "#c58af9" },
  { id: "pro", name: "Quantum Pro 1.5", badge: "Balanced", color: "#8ab4f8" },
  { id: "flash", name: "Quantum Flash 2.0", badge: "Fast", color: "#81c995" },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "user",
    content: "What are the most significant breakthroughs in AI research from the past year?",
    timestamp: demoDate(1000 * 60 * 4),
  },
  {
    id: "2",
    role: "assistant",
    content: `The past year has seen several remarkable breakthroughs that are reshaping the AI landscape:\n\n**1. Multimodal Reasoning at Scale**\nLarge models can now seamlessly reason across text, images, audio, and video in a single pass - not as separate pipelines bolted together, but as genuinely unified representations. This enables tasks like watching a video and debugging the code shown on screen simultaneously.\n\n**2. Long-Context Understanding**\nContext windows have expanded dramatically - from 32K to over 1M tokens. Models can now ingest entire codebases, legal contracts, or research archives and answer nuanced questions that require synthesizing information across millions of words.\n\n**3. Efficient Inference Architectures**\nTechniques like speculative decoding, mixture-of-experts routing, and quantization-aware training have cut inference costs by 10-100x. This makes frontier-quality reasoning accessible on edge devices and at consumer scale.\n\n**4. Chain-of-Thought Emergence**\nPre-training on reasoning traces has shown that models can now self-correct mid-generation, backtrack on wrong assumptions, and produce verifiably correct solutions to competition-level mathematics and formal proofs.\n\n**5. Agentic Task Completion**\nModels are increasingly deployed as autonomous agents that call tools, browse the web, write and execute code, and coordinate multi-step workflows with minimal human intervention.`,
    timestamp: demoDate(1000 * 60 * 3),
  },
];

function QuantumLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="50%" stopColor="#c58af9" />
          <stop offset="100%" stopColor="#f28b82" />
        </linearGradient>
      </defs>
      <path
        d="M14 2C14 2 7.5 8 7.5 14C7.5 20 14 26 14 26C14 26 20.5 20 20.5 14C20.5 8 14 2 14 2Z"
        fill="url(#gemini-grad)"
        opacity="0.9"
      />
      <path
        d="M2 14C2 14 8 7.5 14 7.5C20 7.5 26 14 26 14C26 14 20 20.5 14 20.5C8 20.5 2 14 2 14Z"
        fill="url(#gemini-grad)"
        opacity="0.7"
      />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="text-sm leading-relaxed text-foreground/90">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part.split("\n").map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
      })}
    </div>
  );
}

function formatTime(date: Date) {
  const diff = DEMO_NOW.getTime() - date.getTime();
  if (diff < 1000 * 60) return "Just now";
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ago`;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConv, setActiveConv] = useState("1");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const responses = [
      "That's a fascinating question. Let me break it down carefully.\n\nThe core insight here is that complexity often emerges from surprisingly simple rules. When we look at this from first principles, we find that the underlying structure reveals patterns that are both elegant and practically useful.\n\n**Key considerations:**\n- The immediate implications are significant for current practice\n- Secondary effects often outweigh the primary ones\n- Historical analogues suggest a 3-5 year adoption curve\n\nWould you like me to go deeper on any particular aspect?",
      "Excellent question - this sits at the intersection of several important ideas.\n\nHere's my analysis:\n\n**Short answer:** Yes, with important caveats.\n\n**Longer answer:** The evidence points strongly in one direction, but the second-order effects are less clear. Recent research from 2024 suggests that the conventional wisdom here needs updating.\n\nI can run through the specific data points if that would be helpful.",
      "I can help with that. Let me think through this systematically.\n\nThe problem you're describing has three distinct components:\n1. **The structural layer** - how the pieces fit together architecturally\n2. **The behavioral layer** - what happens at runtime and under load\n3. **The evolutionary layer** - how this changes over time as requirements shift\n\nMost solutions focus only on (1) and pay the price later with (2) and (3). A more robust approach addresses all three from the start.",
    ];

    const reply = responses[Math.floor(Math.random() * responses.length)];
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredConvs = SAMPLE_CONVERSATIONS.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-[260px] flex-shrink-0 flex flex-col border-r border-border bg-sidebar h-full z-10"
          >
            {/* Sidebar header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
              <QuantumLogo />
              <span className="text-base font-semibold text-foreground tracking-tight">Quantum</span>
              <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(138,180,248,0.15)", color: "#8ab4f8" }}>
                Ultra 2.0
              </span>
            </div>

            {/* New chat */}
            <div className="px-3 pt-3 pb-2">
              <button
                onClick={() => { setMessages([]); setActiveConv(""); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-muted/60 text-foreground/80 hover:text-foreground border border-border/50 hover:border-border"
              >
                <Plus size={15} strokeWidth={2.5} />
                New conversation
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/40">
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-foreground/80 placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
              {/* Starred */}
              {filteredConvs.some((c) => c.starred) && (
                <div className="mb-1">
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <Star size={10} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Starred</span>
                  </div>
                  {filteredConvs.filter((c) => c.starred).map((conv) => (
                    <ConvItem key={conv.id} conv={conv} active={activeConv === conv.id} onClick={() => setActiveConv(conv.id)} />
                  ))}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Clock size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recent</span>
                </div>
                {filteredConvs.filter((c) => !c.starred).map((conv) => (
                  <ConvItem key={conv.id} conv={conv} active={activeConv === conv.id} onClick={() => setActiveConv(conv.id)} />
                ))}
              </div>
            </div>

            {/* Sidebar footer */}
            <div className="px-3 py-3 border-t border-border">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150">
                <Settings size={13} />
                Settings & preferences
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm z-10">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <Menu size={16} />
          </button>

          {!sidebarOpen && (
            <div className="flex items-center gap-2">
              <QuantumLogo />
              <span className="text-sm font-semibold text-foreground">Quantum</span>
            </div>
          )}

          {/* Model selector */}
          <div className="relative ml-auto">
            <button
              onClick={() => setModelMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all duration-150 text-xs font-medium text-foreground/80 hover:text-foreground"
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedModel.color }} />
              {selectedModel.name}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${selectedModel.color}22`, color: selectedModel.color }}>
                {selectedModel.badge}
              </span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>

            <AnimatePresence>
              {modelMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50"
                  style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
                >
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Select model</p>
                  </div>
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m); setModelMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all duration-150 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}22` }}>
                        <Sparkles size={14} style={{ color: m.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.badge} responses</p>
                      </div>
                      {selectedModel.id === m.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href={CHEFU_LOGIN_HREF}
            className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground sm:flex"
          >
            <LogIn size={13} />
            Sign in
          </a>

          <button className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-150">
            <MoreHorizontal size={16} />
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={(text) => setInput(text)} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onCopy={copyMessage}
                  copied={copiedId === msg.id}
                  liked={likedIds.has(msg.id)}
                  onLike={() => setLikedIds((prev) => { const n = new Set(prev); n.has(msg.id) ? n.delete(msg.id) : n.add(msg.id); return n; })}
                />
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #8ab4f822, #c58af922)" }}>
                    <QuantumLogo />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 bg-background border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <div
              className="relative flex flex-col rounded-2xl border border-border bg-card transition-all duration-200 focus-within:border-primary/40"
              style={{ boxShadow: "0 2px 24px rgba(0,0,0,0.2)" }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Quantum anything..."
                rows={1}
                className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
                style={{ maxHeight: 160 }}
              />
              <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1">
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150">
                  <Image size={15} />
                </button>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150">
                  <Mic size={15} />
                </button>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150">
                  <Globe size={15} />
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-muted-foreground/50 mr-2">Shift+Enter for newline</span>
                <motion.button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                  style={{
                    background: input.trim() && !isTyping
                      ? "linear-gradient(135deg, #8ab4f8, #c58af9)"
                      : "rgba(255,255,255,0.08)",
                  }}
                >
                  <Send size={14} className={input.trim() && !isTyping ? "text-[#0d0f14]" : "text-muted-foreground"} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
              Quantum can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {/* Click-away for model menu */}
      {modelMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
      )}
    </div>
  );
}

function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl mb-0.5 transition-all duration-150 group ${active ? "bg-primary/10" : "hover:bg-muted/40"}`}
    >
      <div className="flex items-center gap-2">
        <MessageSquare size={11} className={active ? "text-primary" : "text-muted-foreground"} />
        <span className={`text-xs font-medium truncate flex-1 ${active ? "text-primary" : "text-foreground/80"}`}>
          {conv.title}
        </span>
        <span className="text-[9px] text-muted-foreground/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(conv.timestamp)}
        </span>
      </div>
    </button>
  );
}

function MessageBubble({ msg, onCopy, copied, liked, onLike }: {
  msg: Message;
  onCopy: (id: string, content: string) => void;
  copied: boolean;
  liked: boolean;
  onLike: () => void;
}) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-foreground" style={{ background: "rgba(138,180,248,0.12)", border: "1px solid rgba(138,180,248,0.2)" }}>
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 group"
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, rgba(138,180,248,0.15), rgba(197,138,249,0.15))", border: "1px solid rgba(255,255,255,0.06)" }}>
        <QuantumLogo />
      </div>
      <div className="flex-1 min-w-0">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
          <MessageContent content={msg.content} />
        </div>
        <div className="flex items-center gap-1 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ActionBtn onClick={() => onCopy(msg.id, msg.content)} active={copied} title="Copy">
            <Copy size={12} />
          </ActionBtn>
          <ActionBtn onClick={onLike} active={liked} title="Good response">
            <ThumbsUp size={12} />
          </ActionBtn>
          <ActionBtn onClick={() => {}} title="Bad response">
            <ThumbsDown size={12} />
          </ActionBtn>
          <ActionBtn onClick={() => {}} title="Regenerate">
            <RotateCcw size={12} />
          </ActionBtn>
          <span className="ml-auto text-[9px] text-muted-foreground/40">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-150 ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-6"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg, rgba(138,180,248,0.15), rgba(197,138,249,0.15))", border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8ab4f8" />
                <stop offset="50%" stopColor="#c58af9" />
                <stop offset="100%" stopColor="#f28b82" />
              </linearGradient>
            </defs>
            <path d="M14 2C14 2 7.5 8 7.5 14C7.5 20 14 26 14 26C14 26 20.5 20 20.5 14C20.5 8 14 2 14 2Z" fill="url(#hero-grad)" opacity="0.9" />
            <path d="M2 14C2 14 8 7.5 14 7.5C20 7.5 26 14 26 14C26 14 20 20.5 14 20.5C8 20.5 2 14 2 14Z" fill="url(#hero-grad)" opacity="0.7" />
          </svg>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
          Good afternoon
        </h1>
        <p className="text-muted-foreground text-sm">How can I help you today?</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-3 w-full max-w-lg"
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            onClick={() => onSuggestion(s.label)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:border-border/80 transition-all duration-200 text-left group"
            style={{ background: "linear-gradient(135deg, rgba(26,29,35,0.8), rgba(30,33,40,0.5))" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
              <s.icon size={15} style={{ color: s.color }} />
            </div>
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors font-medium">{s.label}</span>
            <ChevronRight size={12} className="ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
          </motion.button>
        ))}
      </motion.div>

      {/* Capability chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-2 mt-8 justify-center"
      >
        {[
          { icon: Zap, label: "1M token context" },
          { icon: Layers, label: "Multimodal" },
          { icon: Brain, label: "Deep reasoning" },
          { icon: Code, label: "Code execution" },
        ].map((chip, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-muted/20 text-xs text-muted-foreground">
            <chip.icon size={11} />
            {chip.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
