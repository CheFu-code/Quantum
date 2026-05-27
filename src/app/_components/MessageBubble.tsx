"use client";

import type { ReactNode } from "react";
import { Copy, Image, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import { formatTime } from "../_lib/conversations";
import type { Message } from "../_lib/types";
import { MessageContent } from "./MarkdownMessage";
import { QuantumLogo } from "./QuantumLogo";

type MessageBubbleProps = {
  msg: Message;
  onCopy: (id: string, content: string) => void;
  copied: boolean;
  liked: boolean;
  onLike: () => void;
};

export function MessageBubble({ msg, onCopy, copied, liked, onLike }: MessageBubbleProps) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[75%] space-y-2 px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-foreground" style={{ background: "rgba(138,180,248,0.12)", border: "1px solid rgba(138,180,248,0.2)" }}>
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {msg.attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-foreground/80"
                >
                  <Image size={12} />
                  {attachment.name}
                </span>
              ))}
            </div>
          )}
          <p>{msg.content}</p>
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
          <ActionButton onClick={() => onCopy(msg.id, msg.content)} active={copied} title="Copy">
            <Copy size={12} />
          </ActionButton>
          <ActionButton onClick={onLike} active={liked} title="Good response">
            <ThumbsUp size={12} />
          </ActionButton>
          <ActionButton onClick={() => {}} title="Bad response">
            <ThumbsDown size={12} />
          </ActionButton>
          <ActionButton onClick={() => {}} title="Regenerate">
            <RotateCcw size={12} />
          </ActionButton>
          <span className="ml-auto text-[9px] text-muted-foreground/40">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
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
