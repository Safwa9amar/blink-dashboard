import { StatGrid, StatCard, Card, ChartHead, ColumnChart, DashIcon, Badge, CHART } from "@/components/ui";
import { CSAT_TREND, CSAT_DIST, CSAT_RESPONSES } from "../data";
import type { TFn } from "../types";

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <DashIcon key={i} name="star" className={`w-3.5 h-3.5 ${i <= score ? "text-warning" : "text-border"}`} />
      ))}
    </span>
  );
}

export function CsatTab({ t }: { t: TFn }) {
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("csa.score")} value="4.6" variant="primary" icon="star" change={t("csa.score_chg")} />
        <StatCard label={t("csa.responses")} value="2.6K" variant="info" icon="chat" change={t("csa.responses_chg")} />
        <StatCard label={t("csa.positive")} value="88%" variant="success" icon="trending" change={t("csa.positive_chg")} />
        <StatCard label={t("csa.detractors")} value={165} variant="danger" icon="warn" change={t("csa.detractors_chg")} />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-start">
        <Card>
          <ChartHead title={t("csa.trend")} description={t("csa.trend_desc")} />
          <ColumnChart data={CSAT_TREND} max={5} colors={[CHART.primary]} height={170} peakIndex={5} peakLabel="4.6" />
        </Card>
        <Card title={t("csa.distribution")} description={t("csa.distribution_desc")}>
          <div className="space-y-2.5">
            {CSAT_DIST.map((d) => (
              <div key={d.stars} className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-text w-8">
                  {d.stars}
                  <DashIcon name="star" className="w-3 h-3 text-warning" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-warning" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-[12px] text-subtext tabular-nums w-12 text-end">{d.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={t("csa.recent")} description={t("csa.recent_desc")}>
        {CSAT_RESPONSES.map((r, i) => (
          <div key={i} className="flex gap-3.5 items-start py-3.5 border-t border-border first:border-t-0">
            <Stars score={r.score} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text leading-snug">“{r.comment}”</p>
              <p className="text-[11.5px] text-subtext mt-1">
                {r.who} · {t("csa.handled_by", { agent: r.agent })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="default">{r.cat}</Badge>
              <span className="text-[11px] text-subtext">{r.time}</span>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
