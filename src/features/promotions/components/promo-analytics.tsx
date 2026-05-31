"use client";

import { useTranslations } from "next-intl";
import { StatGrid, StatCard, Card, ChartHead, ColumnChart, Donut } from "@/components/ui";
import { PROMO_BYCAT, PROMO_WEEK } from "../data";

export function PromoAnalytics() {
  const t = useTranslations("promotions");
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("an.redemptions7")} value="42,180" variant="primary" icon="trending" change={t("an.redemptions7_chg")} />
        <StatCard label={t("an.lift")} value="+18%" variant="success" icon="dollar" change={t("an.lift_chg")} />
        <StatCard label={t("an.spend_red")} value="34 DA" variant="warning" icon="tag" change={t("an.spend_red_chg")} />
        <StatCard label={t("an.best")} value="Student −25%" variant="info" icon="gift" change={t("an.best_chg")} />
      </StatGrid>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <ChartHead title={t("an.week")} description={t("an.week_desc")} />
          <ColumnChart
            data={PROMO_WEEK.map(([label, v]) => ({ label, values: [v] }))}
            max={100}
            colors={["var(--primary)"]}
            height={150}
          />
        </Card>
        <Card>
          <ChartHead title={t("an.by_service")} description={t("an.by_service_desc")} />
          <Donut segments={PROMO_BYCAT} centerValue="42k" centerLabel={t("an.used")} />
        </Card>
      </div>
    </>
  );
}
