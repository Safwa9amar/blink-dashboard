"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, ChartHead, DataTable, type Column } from "@/components/ui";
import { fmtMin, fmtPct } from "../format";
import type { AreaStat } from "../types";

export function TopAreas({ areas }: { areas: AreaStat[] }) {
  const t = useTranslations("demand");
  const locale = useLocale();
  const nw = "tabular-nums whitespace-nowrap";
  const columns: Column<AreaStat>[] = [
    { key: "label", label: t("cols.area"), render: (r) => <span className="font-semibold" dir="auto">{r.label}</span> },
    { key: "orders", label: t("cols.orders"), render: (r) => <span className={nw}>{r.orders.toLocaleString(locale)}</span> },
    { key: "unmetRate", label: t("cols.unmet"), render: (r) => <span className={`${nw} ${r.unmetRate > 0.25 ? "text-danger" : ""}`}>{fmtPct(r.unmetRate, locale)}</span> },
    { key: "medianWait", label: t("cols.wait"), render: (r) => <span className={nw}>{fmtMin(r.medianWait) == null ? "—" : t("min", { n: fmtMin(r.medianWait)! })}</span> },
    { key: "ridersNow", label: t("cols.riders"), render: (r) => <span className={nw}>{r.ridersNow.toLocaleString(locale)}</span> },
  ];
  return (
    <Card>
      <ChartHead title={t("charts.top_areas")} description={t("charts.top_areas_desc")} />
      {areas.length === 0 ? (
        <p className="text-sm text-subtext py-10 text-center">{t("empty")}</p>
      ) : (
        <DataTable<AreaStat> columns={columns} data={areas.slice(0, 10)} keyField="id" enablePagination={false} />
      )}
    </Card>
  );
}
