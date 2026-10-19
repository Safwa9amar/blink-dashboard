/* eslint-disable @typescript-eslint/no-unused-vars -- react-markdown passes `node`; strip it before spreading */
"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Assistant replies as markdown. react-markdown drops raw HTML by default (no rehype-raw),
// so model output can never inject markup. Links open in a new tab; tables scroll sideways;
// code and numbers stay LTR inside RTL text.
const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-words" />
  ),
  p: ({ node: _node, ...props }) => <p {...props} className="my-1.5 first:mt-0 last:mb-0" />,
  ul: ({ node: _node, ...props }) => <ul {...props} className="my-1.5 list-disc ps-5 space-y-0.5" />,
  ol: ({ node: _node, ...props }) => <ol {...props} className="my-1.5 list-decimal ps-5 space-y-0.5" />,
  h1: ({ node: _node, ...props }) => <h4 {...props} className="mt-3 mb-1 text-sm font-semibold" />,
  h2: ({ node: _node, ...props }) => <h4 {...props} className="mt-3 mb-1 text-sm font-semibold" />,
  h3: ({ node: _node, ...props }) => <h5 {...props} className="mt-2 mb-1 text-[13px] font-semibold" />,
  h4: ({ node: _node, ...props }) => <h5 {...props} className="mt-2 mb-1 text-[13px] font-semibold" />,
  blockquote: ({ node: _node, ...props }) => <blockquote {...props} className="my-1.5 border-s-2 border-border ps-3 text-subtext" />,
  hr: () => <hr className="my-3 border-border" />,
  pre: ({ node: _node, ...props }) => (
    <pre {...props} dir="ltr" className="my-2 overflow-x-auto rounded-lg bg-muted p-2.5 text-xs text-start" />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code {...props} dir="ltr" className={`${className ?? ""} rounded bg-muted px-1 py-0.5 text-[12px] [pre_&]:bg-transparent [pre_&]:p-0`} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-border">
      <table {...props} className="w-full border-collapse text-xs" />
    </div>
  ),
  th: ({ node: _node, ...props }) => <th {...props} className="border-b border-border bg-muted px-2.5 py-1.5 text-start font-semibold whitespace-nowrap" />,
  td: ({ node: _node, ...props }) => <td {...props} dir="auto" className="border-b border-border px-2.5 py-1.5 align-top" />,
};

export const AssistantMarkdown = memo(function AssistantMarkdown({ children }: { children: string }) {
  return (
    <div dir="auto" className="text-[13px] leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
});
