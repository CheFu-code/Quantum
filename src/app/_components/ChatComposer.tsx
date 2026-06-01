"use client";

import type { KeyboardEvent, RefObject } from "react";
import {
  FileText,
  Globe,
  Image,
  Link2,
  MapPin,
  Mic,
  Paperclip,
  Send,
  Square,
  SquareTerminal,
} from "lucide-react";
import { motion } from "motion/react";
import type { AuthStatus, ImageAttachment } from "../_lib/types";

type ChatComposerProps = {
  input: string;
  attachments: ImageAttachment[];
  isTyping: boolean;
  authStatus: AuthStatus;
  codeExecutionEnabled: boolean;
  enterToSend: boolean;
  mapsGroundingEnabled: boolean;
  supportedAttachmentAccept: string;
  urlContextEnabled: boolean;
  webSearchEnabled: boolean;
  isListening: boolean;
  inputNotice: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop: () => void;
  onPickFiles: (files: FileList | null) => void | Promise<void>;
  onRemoveAttachment: (attachmentId: string) => void;
  onToggleCodeExecution: () => void;
  onToggleMapsGrounding: () => void;
  onToggleUrlContext: () => void;
  onToggleVoice: () => void;
  onToggleWebSearch: () => void;
};

export function ChatComposer({
  input,
  attachments,
  isTyping,
  authStatus,
  codeExecutionEnabled,
  enterToSend,
  mapsGroundingEnabled,
  supportedAttachmentAccept,
  urlContextEnabled,
  webSearchEnabled,
  isListening,
  inputNotice,
  textareaRef,
  fileInputRef,
  onInputChange,
  onKeyDown,
  onSend,
  onStop,
  onPickFiles,
  onRemoveAttachment,
  onToggleCodeExecution,
  onToggleMapsGrounding,
  onToggleUrlContext,
  onToggleVoice,
  onToggleWebSearch,
}: ChatComposerProps) {
  const canSend = Boolean(input.trim() || attachments.length > 0) && !isTyping;
  const activeToolCount = [
    webSearchEnabled,
    urlContextEnabled,
    codeExecutionEnabled,
    mapsGroundingEnabled,
  ].filter(Boolean).length;
  const statusText = getStatusText({
    activeToolCount,
    codeExecutionEnabled,
    enterToSend,
    isListening,
    mapsGroundingEnabled,
    urlContextEnabled,
    webSearchEnabled,
  });

  return (
    <div className="border-t border-border/50 bg-background px-2 pb-3 pt-2 sm:px-4 sm:pb-4">
      <div className="mx-auto w-full max-w-3xl">
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
            className="scrollbar-hide w-full resize-none bg-transparent px-3 pb-2 pt-3 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground sm:px-4 sm:pt-3.5 sm:text-sm"
            style={{ maxHeight: 160 }}
          />
          {attachments.length > 0 && (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-3 pb-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex max-w-[150px] shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/40 px-2 py-1.5 sm:max-w-[180px]"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {attachment.mimeType.startsWith("image/") ? (
                      <Image size={13} />
                    ) : (
                      <FileText size={13} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Remove attachment"
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
            accept={supportedAttachmentAccept}
            multiple
            className="hidden"
            onChange={(event) => void onPickFiles(event.target.files)}
          />
          <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1 sm:gap-1.5 sm:px-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg p-2 text-muted-foreground transition-all duration-150 hover:bg-muted/60 hover:text-foreground sm:p-1.5"
              title={
                authStatus === "authenticated"
                  ? "Attach file"
                  : "Sign in to attach files"
              }
            >
              <Paperclip size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleVoice}
              className={`rounded-lg p-2 transition-all duration-150 sm:p-1.5 ${
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
              className={`rounded-lg p-2 transition-all duration-150 sm:p-1.5 ${
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
            <button
              type="button"
              onClick={onToggleUrlContext}
              className={`rounded-lg p-2 transition-all duration-150 sm:p-1.5 ${
                urlContextEnabled
                  ? "bg-[#8ab4f8]/15 text-[#8ab4f8]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title={
                urlContextEnabled
                  ? "URL context enabled"
                  : "Read public URLs in prompts"
              }
            >
              <Link2 size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleCodeExecution}
              className={`rounded-lg p-2 transition-all duration-150 sm:p-1.5 ${
                codeExecutionEnabled
                  ? "bg-[#fdd663]/15 text-[#fdd663]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title={
                codeExecutionEnabled
                  ? "Code execution enabled"
                  : "Let Quantum run code"
              }
            >
              <SquareTerminal size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleMapsGrounding}
              className={`rounded-lg p-2 transition-all duration-150 sm:p-1.5 ${
                mapsGroundingEnabled
                  ? "bg-[#f28b82]/15 text-[#f28b82]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title={
                mapsGroundingEnabled
                  ? "Maps grounding enabled"
                  : "Use Google Maps grounding"
              }
            >
              <MapPin size={15} />
            </button>
            <div className="flex-1" />
            <span className="mr-2 hidden text-[10px] text-muted-foreground/50 sm:inline">
              {statusText}
            </span>
            <motion.button
              onClick={isTyping ? onStop : onSend}
              disabled={!isTyping && !canSend}
              whileTap={{ scale: 0.9 }}
              className="flex size-9 items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-30 sm:size-8"
              title={isTyping ? "Stop response" : "Send message"}
              style={{
                background: isTyping
                  ? "rgba(255,255,255,0.1)"
                  : canSend
                  ? "linear-gradient(135deg, #8ab4f8, #c58af9)"
                  : "rgba(255,255,255,0.08)",
              }}
            >
              {isTyping ? (
                <Square
                  size={13}
                  className="fill-muted-foreground text-muted-foreground"
                  strokeWidth={2.5}
                />
              ) : (
                <Send
                  size={14}
                  className={canSend ? "text-[#0d0f14]" : "text-muted-foreground"}
                  strokeWidth={2.5}
                />
              )}
            </motion.button>
          </div>
        </div>
        {inputNotice && (
          <p className="mt-2 text-center text-[10px] text-[#fdd663]">
            {inputNotice}
          </p>
        )}
        <p className="mt-2 px-2 text-center text-[10px] text-muted-foreground/40">
          Quantum can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}

function getStatusText({
  activeToolCount,
  codeExecutionEnabled,
  enterToSend,
  isListening,
  mapsGroundingEnabled,
  urlContextEnabled,
  webSearchEnabled,
}: {
  activeToolCount: number;
  codeExecutionEnabled: boolean;
  enterToSend: boolean;
  isListening: boolean;
  mapsGroundingEnabled: boolean;
  urlContextEnabled: boolean;
  webSearchEnabled: boolean;
}) {
  if (activeToolCount > 1) return `${activeToolCount} Quantum tools on`;
  if (webSearchEnabled) return "Search grounding on";
  if (urlContextEnabled) return "URL context on";
  if (codeExecutionEnabled) return "Code execution on";
  if (mapsGroundingEnabled) return "Maps grounding on";
  if (isListening) return "Listening...";
  return enterToSend ? "Shift+Enter for newline" : "Ctrl+Enter to send";
}
