"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, ChartHead } from "@/components/ui";
import { fmtPct } from "../format";
import type { StoreStat } from "../types";

export function TopStores({ stores }: { stores: StoreStat[] }) {
  const t = useTranslations("demand");
  const locale = useLocale();
  const top = stores.slice(0, 8);
  const max = Math.max(1, ...top.map((s) => s.orders));
  return (
    <Card>
      <ChartHead title={t("charts.top_stores")} description={t("charts.top_stores_desc")} />
      {top.length === 0 ? (
        <p className="text-sm text-subtext py-12 text-center">{t("empty")}</p>
      ) : (
        top.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
            <span className="w-[26px] h-[26px] rounded-lg bg-soft-pink text-primary flex items-center justify-center font-extrabold text-xs shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <b className="block text-sm font-semibold text-text truncate" dir="auto">{s.name}</b>
              <span className="text-[11.5px] text-subtext">{t("cols.completion")}: {fmtPct(s.completionRate, locale)}</span>
            </div>
            <div className="w-[70px] h-[7px] rounded-full bg-muted overflow-hidden shrink-0">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.orders / max) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-text min-w-[32px] text-end tabular-nums">{s.orders.toLocaleString(locale)}</span>
          </div>
        ))
      )}
    </Card>
  );
}
