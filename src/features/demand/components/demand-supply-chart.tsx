import { Card, ColumnChart, ChartHead, Legend } from "@/components/ui";
import { HOURS, HMAX, PEAK } from "../data";

export function DemandSupplyChart({
  t,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <ChartHead
        title={t("charts.demand_supply")}
        description={t("charts.demand_supply_desc")}
        right={
          <Legend
            items={[
              { label: t("charts.demand"), color: "var(--primary)" },
              { label: t("charts.riders"), color: "color-mix(in srgb,var(--info) 55%,transparent)" },
            ]}
          />
        }
      />
      <ColumnChart
        data={HOURS.map(([h, dem]) => ({ label: String(h), values: [dem] }))}
        max={HMAX}
        colors={["var(--primary)"]}
        peakIndex={HOURS.findIndex(([h]) => h === PEAK)}
        peakLabel={t("charts.peak")}
      />
    </Card>
  );
}
