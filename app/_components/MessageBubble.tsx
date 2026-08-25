"use client";

import {
    ChevronDown,
    Code2,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Globe2,
    Image as ImageIcon,
    RotateCcw,
    Search,
    ThumbsDown,
    ThumbsUp
} from "lucide-react";
import { motion } from "motion/react";
import NextImage from "next/image";
import { useState, type ReactNode } from "react";
import { formatTime } from "../_lib/conversations";
import type { Message, MessageSource, MessageToolActivity } from "../_lib/types";
import { isMapsSource, MapGroundingCard } from "./MapGroundingCard";
import { MessageContent } from "./MarkdownMessage";
import { QuantumLogo } from "./QuantumLogo";
import { ThinkingDots } from "./ThinkingDots";

type MessageBubbleProps = {
    msg: Message;
    compact: boolean;
    onCopy: (id: string, content: string) => void;
    copied: boolean;
    liked: boolean;
    showTimestamp: boolean;
    onLike: () => void;
    onDislike: () => void;
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
    onDislike,
    onRegenerate,
}: MessageBubbleProps) {
    const [expandedMessage, setExpandedMessage] = useState(false);
    const isUser = msg.role === "user";
    const normalizedMessage = normalizeMessagePresentation(msg);
    const mapSources = normalizedMessage.sources.filter(isMapsSource);
    const nonMapSources = normalizedMessage.sources.filter(
        (source) => !isMapsSource(source),
    );
    const userMessageLines = msg.content?.split(/\r?\n/).length || 0;
    const shouldCollapseUserMessage = isUser && userMessageLines > 4;

    if (isUser) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
            >
                <div
                    className={`min-w-0 space-y-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-foreground ${compact
                        ? "max-w-[82%] px-3 py-2 sm:max-w-[68%]"
                        : "max-w-[88%] px-3 py-2.5 sm:max-w-[75%] sm:px-4 sm:py-3"
                        }`}
                    style={{ background: "rgba(138,180,248,0.12)", border: "1px solid rgba(138,180,248,0.2)" }}
                >
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div className="grid gap-2">
                            {msg.attachments.map((attachment) => (
                                <AttachmentPreview key={attachment.id} attachment={attachment} />
                            ))}
                        </div>
                    )}
                    {msg.content && (
                        <p
                            className="whitespace-pre-wrap wrap-break-word"
                            style={
                                shouldCollapseUserMessage && !expandedMessage
                                    ? {
                                        display: "-webkit-box",
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }
                                    : undefined
                            }
                        >
                            {msg.content}
                        </p>
                    )}
                    {shouldCollapseUserMessage && (
                        <button
                            type="button"
                            onClick={() => setExpandedMessage((prev) => !prev)}
                            className="mt-2 bg-cyan-950 p-2 rounded-2xl inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary/80"
                        >
                            <ChevronDown
                                size={14}
                                className={`${expandedMessage ? "rotate-180" : ""} transition-transform duration-200`}
                            />
                        </button>
                    )}
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
            className="group flex gap-2 sm:gap-3"
        >
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full sm:size-7" style={{ background: "linear-gradient(135deg, rgba(138,180,248,0.15), rgba(197,138,249,0.15))", border: "1px solid rgba(255,255,255,0.06)" }}>
                <QuantumLogo />
            </div>
            <div className="flex-1 min-w-0">
                <div
                    className={`${compact ? "py-1" : "py-2"
                        }`}
                >
                    {normalizedMessage.activities.length > 0 && (
                        <ActivityLog activities={normalizedMessage.activities} />
                    )}
                    {normalizedMessage.content ? (
                        <MessageContent
                            content={normalizedMessage.content}
                            sources={normalizedMessage.sources}
                        />
                    ) : msg.thinking ? (
                        <ThinkingDots />
                    ) : null}
                    {mapSources.length > 0 && (
                        <>
                            {mapSources.map((msource, idx) => (
                                <MapGroundingCard
                                    key={`map-${idx}-${msource.uri}`}
                                    content={normalizedMessage.content}
                                    sources={[msource]}
                                />
                            ))}
                        </>
                    )}
                    {msg.thinking && normalizedMessage.content && <StreamingCursor />}
                    {nonMapSources.length > 0 && (
                        <SourceCards sources={nonMapSources} />
                    )}
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
                                            className="h-auto max-h-90 w-full object-contain sm:max-h-130"
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
                <div className="mt-1.5 flex items-center gap-1 px-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                    <ActionButton
                        onClick={() => onCopy(msg.id, normalizedMessage.content || msg.content)}
                        active={copied}
                        title="Copy"
                    >
                        <Copy size={12} />
                    </ActionButton>
                    <ActionButton onClick={onLike} active={liked} title="Good response">
                        <ThumbsUp size={12} />
                    </ActionButton>
                    <ActionButton
                        onClick={onDislike}
                        active={msg.feedback === "down"}
                        title="Bad response"
                    >
                        <ThumbsDown size={12} />
                    </ActionButton>
                    <ActionButton onClick={onRegenerate} title="Regenerate">
                        <RotateCcw size={12} />
                    </ActionButton>
                    {showTimestamp && (
                        <span className="ml-auto text-[9px] text-muted-foreground/40">
                            {statusLabel(msg)}
                            {statusLabel(msg) ? " • " : ""}
                            {formatTime(msg.timestamp)}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function ActivityLog({
    activities,
}: {
    activities: MessageToolActivity[];
}) {
    const [expanded, setExpanded] = useState(false);
    const visibleActivities = expanded ? activities : activities.slice(0, 2);

    return (
        <div className="mb-3 rounded-xl border border-border/70 bg-muted/25">
            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground"
            >
                <Search size={13} className="text-primary" />
                <span className="font-medium text-foreground/85">Work log</span>
                <span className="truncate">
                    {summarizeActivities(activities)}
                </span>
                <ChevronDown
                    size={13}
                    className={`ml-auto shrink-0 transition-transform ${expanded ? "rotate-180" : ""
                        }`}
                />
            </button>
            <div className="grid gap-1 border-t border-border/60 px-2.5 py-2">
                {visibleActivities.map((activity, index) => (
                    <ActivityItem
                        key={`${activity.title}-${activity.detail || activity.output || index}`}
                        activity={activity}
                    />
                ))}
            </div>
        </div>
    );
}

function ActivityItem({ activity }: { activity: MessageToolActivity }) {
    const Icon = activity.type === "search" ? Search : Code2;
    const detail = activity.detail || activity.output;

    return (
        <details className="group rounded-lg px-1.5 py-1.5">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground">
                <Icon size={13} className="shrink-0 text-primary" />
                <span className="shrink-0 font-medium text-foreground/85">
                    {activity.title}
                </span>
                {detail && <span className="min-w-0 truncate">{detail}</span>}
                {(activity.code || activity.output) && (
                    <ChevronDown
                        size={12}
                        className="ml-auto shrink-0 transition-transform group-open:rotate-180"
                    />
                )}
            </summary>
            {(activity.code || activity.output) && (
                <div className="mt-2 grid gap-2 pl-5">
                    {activity.code && (
                        <pre className="max-h-44 overflow-auto rounded-lg border border-border/60 bg-background/80 p-2 text-[11px] leading-relaxed text-foreground/80">
                            {activity.code}
                        </pre>
                    )}
                    {activity.output && (
                        <pre className="max-h-44 overflow-auto rounded-lg border border-border/60 bg-background/80 p-2 text-[11px] leading-relaxed text-foreground/80">
                            {activity.output}
                        </pre>
                    )}
                </div>
            )}
        </details>
    );
}

function summarizeActivities(activities: MessageToolActivity[]) {
    const searches = activities.filter((activity) => activity.type === "search").length;
    const codeRuns = activities.filter((activity) => activity.type === "code").length;
    const tools = activities.length - searches - codeRuns;
    const parts = [
        searches ? `${searches} search${searches === 1 ? "" : "es"}` : "",
        codeRuns ? `${codeRuns} code run${codeRuns === 1 ? "" : "s"}` : "",
        tools ? `${tools} tool step${tools === 1 ? "" : "s"}` : "",
    ].filter(Boolean);

    return parts.join(", ") || `${activities.length} step${activities.length === 1 ? "" : "s"}`;
}

function StreamingCursor() {
    return (
        <motion.span
            aria-hidden="true"
            className="ml-1 inline-block h-4 w-1 translate-y-0.5 rounded-full bg-primary/80"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 0.9, repeat: Infinity }}
        />
    );
}

function SourceCards({ sources }: { sources: MessageSource[] }) {
    return (
        <div className="mt-4 border-t border-border/70 pt-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Globe2 size={13} />
                Sources
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {sources.slice(0, 6).map((source, index) => {
                    const href = safeHttpUrl(source.uri);
                    const host = readableHost(source.uri);
                    const title = source.title?.trim() || host;

                    if (!href) return null;

                    return (
                        <a
                            key={`${source.uri}-${index}`}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-2.5 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-primary/10"
                        >
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                {index + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-foreground/90">
                                    {title}
                                </span>
                                <span className="block truncate text-[10px] text-muted-foreground">
                                    {host}
                                </span>
                            </span>
                            <ExternalLink
                                size={12}
                                className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                            />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

function normalizeMessagePresentation(message: Message) {
    const legacyTools = splitLegacyToolActivities(message.content);
    const legacySources = splitLegacySources(legacyTools.content);
    const metadataActivities = normalizeActivities(
        message.metadata?.activities || [],
    );
    const metadataSources = normalizeSources(message.metadata?.sources || []);

    return {
        activities:
            metadataActivities.length > 0 ? metadataActivities : legacyTools.activities,
        content: legacySources.content,
        sources: metadataSources.length > 0 ? metadataSources : legacySources.sources,
    };
}

function statusLabel(message: Message) {
    if (message.status === "failed") return "Failed";
    if (message.status === "stopped") return "Stopped";
    if (message.status === "streaming") return "Writing";
    if (message.status === "thinking" || message.thinking) return "Thinking";
    return "";
}

function splitLegacyToolActivities(content: string) {
    let remaining = content.trimStart();
    const activities: MessageToolActivity[] = [];

    while (true) {
        const match = remaining.match(/^```([\w-]*)\n([\s\S]*?)\n```\s*/);
        if (!match) break;

        const consumed = applyLegacyToolBlock({
            activities,
            language: match[1],
            value: match[2],
        });

        if (!consumed) break;
        remaining = remaining.slice(match[0].length);
    }

    return {
        activities,
        content: remaining,
    };
}

function applyLegacyToolBlock({
    activities,
    language,
    value,
}: {
    activities: MessageToolActivity[];
    language: string;
    value: string;
}) {
    const normalizedValue = value.trim();
    const searchQuery = extractSearchQuery(normalizedValue);

    if (searchQuery) {
        activities.push({
            code: normalizedValue,
            detail: searchQuery,
            title: "Searched the web",
            type: "search",
        });
        return true;
    }

    if (/google search|web search|looking up/i.test(normalizedValue)) {
        const latestActivity = activities[activities.length - 1];

        if (latestActivity && !latestActivity.output) {
            latestActivity.output = normalizedValue;
        } else {
            activities.push({
                detail: normalizedValue,
                output: normalizedValue,
                title: "Searched the web",
                type: "search",
            });
        }

        return true;
    }

    if (language.toLowerCase() === "python" && /(?:tool|search|lookup)/i.test(normalizedValue)) {
        activities.push({
            code: normalizedValue,
            detail: normalizedValue.split("\n")[0]?.slice(0, 120),
            title: "Used a tool",
            type: "tool",
        });
        return true;
    }

    return false;
}

function normalizeActivities(activities: MessageToolActivity[]) {
    const seen = new Set<string>();

    return activities.filter((activity) => {
        const key = [
            activity.type,
            activity.title,
            activity.detail || "",
            activity.code || "",
            activity.output || "",
        ].join(":");

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function splitLegacySources(content: string) {
    const match = content.match(/\n{2,}#{2,3}\s+Sources\s*\n([\s\S]+)$/i);

    if (!match) return { content, sources: [] as MessageSource[] };

    return {
        content: content.slice(0, match.index).trimEnd(),
        sources: parseSourceLines(match[1]),
    };
}

function parseSourceLines(value: string) {
    return normalizeSources(
        value
            .split("\n")
            .map((line) => {
                const markdownLink = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);
                if (markdownLink) {
                    return {
                        title: markdownLink[1],
                        uri: markdownLink[2],
                    };
                }

                const bareUrl = line.match(/https?:\/\/\S+/i)?.[0];
                if (!bareUrl) return null;

                return {
                    title: readableHost(bareUrl),
                    uri: bareUrl,
                };
            })
            .filter((source): source is MessageSource => Boolean(source)),
    );
}

function normalizeSources(sources: MessageSource[]) {
    const seen = new Set<string>();

    return sources.filter((source) => {
        const href = safeHttpUrl(source.uri);
        if (!href || seen.has(href)) return false;
        seen.add(href);
        return true;
    });
}

function safeHttpUrl(value: string) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch {
        return "";
    }
}

function readableHost(value: string) {
    try {
        return new URL(value).hostname.replace(/^www\./, "");
    } catch {
        return "Source";
    }
}

function extractSearchQuery(code: string) {
    const match = code.match(
        /\b(?:concise_search|google_search|web_search|search)\s*\(\s*["'`]([^"'`]+)["'`]/i,
    );

    return match?.[1]?.trim() || "";
}

function AttachmentPreview({ attachment }: { attachment: NonNullable<Message["attachments"]>[number] }) {
    if (!attachment.mimeType.startsWith("image/")) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-foreground/75">
                <FileText size={14} />
                <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                <span className="shrink-0 text-[10px] uppercase text-muted-foreground/70">
                    {formatFileSize(attachment.size)}
                </span>
            </div>
        );
    }

    return (
        <figure className="overflow-hidden rounded-xl border border-primary/20 bg-primary/10">
            <NextImage
                src={`data:${attachment.mimeType};base64,${attachment.data}`}
                alt={attachment.name}
                width={720}
                height={480}
                unoptimized
                className="max-h-60 w-full object-contain sm:max-h-72"
                sizes="(max-width: 768px) 75vw, 520px"
            />
            <figcaption className="flex items-center gap-1.5 border-t border-primary/15 px-2 py-1 text-xs text-foreground/70">
                <ImageIcon size={12} />
                <span className="truncate">{attachment.name}</span>
            </figcaption>
        </figure>
    );
}

function formatFileSize(size: number) {
    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
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
