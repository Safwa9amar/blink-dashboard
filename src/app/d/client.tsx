"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, PageHeader, StatCard, StatGrid } from "@/components/ui";
import { ActivityFeed, AttentionList, BlockError, OrdersChart, PipelineCard, type Block, type OverviewData } from "@/features/overview";
import { money } from "@/features/overview/components/format";
import { useDocumentTitle } from "@/lib/use-document-title";

function Kpi<T>({
  block, label, icon, variant, render, errorLabel,
}: {
  errorLabel: string;
  block: Block<T> | undefined;
  label: string;
  icon: string;
  variant: "primary" | "success" | "info" | "warning" | "danger";
  render: (d: T) => { value: string | number; change?: string };
}) {
  if (!block) return null;
  if ("error" in block) return <StatCard label={label} value="—" variant="default" icon={icon} change={errorLabel} />;
  const { value, change } = render(block.data);
  return <StatCard label={label} value={value} variant={variant} icon={icon} change={change} />;
}

function Section<T>({ block, children }: { block: Block<T> | undefined; children: (d: T) => React.ReactNode }) {
  if (!block) return null;
  if ("error" in block) return <Card><BlockError /></Card>;
  return <>{children(block.data)}</>;
}

export default function DashboardClient({ data }: { data: OverviewData }) {
  const t = useTranslations("overview");
  const locale = useLocale();
  useDocumentTitle(t("title"));

  const hasKpi = data.ordersToday || data.riders || data.cash || data.waiting;

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      {hasKpi && (
        <StatGrid cols={5}>
          <Kpi block={data.ordersToday} label={t("kpi.orders_today")} icon="package" variant="primary" errorLabel={t("block_error")} render={(d) => ({ value: d.count })} />
          <Kpi block={data.ordersToday} label={t("kpi.order_value")} icon="trending" variant="info" errorLabel={t("block_error")} render={(d) => ({ value: money(d.value, locale) })} />
          <Kpi block={data.riders} label={t("kpi.riders_available")} icon="bike" variant="success" errorLabel={t("block_error")} render={(d) => ({ value: d.available, change: t("kpi.riders_of", { total: d.total.toLocaleString(locale) }) })} />
          <Kpi block={data.cash} label={t("kpi.blink_cash")} icon="wallet" variant="warning" errorLabel={t("block_error")} render={(d) => ({ value: money(d.total, locale), change: t("kpi.cash_count", { count: d.count }) })} />
          <Kpi block={data.waiting} label={t("kpi.waiting")} icon="bell" variant="danger" errorLabel={t("block_error")} render={(d) => ({ value: d })} />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {data.chart && (
          <div className="xl:col-span-2">
            <Section block={data.chart}>{(pts) => <OrdersChart points={pts} />}</Section>
          </div>
        )}
        <Section block={data.pipeline}>{(p) => <PipelineCard pipeline={p} />}</Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Section block={data.attention}>{(rows) => <AttentionList rows={rows} />}</Section>
        {data.activity && (
          <div className="xl:col-span-2">
            <Section block={data.activity}>{(items) => <ActivityFeed items={items} />}</Section>
          </div>
        )}
      </div>
    </div>
  );
}
