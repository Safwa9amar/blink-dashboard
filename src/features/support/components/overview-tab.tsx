import {
  StatGrid,
  StatCard,
  Card,
  ChartHead,
  ColumnChart,
  Legend,
  Donut,
  DashIcon,
} from "@/components/ui";
import {
  VOLUME_SERIES,
  VOLUME_MAX,
  VOLUME_COLORS,
  CHANNELS,
  SLA_DONUT,
  TOP_ISSUES,
} from "../data";
import type { TFn } from "../types";

// Manager / admin "at a glance" dashboard — SLA compliance, CSAT, volume,
// channel mix and the issue themes driving load.
export function OverviewTab({ t }: { t: TFn }) {
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("ov.backlog")} value={60} variant="danger" icon="support" change={t("ov.backlog_chg")} />
        <StatCard label={t("ov.frt")} value="2.4m" variant="info" icon="clock" change={t("ov.frt_chg")} />
        <StatCard label={t("ov.sla")} value="91%" variant="success" icon="shield" change={t("ov.sla_chg")} />
        <StatCard label={t("ov.csat")} value="4.6" variant="primary" icon="star" change={t("ov.csat_chg")} />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-5 items-start">
        <Card>
          <ChartHead
            title={t("ov.volume")}
            description={t("ov.volume_desc")}
            right={<Legend items={[{ label: t("ov.created"), color: VOLUME_COLORS[0] }, { label: t("ov.resolved"), color: VOLUME_COLORS[1] }]} />}
          />
          <ColumnChart data={VOLUME_SERIES} max={VOLUME_MAX} colors={VOLUME_COLORS} height={200} peakIndex={5} peakLabel={t("ov.peak")} />
        </Card>
        <Card>
          <ChartHead title={t("ov.channels")} description={t("ov.channels_desc")} />
          <Donut segments={CHANNELS} centerValue="1.3K" centerLabel={t("ov.this_week")} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 items-start">
        <Card>
          <ChartHead title={t("ov.sla_compliance")} description={t("ov.sla_compliance_desc")} />
          <Donut segments={SLA_DONUT} centerValue="91%" centerLabel={t("ov.met")} />
        </Card>
        <Card title={t("ov.top_issues")} description={t("ov.top_issues_desc")}>
          <div className="space-y-3.5">
            {TOP_ISSUES.map((iss) => (
              <div key={iss.cat} className="flex items-center gap-3.5">
                <DashIcon name="warn" className="w-4 h-4 text-subtext shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold text-text truncate">{iss.cat}</span>
                    <span className="text-[12px] text-subtext tabular-nums ms-2">{t("ov.issue_count", { n: iss.count })}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${iss.pct * 3.5}%` }} />
                  </div>
                </div>
                <span className={`text-[12px] font-bold tabular-nums w-12 text-end ${iss.up ? "text-danger" : "text-success"}`}>{iss.trend}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
