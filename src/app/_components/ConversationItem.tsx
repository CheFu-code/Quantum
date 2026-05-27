"use client";

import { MessageSquare } from "lucide-react";
import { formatTime } from "../_lib/conversations";
import type { ChatThread } from "../_lib/types";

type ConversationItemProps = {
  conv: ChatThread;
  active: boolean;
  onClick: () => void;
};

export function ConversationItem({ conv, active, onClick }: ConversationItemProps) {
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
