"use client";

import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Image,
  Mic,
  Plus,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { MODELS, type QuantumModel } from "../_lib/constants";
import type { AuthStatus, ImageAttachment } from "../_lib/types";

type ChatComposerProps = {
  input: string;
  attachments: ImageAttachment[];
  isTyping: boolean;
  authStatus: AuthStatus;
  selectedModel: QuantumModel;
  supportedAttachmentAccept: string;
  variant: "dock" | "landing";
  disabled?: boolean;
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
  onSelectModel: (model: QuantumModel) => void;
  onToggleVoice: () => void;
};

export function ChatComposer({
  input,
  attachments,
  isTyping,
  authStatus,
  selectedModel,
  supportedAttachmentAccept,
  variant,
  disabled = false,
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
  onSelectModel,
  onToggleVoice,
}: ChatComposerProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const isAuthenticated = authStatus === "authenticated";
  const canSend =
    !disabled && Boolean(input.trim() || attachments.length > 0) && !isTyping;
  const floatingMenuPosition =
    variant === "dock" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div
      className={
        variant === "landing"
          ? "pointer-events-none absolute inset-x-0 top-[50%] z-20 -translate-y-1/2 px-4"
          : "relative z-20 shrink-0 px-3 pb-4 pt-2 sm:px-6 sm:pb-6"
      }
    >
      {modelMenuOpen && (
        <button
          type="button"
          aria-label="Close model menu"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setModelMenuOpen(false)}
        />
      )}

      <div
        className={`pointer-events-auto mx-auto w-full ${
          variant === "landing" ? "max-w-[826px]" : "max-w-3xl"
        }`}
      >
        <div className="relative">
          <AnimatePresence>
            {modelMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: variant === "dock" ? 8 : -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: variant === "dock" ? 8 : -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-12 z-40 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/35 ${floatingMenuPosition}`}
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Select model
                  </p>
                </div>
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(model);
                      setModelMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      selectedModel.id === model.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/55"
                    }`}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${model.color}22`, color: model.color }}
                    >
                      <Sparkles size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {model.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </span>
                    {selectedModel.id === model.id && (
                      <Check size={16} className="text-primary" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`rounded-[2rem] border border-border bg-card/95 shadow-2xl shadow-black/20 backdrop-blur transition focus-within:border-primary/45 ${
              variant === "landing" ? "px-4 py-3" : "px-3 py-2.5 sm:px-4"
            }`}
          >
            {attachments.length > 0 && (
              <div className="scrollbar-hide mb-2 flex gap-2 overflow-x-auto">
                {attachments.map((attachment) => (
                  <AttachmentChip
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={() => onRemoveAttachment(attachment.id)}
                  />
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={supportedAttachmentAccept}
              multiple
              className="hidden"
              disabled={disabled || !isAuthenticated}
              onChange={(event) => {
                const inputElement = event.currentTarget;

                void Promise.resolve(onPickFiles(inputElement.files)).finally(() => {
                  inputElement.value = "";
                });
              }}
            />

            <div className="flex items-end gap-1.5 sm:gap-2">
              <IconButton
                active={false}
                disabled={disabled || !isAuthenticated}
                label={isAuthenticated ? "Attach file" : "Sign in to attach files"}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={24} strokeWidth={1.8} />
              </IconButton>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask Quantum anything..."
                rows={1}
                disabled={disabled}
                className="scrollbar-hide min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:text-[15px]"
                style={{ maxHeight: 160 }}
              />

              <button
                type="button"
                onClick={() => setModelMenuOpen((value) => !value)}
                disabled={disabled}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-foreground/80 transition hover:bg-muted/65 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
                title={selectedModel.description}
              >
                {shortModelName(selectedModel)}
                <ChevronDown size={15} className="text-muted-foreground" />
              </button>

              <IconButton
                active={isListening}
                disabled={disabled || !isAuthenticated}
                label={
                  isAuthenticated
                    ? isListening
                      ? "Stop voice input"
                      : "Start voice input"
                    : "Sign in to use voice input"
                }
                onClick={onToggleVoice}
              >
                <Mic size={20} />
              </IconButton>

              {(canSend || isTyping) && (
                <motion.button
                  onClick={isTyping ? onStop : onSend}
                  disabled={disabled && !isTyping}
                  whileTap={{ scale: 0.92 }}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-35"
                  title={isTyping ? "Stop response" : "Send message"}
                >
                  {isTyping ? (
                    <Square size={14} className="fill-current" strokeWidth={2.5} />
                  ) : (
                    <Send size={16} strokeWidth={2.4} />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {inputNotice && (
          <p className="mt-2 text-center text-[11px] text-[var(--chart-3)]">
            {inputNotice}
          </p>
        )}
        {variant === "dock" && (
          <p className="mt-2 px-2 text-center text-[10px] text-muted-foreground/45">
            Quantum can make mistakes. Consider checking important information.
          </p>
        )}
      </div>
    </div>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ImageAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex max-w-[180px] shrink-0 items-center gap-2 rounded-full border border-border bg-muted/45 py-1 pl-2 pr-1 text-xs text-foreground/85">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        {attachment.mimeType.startsWith("image/") ? (
          <Image size={13} />
        ) : (
          <FileText size={13} />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="Remove attachment"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function IconButton({
  active,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
      }`}
      title={label}
    >
      {children}
    </button>
  );
}

function shortModelName(model: QuantumModel) {
  return model.name.replace(/^Quantum\s+/i, "");
}
