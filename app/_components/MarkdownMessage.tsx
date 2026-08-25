"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { MessageSource } from "../_lib/types";

function createMarkdownComponents(sources: MessageSource[] = []): Components {
  let paragraphIndex = 0;

  return {
    p({ children }) {
      const citationIndex = paragraphIndex;
      paragraphIndex += 1;

      return (
        <p className="my-0 break-words">
          {children}
          {citationIndex < sources.length && (
            <CitationChip index={citationIndex} source={sources[citationIndex]} />
          )}
        </p>
      );
    },
    h1({ children }) {
      return (
        <h2 className="mb-2 mt-5 text-xl font-semibold leading-tight text-foreground first:mt-0">
          {children}
        </h2>
      );
    },
    h2({ children }) {
      return (
        <h3 className="mb-2 mt-4 text-lg font-semibold leading-tight text-foreground first:mt-0">
          {children}
        </h3>
      );
    },
    h3({ children }) {
      return (
        <h4 className="mb-1.5 mt-3 text-base font-semibold leading-snug text-foreground first:mt-0">
          {children}
        </h4>
      );
    },
    h4({ children }) {
      return (
        <h5 className="mb-1.5 mt-3 text-sm font-semibold leading-snug text-foreground first:mt-0">
          {children}
        </h5>
      );
    },
    ul({ children }) {
      return (
        <ul className="my-3 ml-5 list-disc space-y-1.5 marker:text-muted-foreground">
          {children}
        </ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="my-3 ml-5 list-decimal space-y-1.5 marker:text-muted-foreground">
          {children}
        </ol>
      );
    },
    li({ children }) {
      return <li className="pl-1 leading-relaxed">{children}</li>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="my-3 rounded-r-xl border-l-2 border-primary/55 bg-muted/25 py-2 pl-3 pr-4 text-muted-foreground">
          {children}
        </blockquote>
      );
    },
    hr() {
      return <hr className="my-5 border-border/80" />;
    },
    strong({ children }) {
      return <strong className="font-semibold text-foreground">{children}</strong>;
    },
    em({ children }) {
      return <em className="text-foreground/90">{children}</em>;
    },
    del({ children }) {
      return <del className="text-muted-foreground decoration-muted-foreground/70">{children}</del>;
    },
    pre({ children }) {
      return <>{children}</>;
    },
    a({ children, href }) {
      const safeUrl = safeHref(href || "");

      if (!safeUrl) return <span>{children}</span>;

      return (
        <a
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition hover:decoration-primary"
        >
          {children}
        </a>
      );
    },
    code({ children, className }) {
      const language = /language-([\w-]+)/.exec(className || "")?.[1] || "";
      const value = String(children).replace(/\n$/, "");

      if (!language && !String(children).includes("\n")) {
        return (
          <code className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            {children}
          </code>
        );
      }

      if (["md", "markdown"].includes(language.toLowerCase())) {
        return <MarkdownPreview value={value} />;
      }

      return (
        <div className="my-3 overflow-hidden rounded-xl border border-border/70 bg-[#080b12]">
          {language && (
            <div className="border-b border-border/60 px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
              {language}
            </div>
          )}
          <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-slate-100">
            <code className={className}>{value}</code>
          </pre>
        </div>
      );
    },
    table({ children }) {
      return (
        <div className="my-3 overflow-x-auto rounded-xl border border-border/70">
          <table className="min-w-full border-collapse text-left text-xs leading-relaxed">
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="border-b border-border/70 bg-muted/55 px-3 py-2 font-semibold text-foreground">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border-b border-border/50 px-3 py-2 align-top text-foreground/90">
          {children}
        </td>
      );
    },
  };
}

export function MessageContent({
  content,
  sources = [],
}: {
  content: string;
  sources?: MessageSource[];
}) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_li>p]:inline [&_li>ul]:mb-0 [&_li>ul]:mt-1.5 [&_li>ol]:mb-0 [&_li>ol]:mt-1.5">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        skipHtml
        components={createMarkdownComponents(sources)}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MarkdownPreview({ value }: { value: string }) {
  return (
    <div className="my-3 space-y-3 text-sm leading-relaxed text-foreground/90 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_li>p]:inline [&_li>ul]:mb-0 [&_li>ul]:mt-1.5 [&_li>ol]:mb-0 [&_li>ol]:mt-1.5">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        skipHtml
        components={createMarkdownComponents()}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}

function CitationChip({
  index,
  source,
}: {
  index: number;
  source: MessageSource;
}) {
  const href = safeHref(source.uri);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="ml-1 inline-flex h-4 min-w-4 translate-y-[-1px] items-center justify-center rounded-full border border-primary/35 bg-primary/10 px-1 text-[10px] font-semibold leading-none text-primary no-underline hover:bg-primary/20"
      title={source.title || source.uri}
    >
      {index + 1}
    </a>
  );
}

function safeHref(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}
