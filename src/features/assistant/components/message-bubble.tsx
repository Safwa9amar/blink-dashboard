"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import type { ChatMessage } from "../types";
import { AssistantMarkdown } from "./assistant-markdown";
import { ToolActivity } from "./tool-activity";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const t = useTranslations("assistant");
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p
          dir="auto"
          className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-ee-md bg-primary px-3.5 py-2 text-[13px] leading-relaxed text-white"
        >
          {message.content}
        </p>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group flex justify-start">
      <div className="max-w-[92%] min-w-0 rounded-2xl rounded-es-md border border-border bg-card px-3.5 py-2.5 text-text">
        <ToolActivity tools={message.tools} />
        {message.content ? (
          <div className="relative">
            <AssistantMarkdown>{message.content}</AssistantMarkdown>
            {message.streaming && <span aria-hidden className="ms-0.5 inline-block h-3.5 w-[3px] translate-y-0.5 animate-pulse bg-primary" />}
          </div>
        ) : (
          message.streaming && message.tools.every((x) => x.status !== "running") && (
            <span className="inline-flex gap-1" aria-label={t("thinking")}>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtext" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtext [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtext [animation-delay:240ms]" />
            </span>
          )
        )}
        {!message.streaming && message.content && (
          <div className="mt-1.5 flex justify-end opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? t("copied") : t("copy")}
              title={copied ? t("copied") : t("copy")}
              className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-subtext hover:bg-muted hover:text-text cursor-pointer"
            >
              <DashIcon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
