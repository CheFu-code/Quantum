"use client";

import { MessageSquare, Star } from "lucide-react";
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
      className={`group mb-0.5 flex w-full items-center rounded-xl px-2 py-1 transition-all duration-150 ${active ? "bg-primary/10" : "hover:bg-muted/40"}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left"
      >
        <MessageSquare size={11} className={active ? "text-primary" : "text-muted-foreground"} />
        <span className={`text-xs font-medium truncate flex-1 ${active ? "text-primary" : "text-foreground/80"}`}>
          {conv.title}
        </span>
        <span className="text-[9px] text-muted-foreground/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(conv.timestamp)}
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleStar}
        title={conv.starred ? "Remove from starred" : "Star conversation"}
        className={`rounded-md p-1 transition-all ${
          conv.starred
            ? "text-[#fdd663] opacity-100"
            : "text-muted-foreground/50 opacity-0 hover:text-[#fdd663] group-hover:opacity-100"
        }`}
      >
        <Star size={11} fill={conv.starred ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
