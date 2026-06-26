"use client";

import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";

// Shared placeholder banner for the not-yet-wired monitoring tabs (Health,
// Traffic, AI Insights, Alerts). It flags that the surface renders a layout
// preview over sample data — the real metrics land per the monitoring roadmap.
export function PreviewBanner() {
  const t = useTranslations("blink_server.preview");
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning-light px-4 py-2.5 text-[13px]">
      <DashIcon name="warn" className="h-4 w-4 shrink-0 text-warning" />
      <span className="font-semibold text-warning">{t("badge")}</span>
      <span className="text-subtext">{t("note")}</span>
    </div>
  );
}
