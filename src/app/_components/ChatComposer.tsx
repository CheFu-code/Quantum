"use client";

import type { KeyboardEvent, RefObject } from "react";
import { Globe, Image, Mic, Send } from "lucide-react";
import { motion } from "motion/react";
import type { AuthStatus, ImageAttachment } from "../_lib/types";

type ChatComposerProps = {
  input: string;
  attachments: ImageAttachment[];
  isTyping: boolean;
  authStatus: AuthStatus;
  enterToSend: boolean;
  webSearchEnabled: boolean;
  isListening: boolean;
  inputNotice: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onPickImages: (files: FileList | null) => void | Promise<void>;
  onRemoveAttachment: (attachmentId: string) => void;
  onToggleVoice: () => void;
  onToggleWebSearch: () => void;
};

export function ChatComposer({
  input,
  attachments,
  isTyping,
  authStatus,
  enterToSend,
  webSearchEnabled,
  isListening,
  inputNotice,
  textareaRef,
  fileInputRef,
  onInputChange,
  onKeyDown,
  onSend,
  onPickImages,
  onRemoveAttachment,
  onToggleVoice,
  onToggleWebSearch,
}: ChatComposerProps) {
  const canSend = Boolean(input.trim() || attachments.length > 0) && !isTyping;

  return (
    <div className="px-4 pb-4 pt-2 bg-background border-t border-border/50">
      <div className="max-w-3xl mx-auto">
        <div
          className="relative flex flex-col rounded-2xl border border-border bg-card transition-all duration-200 focus-within:border-primary/40"
          style={{ boxShadow: "0 2px 24px rgba(0,0,0,0.2)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Quantum anything..."
            rows={1}
            className="scrollbar-hide w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
            style={{ maxHeight: 160 }}
          />
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-3 pb-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex max-w-[180px] items-center gap-2 rounded-xl border border-border bg-muted/40 px-2 py-1.5"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Image size={13} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Remove image"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void onPickImages(event.target.files)}
          />
          <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
              title={
                authStatus === "authenticated"
                  ? "Upload image"
                  : "Sign in to attach images"
              }
            >
              <Image size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleVoice}
              className={`p-1.5 rounded-lg transition-all duration-150 ${
                isListening
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title={
                authStatus === "authenticated"
                  ? isListening
                    ? "Stop voice input"
                    : "Start voice input"
                  : "Sign in to use voice input"
              }
            >
              <Mic size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`p-1.5 rounded-lg transition-all duration-150 ${
                webSearchEnabled
                  ? "bg-[#81c995]/15 text-[#81c995]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title={
                webSearchEnabled
                  ? "Web search enabled"
                  : "Use web search for this chat"
              }
            >
              <Globe size={15} />
            </button>
            <div className="flex-1" />
            <span className="mr-2 hidden text-[10px] text-muted-foreground/50 sm:inline">
              {webSearchEnabled
                ? "Web search on"
                : isListening
                  ? "Listening..."
                  : enterToSend
                    ? "Shift+Enter for newline"
                    : "Ctrl+Enter to send"}
            </span>
            <motion.button
              onClick={onSend}
              disabled={!canSend}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
              style={{
                background: canSend
                  ? "linear-gradient(135deg, #8ab4f8, #c58af9)"
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <Send size={14} className={canSend ? "text-[#0d0f14]" : "text-muted-foreground"} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
        {inputNotice && (
          <p className="mt-2 text-center text-[10px] text-[#fdd663]">
            {inputNotice}
          </p>
        )}
        <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
          Quantum can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
