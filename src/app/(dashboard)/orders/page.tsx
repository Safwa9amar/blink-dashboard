import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const statusVariant: Record<string, "success" | "danger" | "info" | "warning" | "primary" | "default"> = {
  delivered: "success",
  canceled: "danger",
  merchant_rejected: "danger",
  on_the_way: "info",
  searching: "warning",
  processing: "warning",
  preparation: "warning",
  pickup: "primary",
  heading_to_store: "info",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "store_name",
      label: "Store",
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">{row.store_name as string}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{row.type as string}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: Record<string, unknown>) => (
        <Badge variant={statusVariant[row.status as string] ?? "default"}>
          {(row.status as string).replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium">{(row.total as number)?.toFixed(2)} DA</span>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (row: Record<string, unknown>) => (
        <span>{(row.items as unknown[])?.length ?? 0}</span>
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
      <PageHeader title="Orders" description="Track and manage all orders" />
      <DataTable columns={columns} data={orders} error={error?.message} emptyMessage="No orders found." />
    </div>
  );
}
