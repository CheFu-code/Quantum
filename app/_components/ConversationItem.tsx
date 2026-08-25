"use client";

import { Star } from "lucide-react";
import { formatTime } from "../_lib/conversations";
import type { ChatThread } from "../_lib/types";

type ConversationItemProps = {
  conv: ChatThread;
  active: boolean;
  onClick: () => void;
  onToggleStar: () => void;
};

export function ConversationItem({
  conv,
  active,
  onClick,
  onToggleStar,
}: ConversationItemProps) {
  return (
    <div
      className={`group flex min-h-9 w-full items-center rounded-full px-3 transition ${active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/75"}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
      >
        <span className={`flex-1 truncate text-sm font-medium ${active ? "text-sidebar-foreground" : "text-sidebar-foreground/90"}`}>
          {conv.title}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground/60 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {formatTime(conv.timestamp)}
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleStar}
        title={conv.starred ? "Remove from starred" : "Star conversation"}
        className={`rounded-full p-1 transition ${
          conv.starred
            ? "text-[var(--chart-3)] opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            : "text-muted-foreground/50 opacity-0 hover:text-[var(--chart-3)] focus-visible:text-[var(--chart-3)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 group-focus-within:opacity-100 group-hover:opacity-100"
        }`}
      >
        <Star size={11} fill={conv.starred ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
