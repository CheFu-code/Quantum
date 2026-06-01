"use client";

import {
  AlertCircle,
  CalendarDays,
  Clock,
  Globe2,
  Image as ImageIcon,
  Plus,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { AuthStatus, ChatThread, ConversationFilter } from "../_lib/types";
import { ConversationItem } from "./ConversationItem";
import { QuantumLogo } from "./QuantumLogo";

type ChatSidebarProps = {
  open: boolean;
  threads: ChatThread[];
  activeThreadId: string;
  authStatus: AuthStatus;
  conversationFilter: ConversationFilter;
  isMobile: boolean;
  searchQuery: string;
  onClose: () => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onSearchChange: (query: string) => void;
  onNewConversation: () => void;
  onSelectThread: (threadId: string) => void;
  onToggleStar: (threadId: string) => void;
  onOpenSettings: () => void;
};

export function ChatSidebar({
  open,
  threads,
  activeThreadId,
  authStatus,
  conversationFilter,
  isMobile,
  searchQuery,
  onClose,
  onFilterChange,
  onSearchChange,
  onNewConversation,
  onSelectThread,
  onToggleStar,
  onOpenSettings,
}: ChatSidebarProps) {
  const starredThreads = threads.filter((thread) => thread.starred);
  const recentThreads = threads.filter((thread) => !thread.starred);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(86vw,280px)] flex-shrink-0 flex-col border-r border-border bg-sidebar shadow-2xl shadow-black/40 md:relative md:z-10 md:h-full md:w-[260px] md:shadow-none"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-4">
              <QuantumLogo />
              <span className="text-base font-semibold tracking-tight text-foreground">
                Quantum
              </span>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground md:hidden"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-3 pb-2 pt-3">
              <button
                onClick={() => {
                  onNewConversation();
                  if (isMobile) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl border border-border/50 px-3 py-2.5 text-sm font-medium text-foreground/80 transition-all duration-150 hover:border-border hover:bg-muted/60 hover:text-foreground"
              >
                <Plus size={15} strokeWidth={2.5} />
                New conversation
              </button>
            </div>

            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/50 px-3 py-2">
                <Search
                  size={13}
                  className="flex-shrink-0 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="flex-1 bg-transparent text-xs text-foreground/80 outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="scrollbar-hide flex gap-1 overflow-x-auto px-3 pb-2">
              {CONVERSATION_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const active = conversationFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => onFilterChange(filter.id)}
                    title={filter.label}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <Icon size={11} />
                    {filter.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto px-2 pb-2">
              {starredThreads.length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <Star size={10} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Starred
                    </span>
                  </div>
                  {starredThreads.map((thread) => (
                    <ConversationItem
                      key={thread.id}
                      active={activeThreadId === thread.id}
                      conv={thread}
                      onClick={() => {
                        onSelectThread(thread.id);
                        if (isMobile) onClose();
                      }}
                      onToggleStar={() => onToggleStar(thread.id)}
                    />
                  ))}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Clock size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recent
                  </span>
                </div>
                {recentThreads.length > 0 ? (
                  recentThreads.map((thread) => (
                    <ConversationItem
                      key={thread.id}
                      active={activeThreadId === thread.id}
                      conv={thread}
                      onClick={() => {
                        onSelectThread(thread.id);
                        if (isMobile) onClose();
                      }}
                      onToggleStar={() => onToggleStar(thread.id)}
                    />
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

            <div className="border-t border-border px-3 py-3">
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  if (isMobile) onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-all duration-150 hover:bg-muted/50 hover:text-foreground"
              >
                <Settings size={13} />
                Settings & preferences
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const CONVERSATION_FILTERS: Array<{
  icon: typeof Search;
  id: ConversationFilter;
  label: string;
  shortLabel: string;
}> = [
  { icon: Search, id: "all", label: "All conversations", shortLabel: "All" },
  { icon: Star, id: "starred", label: "Starred conversations", shortLabel: "Star" },
  { icon: ImageIcon, id: "hasImages", label: "Has generated images", shortLabel: "Images" },
  { icon: Globe2, id: "usedWeb", label: "Used web or URL tools", shortLabel: "Web" },
  { icon: AlertCircle, id: "failed", label: "Failed or stopped", shortLabel: "Issues" },
  { icon: CalendarDays, id: "today", label: "Updated today", shortLabel: "Today" },
  { icon: Clock, id: "week", label: "Updated this week", shortLabel: "Week" },
];
