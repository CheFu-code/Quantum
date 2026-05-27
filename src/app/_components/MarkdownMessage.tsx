"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const markdownComponents: Components = {
  p({ children }) {
    return <p className="break-words">{children}</p>;
  },
  h1({ children }) {
    return <h2 className="pt-1 text-lg font-semibold leading-snug text-foreground">{children}</h2>;
  },
  h2({ children }) {
    return <h3 className="pt-1 text-base font-semibold leading-snug text-foreground">{children}</h3>;
  },
  h3({ children }) {
    return <h4 className="pt-1 text-sm font-semibold leading-snug text-foreground">{children}</h4>;
  },
  ul({ children }) {
    return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="ml-5 list-decimal space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="pl-1">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-primary/50 pl-3 text-muted-foreground">
        {children}
      </blockquote>
    );
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
        className="font-medium text-primary underline-offset-4 hover:underline"
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

    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-[#080b12]">
        {language && (
          <div className="border-b border-border/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="min-w-full border-collapse text-left text-xs">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th className="border-b border-border/70 bg-muted/50 px-3 py-2 font-semibold">{children}</th>;
  },
  td({ children }) {
    return <td className="border-b border-border/50 px-3 py-2 align-top">{children}</td>;
  },
};

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        skipHtml
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
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
