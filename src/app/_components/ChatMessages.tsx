"use client";

import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
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
  onRegenerate: (messageId: string) => void;
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
  onRegenerate,
  onToggleLike,
  onSuggestion,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function updateJumpButton(target: HTMLDivElement) {
      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      setShowJumpButton(distanceFromBottom > 220);
    }

    const handleScroll = () => updateJumpButton(container);

    updateJumpButton(container);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceFromBottom < 260) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTyping, messages, messagesEndRef]);

  function scrollToLatest() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-y-auto scrollbar-hide">
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
              onRegenerate={() => onRegenerate(message.id)}
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

      {messages.length > 0 && showJumpButton && (
        <button
          type="button"
          onClick={scrollToLatest}
          className="sticky bottom-4 left-1/2 z-20 mx-auto flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-2xl backdrop-blur transition-colors hover:border-primary/40 hover:bg-muted"
        >
          <ArrowDown size={14} />
          Latest
        </button>
      )}
    </div>
  );
}
