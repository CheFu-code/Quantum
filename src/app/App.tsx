"use client";

import { useState, useRef, useEffect, useId } from "react";
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
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "user" | "assistant";
type AuthStatus = "checking" | "authenticated" | "guest";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  thinking?: boolean;
}

interface ChatThread {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
  messages: Message[];
}

type StoredMessage = Omit<Message, "timestamp"> & { timestamp: string };
type StoredThread = Omit<ChatThread, "timestamp" | "messages"> & {
  timestamp: string;
  messages: StoredMessage[];
};

type SessionUser = {
  uid: string;
  email: string;
  roles?: string[];
  displayName?: string | null;
};

const STORAGE_KEY = "quantum-chat-threads";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefuinc.com";
const CHEFU_ACCOUNT_URL =
  process.env.NEXT_PUBLIC_CHEFU_ACCOUNT_URL || "https://chefuinc.com";
const QUANTUM_APP_URL =
  process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com";
const CHEFU_LOGIN_HREF = `${CHEFU_ACCOUNT_URL.replace(
  /\/$/,
  "",
)}/login?app=quantum&returnTo=${encodeURIComponent(QUANTUM_APP_URL)}`;

function apiUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

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

const markdownComponents: Components = {
  p({ children }) {
    return <p className="break-words">{children}</p>;
  },
  h1({ children }) {
    return <h2 className="pt-1 text-lg font-semibold leading-snug text-foreground">{children}</h2>;
  },
  h2({ children }) {
    return <h3 className="pt-1 text-base font-semibold leading-snug text-foreground">{children}</h3>;
  },
  h3({ children }) {
    return <h4 className="pt-1 text-sm font-semibold leading-snug text-foreground">{children}</h4>;
  },
  ul({ children }) {
    return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="ml-5 list-decimal space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="pl-1">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-primary/50 pl-3 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ children, href }) {
    const safeUrl = safeHref(href || "");

    if (!safeUrl) return <span>{children}</span>;

    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {children}
      </a>
    );
  },
  code({ children, className }) {
    const language = /language-([\w-]+)/.exec(className || "")?.[1] || "";
    const value = String(children).replace(/\n$/, "");

    if (!language && !String(children).includes("\n")) {
      return (
        <code className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {children}
        </code>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-[#080b12]">
        {language && (
          <div className="border-b border-border/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {language}
          </div>
        )}
        <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-slate-100">
          <code className={className}>{value}</code>
        </pre>
      </div>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="min-w-full border-collapse text-left text-xs">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th className="border-b border-border/70 bg-muted/50 px-3 py-2 font-semibold">{children}</th>;
  },
  td({ children }) {
    return <td className="border-b border-border/50 px-3 py-2 align-top">{children}</td>;
  },
};

function QuantumLogo({ className = "size-7" }: { className?: string }) {
  const gradientId = useId();
  const accentId = useId();
  const glowId = useId();

  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="50%" stopColor="#c58af9" />
          <stop offset="100%" stopColor="#f28b82" />
        </linearGradient>
        <linearGradient id={accentId} x1="5" y1="20" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#81c995" />
          <stop offset="45%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#c58af9" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.54 0 0 0 0 0.7 0 0 0 0 0.97 0 0 0 0.55 0"
          />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>
      <circle
        cx="14"
        cy="14"
        r="11.2"
        fill={`url(#${gradientId})`}
        opacity="0.96"
        filter={`url(#${glowId})`}
      />
      <circle cx="14" cy="14" r="10" fill="#0d0f14" fillOpacity="0.62" />
      <path
        d="M4.4 15.1C8.1 9.15 14.9 6.05 20.1 8.05C24.45 9.72 24.95 14.32 21.35 17.7C17.7 21.12 11.45 21.85 6.9 19.22"
        stroke={`url(#${accentId})`}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M5.1 11.2C8.7 17.2 15.2 20.95 20.25 19.38C24.2 18.15 24.95 14.22 21.95 11.05C18.92 7.83 13.25 6.58 8.35 8.22"
        stroke="rgba(255,255,255,0.36)"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.78"
      />
      <circle cx="14" cy="14" r="5.4" fill="#0d0f14" stroke="rgba(255,255,255,0.2)" strokeWidth="0.9" />
      <path
        d="M14 18.6C16.54 18.6 18.6 16.54 18.6 14C18.6 11.46 16.54 9.4 14 9.4C11.46 9.4 9.4 11.46 9.4 14C9.4 16.54 11.46 18.6 14 18.6Z"
        stroke="white"
        strokeWidth="1.65"
        strokeLinecap="round"
        opacity="0.94"
      />
      <path
        d="M17.4 17.45L20.35 20.4"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.92"
      />
      <circle cx="20.9" cy="8.7" r="1.3" fill="#fdd663" />
      <circle cx="7.35" cy="19.45" r="0.85" fill="#81c995" opacity="0.95" />
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
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function safeHref(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 1000 * 60) return "Just now";
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ago`;
}

function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomId}`;
}

function threadTitle(input: string) {
  const words = input
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 7)
    .join(" ");

  if (!words) return "New conversation";
  return words.length > 46 ? `${words.slice(0, 43)}...` : words;
}

function previewText(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function parseStoredThreads(value: string | null): ChatThread[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as StoredThread[];
    if (!Array.isArray(parsed)) return [];

    return sortThreads(
      parsed
        .filter((thread) => thread.id && Array.isArray(thread.messages))
        .map((thread) => ({
          ...thread,
          timestamp: new Date(thread.timestamp),
          messages: thread.messages.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          })),
        })),
    );
  } catch {
    return [];
  }
}

function toStoredThreads(threads: ChatThread[]) {
  return threads.map((thread): StoredThread => ({
    ...thread,
    timestamp: thread.timestamp.toISOString(),
    messages: thread.messages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    })),
  }));
}

function sessionHeaders() {
  return {
    "x-chefu-app": "quantum",
  };
}

function clearLocalConversationStorage() {
  Object.keys(window.localStorage)
    .filter((key) => key === STORAGE_KEY || key.startsWith(`${STORAGE_KEY}:`))
    .forEach((key) => window.localStorage.removeItem(key));
}

async function loadSavedConversations() {
  const response = await fetch(apiUrl("/quantum/conversations"), {
    credentials: "include",
    headers: sessionHeaders(),
  });

  if (!response.ok) {
    throw new Error("Could not load saved conversations.");
  }

  const data = (await response.json().catch(() => null)) as {
    conversations?: StoredThread[];
  } | null;

  return parseStoredThreads(JSON.stringify(data?.conversations || []));
}

async function saveSavedConversations(threads: ChatThread[]) {
  const response = await fetch(apiUrl("/quantum/conversations"), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...sessionHeaders(),
    },
    body: JSON.stringify({
      conversations: toStoredThreads(threads),
    }),
  });

  if (!response.ok) {
    throw new Error("Could not save conversations.");
  }
}

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConv, setActiveConv] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeThread = threads.find((thread) => thread.id === activeConv);
  const messages = activeThread?.messages || [];

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(apiUrl("/auth/me"), {
          credentials: "include",
          headers: sessionHeaders(),
        });

        if (cancelled) return;

        if (!response.ok) {
          setSessionUser(null);
          setAuthStatus("guest");
          return;
        }

        const data = (await response.json().catch(() => null)) as {
          user?: SessionUser;
        } | null;

        if (!data?.user?.email || !data.user.uid) {
          setSessionUser(null);
          setAuthStatus("guest");
          return;
        }

        setSessionUser(data.user);
        setAuthStatus("authenticated");
      } catch {
        if (!cancelled) {
          setSessionUser(null);
          setAuthStatus("guest");
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authStatus === "checking") return;

    if (authStatus === "guest") {
      clearLocalConversationStorage();
      setThreads([]);
      setActiveConv("");
      setHasHydrated(true);
      return;
    }

    let cancelled = false;

    async function loadConversations() {
      try {
        const savedThreads = await loadSavedConversations();
        if (cancelled) return;
        setThreads(savedThreads);
        setActiveConv(savedThreads[0]?.id || "");
      } catch {
        if (cancelled) return;
        setThreads([]);
        setActiveConv("");
      } finally {
        if (!cancelled) setHasHydrated(true);
      }
    }

    setHasHydrated(false);
    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [authStatus, sessionUser?.uid]);

  useEffect(() => {
    if (!hasHydrated || authStatus !== "authenticated") return;
    const timeout = window.setTimeout(() => {
      void saveSavedConversations(threads).catch(error => {
        console.error("Failed to save Quantum conversations:", error);
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [authStatus, hasHydrated, threads]);

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

    const threadId = activeConv || createId("thread");
    const now = new Date();
    const userMsg: Message = {
      id: createId("message"),
      role: "user",
      content: text,
      timestamp: now,
    };

    if (!activeConv) setActiveConv(threadId);
    setThreads((currentThreads) => {
      const existingThread = currentThreads.find((thread) => thread.id === threadId);
      const nextThreads = existingThread
        ? currentThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, userMsg],
                  preview: previewText(text),
                  timestamp: now,
                }
              : thread,
          )
        : [
            {
              id: threadId,
              messages: [userMsg],
              preview: previewText(text),
              starred: false,
              timestamp: now,
              title: threadTitle(text),
            },
            ...currentThreads,
          ];

      return sortThreads(nextThreads);
    });
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          model: selectedModel.id,
          history: messages.slice(-8).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error || "Quantum could not generate a response.",
        );
      }

      const data = (await response.json()) as {
        message?: string;
        createdAt?: string;
      };
      const reply = data.message?.trim();

      if (!reply) {
        throw new Error("Quantum returned an empty response.");
      }

      const assistantMsg: Message = {
        id: createId("message"),
        role: "assistant",
        content: reply,
        timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
      };

      setThreads((currentThreads) =>
        sortThreads(
          currentThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, assistantMsg],
                  preview: previewText(reply),
                  timestamp: assistantMsg.timestamp,
                }
              : thread,
          ),
        ),
      );
    } catch (error) {
      const fallbackMsg: Message = {
        id: createId("message"),
        role: "assistant",
        content:
          error instanceof Error
            ? `I could not complete that request: ${error.message}`
            : "I could not complete that request. Please try again.",
        timestamp: new Date(),
      };

      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === threadId
            ? { ...thread, messages: [...thread.messages, fallbackMsg] }
            : thread,
        ),
      );
    } finally {
      setIsTyping(false);
    }
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

  const filteredConvs = threads.filter((c) =>
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
                onClick={() => {
                  setActiveConv("");
                  setInput("");
                  setLikedIds(new Set());
                }}
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
                {filteredConvs.filter((c) => !c.starred).length > 0 ? (
                  filteredConvs.filter((c) => !c.starred).map((conv) => (
                    <ConvItem key={conv.id} conv={conv} active={activeConv === conv.id} onClick={() => setActiveConv(conv.id)} />
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs leading-5 text-muted-foreground/70">
                    {authStatus === "guest"
                      ? "Temporary chats will appear here while this page is open. Sign in to save conversations."
                      : authStatus === "checking"
                        ? "Checking saved conversations..."
                        : "Your conversations will appear here after you send a message."}
                  </p>
                )}
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

          {authStatus === "authenticated" ? (
            <span
              title={sessionUser?.email}
              className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 sm:flex"
            >
              <span className="size-1.5 rounded-full bg-[#81c995]" />
              Saving chats
            </span>
          ) : (
            <a
              href={CHEFU_LOGIN_HREF}
              className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground sm:flex"
            >
              <LogIn size={13} />
              {authStatus === "checking" ? "Checking" : "Sign in"}
            </a>
          )}

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

function ConvItem({ conv, active, onClick }: { conv: ChatThread; active: boolean; onClick: () => void }) {
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
          <QuantumLogo className="size-9" />
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
