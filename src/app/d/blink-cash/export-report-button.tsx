"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { btnPrimary } from "@/components/ui/primitives";
import { parseCashDays } from "@/features/blink-cash/report";

function Link() {
  const t = useTranslations("blink_cash");
  const days = parseCashDays(useSearchParams().get("days") ?? undefined);
  return (
    <a href={`/blink-cash/export/report?days=${days}`} download className={btnPrimary}>
      <DashIcon name="download" className="w-4 h-4" />
      {t("export_report")}
    </a>
  );
}

/** Header "Export report": a period CSV (summary + transactions) for the Overview's `?days=` window. */
export function ExportReportButton() {
  return (
    <Suspense fallback={null}>
      <Link />
    </Suspense>
  );
}
