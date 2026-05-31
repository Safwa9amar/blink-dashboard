"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { KpiCard } from "./kpi-card";
import type { Kpi } from "../types";


export function CountersPanel({ kpi }: { kpi: Kpi }) {
  const t = useTranslations("live_ops");
  const cov = Math.round((kpi.online / (kpi.active + kpi.enroute)) * 100);

  return (
    <Card title={t("counters")}>
      <KpiCard label={t("active_deliveries")} value={kpi.active} />
      <KpiCard label={t("enroute")} value={kpi.enroute} />
      <div className="flex flex-col gap-1 py-3.5 border-t border-border">
        <span className="text-[12.5px] text-subtext">{t("online")}</span>
        <span className="text-2xl font-extrabold text-text">{kpi.online}</span>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.min(100, cov)}%`, background: cov < 80 ? "var(--warning)" : "var(--success)" }}
          />
        </div>
        <span className="text-[11px] text-subtext">{t("coverage", { pct: cov })}</span>
      </div>
      <KpiCard label={t("agents_open")} value={kpi.agents} />
    </Card>
  );
}
