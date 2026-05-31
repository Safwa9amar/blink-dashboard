import { Card, Donut, ChartHead } from "@/components/ui";
import { SERVICES } from "../data";

export function ServiceMixChart({
  t,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <ChartHead title={t("charts.service_mix")} description={t("charts.service_mix_desc")} />
      <Donut segments={SERVICES} centerValue="342" centerLabel={t("charts.orders")} />
    </Card>
  );
}
