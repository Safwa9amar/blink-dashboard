import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const statusVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
  completed: "success",
  cancelled: "danger",
  pending: "warning",
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const t = await getTranslations("transactions");
  const tc = await getTranslations("common");

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "type",
      label: t("type"),
      render: (row: Record<string, unknown>) => (
        <Badge variant={(row.type as string) === "deposit" ? "success" : "info"}>
          {t(`types.${row.type as string}` as Parameters<typeof t>[0])}
        </Badge>
      ),
    },
    {
      key: "method",
      label: t("method"),
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{(row.method as string) ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      label: t("amount"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono">{(row.amount as number)?.toFixed(2)} {tc("da")}</span>
      ),
    },
    {
      key: "fees",
      label: t("fees"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-subtext">{(row.fees as number)?.toFixed(2)} {tc("da")}</span>
      ),
    },
    {
      key: "total",
      label: t("total"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium text-text">{(row.total as number)?.toFixed(2)} {tc("da")}</span>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (row: Record<string, unknown>) => (
        <Badge variant={statusVariant[row.status as string] ?? "default"}>
          {row.status as string}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: tc("created"),
      render: (row: Record<string, unknown>) => (
        <span className="text-subtext">
          {new Date(row.created_at as string).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable columns={columns} data={transactions} error={error?.message} emptyMessage={t("empty")} />
    </div>
  );
}
