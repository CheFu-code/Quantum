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
  isLoading: boolean;
  autoScroll: boolean;
  copiedId: string | null;
  compactMessages: boolean;
  likedIds: Set<string>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  showTimestamps: boolean;
  onCopy: (id: string, content: string) => void;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, rating: "up" | "down") => void;
  onSuggestion: (text: string) => void;
};

export function ChatMessages({
  messages,
  isTyping,
  isLoading,
  autoScroll,
  copiedId,
  compactMessages,
  likedIds,
  messagesEndRef,
  showTimestamps,
  onCopy,
  onRegenerate,
  onFeedback,
  onSuggestion,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const hasInlineThinkingMessage = messages.some(
    (message) =>
      message.role === "assistant" &&
      (message.thinking ||
        message.status === "thinking" ||
        message.status === "streaming"),
  );

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
    if (!autoScroll) return;

    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceFromBottom < 260) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll, isTyping, messages, messagesEndRef]);

  function scrollToLatest() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div ref={scrollRef} className="scrollbar-hide relative flex-1 overflow-y-auto">
      {isLoading ? (
        <MessageSkeletonList />
      ) : messages.length === 0 ? (
        <EmptyState onSuggestion={onSuggestion} />
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              msg={message}
              compact={compactMessages}
              onCopy={onCopy}
              copied={copiedId === message.id}
              liked={likedIds.has(message.id) || message.feedback === "up"}
              showTimestamp={showTimestamps}
              onLike={() => onFeedback(message.id, "up")}
              onDislike={() => onFeedback(message.id, "down")}
              onRegenerate={() => onRegenerate(message.id)}
            />
          ))}
          {isTyping && !hasInlineThinkingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 sm:gap-3"
            >
              <div className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #8ab4f822, #c58af922)" }}>
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

      {!isLoading && messages.length > 0 && showJumpButton && (
        <button
          type="button"
          onClick={scrollToLatest}
          className="sticky bottom-3 left-1/2 z-20 mx-auto flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-2xl backdrop-blur transition-colors hover:border-primary/40 hover:bg-muted sm:bottom-4"
        >
          <ArrowDown size={14} />
          Latest
        </button>
      )}
    </div>
  );
}

function MessageSkeletonList() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex justify-end">
        <div className="w-[72%] max-w-lg space-y-2 rounded-2xl rounded-tr-sm border border-primary/10 bg-primary/5 px-4 py-3">
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <div className="mt-0.5 size-7 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
          <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-10/12 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-7/12 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-[58%] max-w-md space-y-2 rounded-2xl rounded-tr-sm border border-primary/10 bg-primary/5 px-4 py-3">
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <div className="mt-0.5 size-7 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-5/12 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
