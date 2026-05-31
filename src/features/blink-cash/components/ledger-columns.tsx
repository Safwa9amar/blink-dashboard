import { Badge, DashIcon, type Column } from "@/components/ui";
import { TX_TYPE_ICON, TX_METHOD_ICON, TX_STATUS_VARIANT, type BlinkTransaction } from "../data";
import type { TFn } from "../types";

const money = (n: number) => Number(n ?? 0).toLocaleString();

export function ledgerColumns(t: TFn): Column<BlinkTransaction>[] {
  return [
    {
      key: "id",
      label: t("col.txn"),
      render: (r) => <span className="font-mono text-primary font-semibold">{r.id.slice(0, 8)}</span>,
    },
    {
      key: "type",
      label: t("col.type"),
      render: (r) => (
        <span className="flex items-center gap-2">
          <DashIcon name={TX_TYPE_ICON[r.type] ?? "wallet"} className="w-4 h-4 text-subtext" />
          <span>{t(`tx_type.${r.type}`)}</span>
        </span>
      ),
    },
    {
      key: "method",
      label: t("col.method"),
      render: (r) =>
        r.method ? (
          <span className="flex items-center gap-2 text-subtext">
            <DashIcon name={TX_METHOD_ICON[r.method] ?? "card"} className="w-4 h-4" />
            <span>{t(`method.${r.method}`)}</span>
          </span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "amount",
      label: t("col.amount"),
      render: (r) => {
        const credit = r.type === "deposit";
        return (
          <span className={`font-mono font-semibold ${credit ? "text-success" : "text-text"}`}>
            {credit ? "+" : "−"}
            {money(r.amount)} DA
          </span>
        );
      },
    },
    {
      key: "fees",
      label: t("col.fees"),
      render: (r) => <span className="font-mono text-subtext">{r.fees ? `${money(r.fees)} DA` : "—"}</span>,
    },
    {
      key: "total",
      label: t("col.total"),
      render: (r) => <span className="font-mono font-medium text-text">{money(r.total)} DA</span>,
    },
    {
      key: "offer_title",
      label: t("col.offer"),
      sortable: false,
      render: (r) =>
        r.offer_title ? (
          <span className="flex items-center gap-2">
            <span className="text-text">{r.offer_title}</span>
            {r.rating ? (
              <span className="inline-flex items-center gap-0.5 text-warning text-xs font-medium">
                <DashIcon name="star" className="w-3.5 h-3.5" />
                {r.rating}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={TX_STATUS_VARIANT[r.status] ?? "default"}>{t(`tx_status.${r.status}`)}</Badge>,
    },
    {
      key: "created_at",
      label: t("col.when"),
      render: (r) => <span className="text-subtext">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
  ];
}
