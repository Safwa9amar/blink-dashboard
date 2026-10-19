"use client";

import { useTranslations } from "next-intl";
import { DashIcon, Spinner } from "@/components/ui";
import type { ToolRun } from "../types";

export function ToolActivity({ tools }: { tools: ToolRun[] }) {
  const t = useTranslations("assistant");
  if (tools.length === 0) return null;
  return (
    <ul className="mb-2 space-y-1" aria-live="polite">
      {tools.map((tool, i) => (
        <li key={tool.id ?? `${tool.name}-${i}`} className="flex items-center gap-1.5 text-xs text-subtext">
          {tool.status === "running" ? (
            <>
              <Spinner className="w-3.5 h-3.5 shrink-0" />
              <span>{t("tool.running", { title: tool.title })}</span>
            </>
          ) : tool.status === "done" ? (
            <>
              <DashIcon name="check" className="w-3.5 h-3.5 text-success shrink-0" />
              <span>
                {tool.rowCount != null ? t("tool.done_rows", { title: tool.title, count: tool.rowCount }) : t("tool.done", { title: tool.title })}
              </span>
            </>
          ) : (
            <>
              <DashIcon name="x" className="w-3.5 h-3.5 text-danger shrink-0" />
              <span>{t("tool.failed", { title: tool.title })}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
