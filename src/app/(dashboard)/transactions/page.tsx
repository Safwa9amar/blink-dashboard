import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const statusVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
  completed: "success",
  cancelled: "danger",
  pending: "warning",
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "type",
      label: "Type",
      render: (row: Record<string, unknown>) => (
        <Badge variant={(row.type as string) === "deposit" ? "success" : "info"}>
          {row.type as string}
        </Badge>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{(row.method as string) ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono">{(row.amount as number)?.toFixed(2)} DA</span>
      ),
    },
    {
      key: "fees",
      label: "Fees",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-subtext">{(row.fees as number)?.toFixed(2)} DA</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium text-text">{(row.total as number)?.toFixed(2)} DA</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: Record<string, unknown>) => (
        <Badge variant={statusVariant[row.status as string] ?? "default"}>
          {row.status as string}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (row: Record<string, unknown>) => (
        <span className="text-subtext">
          {new Date(row.created_at as string).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Transactions" description="Track deposits and withdrawals" />
      <DataTable columns={columns} data={transactions} error={error?.message} emptyMessage="No transactions found." />
    </div>
  );
}
