"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import type { StaffRole } from "@/lib/auth/access";
import { startersFor } from "../starters";
import type { AssistantToolInfo } from "../types";

export function AssistantEmptyState({
  staffRole,
  staffName,
  tools,
  onPick,
}: {
  staffRole: StaffRole;
  staffName: string;
  tools: AssistantToolInfo[];
  onPick: (text: string) => void;
}) {
  const t = useTranslations("assistant");
  const [showTools, setShowTools] = useState(false);
  const first = staffName.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col items-center px-1 pt-6 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-soft-pink text-primary">
        <DashIcon name="sparkles" className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-text">{first ? t("greeting", { name: first }) : t("greeting_anon")}</h3>
      <p className="mt-1 text-xs text-subtext">{t("readonly_note")}</p>

      <div className="mt-5 grid w-full gap-2">
        {startersFor(staffRole).map((key) => {
          const text = t(`starters.${key}` as never);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(text)}
              className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-start text-[13px] text-text transition-colors hover:border-primary hover:bg-card-hover cursor-pointer"
            >
              {text}
            </button>
          );
        })}
      </div>

      {tools.length > 0 && (
        <div className="mt-5 w-full text-start">
          <button
            type="button"
            onClick={() => setShowTools((v) => !v)}
            aria-expanded={showTools}
            className="inline-flex items-center gap-1 text-xs font-semibold text-subtext hover:text-text cursor-pointer"
          >
            <DashIcon name="chevron-down" className={`h-3.5 w-3.5 transition-transform ${showTools ? "" : "-rotate-90 rtl:rotate-90"}`} />
            {t("data_access", { count: tools.length })}
          </button>
          {showTools && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tools.map((tool) => (
                <li key={tool.name} className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-subtext">
                  {tool.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
