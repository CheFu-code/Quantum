"use client";

import { Clock, Plus, Search, Settings, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { AuthStatus, ChatThread } from "../_lib/types";
import { ConversationItem } from "./ConversationItem";
import { QuantumLogo } from "./QuantumLogo";

type ChatSidebarProps = {
  open: boolean;
  threads: ChatThread[];
  activeThreadId: string;
  authStatus: AuthStatus;
  searchQuery: string;
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
  searchQuery,
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
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-[260px] flex-shrink-0 flex flex-col border-r border-border bg-sidebar h-full z-10"
        >
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <QuantumLogo />
            <span className="text-base font-semibold text-foreground tracking-tight">Quantum</span>
          </div>

          <div className="px-3 pt-3 pb-2">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-muted/60 text-foreground/80 hover:text-foreground border border-border/50 hover:border-border"
            >
              <Plus size={15} strokeWidth={2.5} />
              New conversation
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/40">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="flex-1 bg-transparent text-xs text-foreground/80 placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
            {starredThreads.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Star size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Starred</span>
                </div>
                {starredThreads.map((thread) => (
                  <ConversationItem
                    key={thread.id}
                    conv={thread}
                    active={activeThreadId === thread.id}
                    onClick={() => onSelectThread(thread.id)}
                    onToggleStar={() => onToggleStar(thread.id)}
                  />
                ))}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <Clock size={10} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recent</span>
              </div>
              {recentThreads.length > 0 ? (
                recentThreads.map((thread) => (
                  <ConversationItem
                    key={thread.id}
                    conv={thread}
                    active={activeThreadId === thread.id}
                    onClick={() => onSelectThread(thread.id)}
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

          <div className="px-3 py-3 border-t border-border">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
            >
              <Settings size={13} />
              Settings & preferences
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
