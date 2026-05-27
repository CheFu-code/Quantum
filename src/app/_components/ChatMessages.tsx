"use client";

import type { RefObject } from "react";
import { motion } from "motion/react";
import type { Message } from "../_lib/types";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { QuantumLogo } from "./QuantumLogo";
import { ThinkingDots } from "./ThinkingDots";

type ChatMessagesProps = {
  messages: Message[];
  isTyping: boolean;
  copiedId: string | null;
  likedIds: Set<string>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onCopy: (id: string, content: string) => void;
  onToggleLike: (messageId: string) => void;
  onSuggestion: (text: string) => void;
};

export function ChatMessages({
  messages,
  isTyping,
  copiedId,
  likedIds,
  messagesEndRef,
  onCopy,
  onToggleLike,
  onSuggestion,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {messages.length === 0 ? (
        <EmptyState onSuggestion={onSuggestion} />
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              msg={message}
              onCopy={onCopy}
              copied={copiedId === message.id}
              liked={likedIds.has(message.id)}
              onLike={() => onToggleLike(message.id)}
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
  );
}
