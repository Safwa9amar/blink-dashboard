import { Card, ColumnChart, ChartHead, Legend, DataTable } from "@/components/ui";
import { BC_WEEK, type BlinkTransaction } from "../data";
import { BCStats } from "./bc-stats";
import { ConfigRow } from "./config-row";
import { ledgerColumns } from "./ledger-columns";
import type { TFn } from "../types";

export function Overview({ t, txns, error }: { t: TFn; txns: BlinkTransaction[] | null; error?: string }) {
  return (
    <>
      <BCStats t={t} />
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mb-5">
        <Card>
          <ChartHead
            title={t("chart.dvw")}
            description={t("chart.dvw_desc")}
            right={
              <Legend
                items={[
                  { label: t("chart.deposits"), color: "var(--success)" },
                  { label: t("chart.withdrawals"), color: "color-mix(in srgb,var(--info) 60%,transparent)" },
                ]}
              />
            }
          />
          <ColumnChart
            data={BC_WEEK.map(([label, dep, wd]) => ({ label, values: [dep, wd] }))}
            max={100}
            colors={["var(--success)", "color-mix(in srgb,var(--info) 60%,transparent)"]}
            height={150}
          />
        </Card>
        <Card>
          <ChartHead title={t("cfg.title")} description={t("cfg.desc")} />
          <ConfigRow k={t("cfg.deposit_agent")} v={t("cfg.free")} first />
          <ConfigRow k={t("cfg.deposit_card")} v="1%" />
          <ConfigRow k={t("cfg.withdrawal")} v="50 DA" />
          <ConfigRow k={t("cfg.commission")} v="2%" />
          <ConfigRow k={t("cfg.trip_tax")} v="5%" />
          <ConfigRow k={t("cfg.pin")} v={<span className="text-success">{t("cfg.enforced")}</span>} />
        </Card>
      </div>
      <Card title={t("latest.title")} description={t("latest.desc")}>
        <DataTable
          columns={ledgerColumns(t)}
          data={(txns ?? []).slice(0, 5)}
          error={error}
          empty={t("ledger.empty")}
          enablePagination={false}
        />
      </Card>
    </>
  );
}
