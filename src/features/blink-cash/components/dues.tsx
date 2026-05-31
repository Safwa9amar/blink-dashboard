import { Button, Badge, StatGrid, StatCard, SearchBox, DataTable, NameCell, type Column } from "@/components/ui";
import { DUES, ROLE_VARIANT, DUE_STATUS, type DueRow } from "../data";
import type { TFn } from "../types";

export function Dues({ t }: { t: TFn }) {
  const totalDues = DUES.reduce((s, d) => s + d.dues, 0);
  const columns: Column<DueRow>[] = [
    { key: "who", label: t("col.account"), render: (r) => <NameCell name={r.who} /> },
    { key: "role", label: t("col.role"), render: (r) => <Badge variant={ROLE_VARIANT[r.role]}>{r.role}</Badge> },
    { key: "dues", label: t("tab_dues"), render: (r) => <span className="font-mono font-semibold text-primary">{r.dues.toLocaleString()} DA</span> },
    { key: "fees", label: t("col.fees"), render: (r) => <span className="font-mono text-subtext">{r.fees ? `${r.fees} DA` : "—"}</span> },
    {
      key: "due",
      label: t("col.due"),
      render: (r) => <span className={r.status === "overdue" ? "text-danger" : "text-subtext"}>{r.due}</span>,
    },
    { key: "status", label: t("col.status"), render: (r) => <Badge variant={DUE_STATUS[r.status]}>{r.status}</Badge> },
    { key: "act", label: "", render: () => <Button className="!px-3.5 !py-[7px]">{t("dues.remind")}</Button> },
  ];
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("dues.total")} value={`${(totalDues / 1000).toFixed(1)}K DA`} variant="warning" icon="dollar" change={t("dues.total_chg")} />
        <StatCard label={t("dues.overdue")} value="1" variant="danger" icon="fire" change={t("dues.overdue_chg")} />
        <StatCard label={t("dues.collected")} value="48K DA" variant="success" icon="trending" change={t("dues.collected_chg")} />
        <StatCard label={t("dues.ontime")} value="93%" variant="primary" icon="shield" change={t("dues.ontime_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("dues.search")} />
        <Button variant="secondary" icon="filter">{t("role_filter")}</Button>
      </div>
      <DataTable columns={columns} data={DUES} empty={t("dues.empty")} />
    </>
  );
}
