"use client";

import type { ReactNode } from "react";
import NextImage from "next/image";
import { Copy, Download, Image as ImageIcon, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import { formatTime } from "../_lib/conversations";
import type { Message } from "../_lib/types";
import { MessageContent } from "./MarkdownMessage";
import { QuantumLogo } from "./QuantumLogo";

type MessageBubbleProps = {
  msg: Message;
  compact: boolean;
  onCopy: (id: string, content: string) => void;
  copied: boolean;
  liked: boolean;
  showTimestamp: boolean;
  onLike: () => void;
  onRegenerate: () => void;
};

export function MessageBubble({
  msg,
  compact,
  onCopy,
  copied,
  liked,
  showTimestamp,
  onLike,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div
          className={`space-y-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-foreground ${
            compact ? "max-w-[68%] px-3 py-2" : "max-w-[75%] px-4 py-3"
          }`}
          style={{ background: "rgba(138,180,248,0.12)", border: "1px solid rgba(138,180,248,0.2)" }}
        >
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="grid gap-2">
              {msg.attachments.map((attachment) => (
                <figure
                  key={attachment.id}
                  className="overflow-hidden rounded-xl border border-primary/20 bg-primary/10"
                >
                  <NextImage
                    src={`data:${attachment.mimeType};base64,${attachment.data}`}
                    alt={attachment.name}
                    width={720}
                    height={480}
                    unoptimized
                    className="max-h-72 w-full object-contain"
                    sizes="(max-width: 768px) 75vw, 520px"
                  />
                  <figcaption className="flex items-center gap-1.5 border-t border-primary/15 px-2 py-1 text-xs text-foreground/70">
                    <ImageIcon size={12} />
                    <span className="truncate">{attachment.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {msg.content && <p>{msg.content}</p>}
          {showTimestamp && (
            <p className="text-right text-[9px] text-muted-foreground/45">
              {formatTime(msg.timestamp)}
            </p>
          )}
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
        <div
          className={`rounded-2xl rounded-tl-sm bg-card border border-border ${
            compact ? "px-3 py-2" : "px-4 py-3"
          }`}
        >
          <MessageContent content={msg.content} />
          {msg.generatedImages && msg.generatedImages.length > 0 && (
            <div className="mt-4 grid gap-3">
              {msg.generatedImages.map((image) => {
                const src = `data:${image.mimeType};base64,${image.data}`;

                return (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-xl border border-border/70 bg-muted/20"
                  >
                    <NextImage
                      src={src}
                      alt={image.alt}
                      width={1024}
                      height={1024}
                      unoptimized
                      className="h-auto max-h-[520px] w-full object-contain"
                      sizes="(max-width: 768px) 90vw, 720px"
                    />
                    <figcaption className="flex items-center justify-between gap-3 border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
                      <span className="truncate">{image.alt}</span>
                      <a
                        href={src}
                        download={`${image.id}.${image.mimeType.split("/")[1] || "png"}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-primary transition-colors hover:bg-primary/10"
                      >
                        <Download size={12} />
                        Download
                      </a>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
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
          <ActionButton onClick={onRegenerate} title="Regenerate">
            <RotateCcw size={12} />
          </ActionButton>
          {showTimestamp && (
            <span className="ml-auto text-[9px] text-muted-foreground/40">
              {formatTime(msg.timestamp)}
            </span>
          )}
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
