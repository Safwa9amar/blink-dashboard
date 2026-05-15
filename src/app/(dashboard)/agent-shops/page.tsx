import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

export default async function AgentShopsPage() {
  const supabase = await createClient();
  const { data: shops, error } = await supabase
    .from("agent_shops")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "shop_name",
      label: "Shop Name",
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">{row.shop_name as string}</span>
      ),
    },
    {
      key: "phone_number",
      label: "Phone",
      render: (row: Record<string, unknown>) => (row.phone_number as string) ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row: Record<string, unknown>) => (
        <Badge variant={(row.status as string) === "open" ? "success" : "danger"}>
          {row.status as string}
        </Badge>
      ),
    },
    {
      key: "hours",
      label: "Hours",
      render: (row: Record<string, unknown>) => `${row.open_time} - ${row.close_time}`,
    },
    {
      key: "rating",
      label: "Rating",
      render: (row: Record<string, unknown>) => (
        <span className="text-warning font-medium">{(row.rating as number)?.toFixed(1)}</span>
      ),
    },
    {
      key: "address",
      label: "Address",
      className: "max-w-[200px] truncate",
      render: (row: Record<string, unknown>) => (row.address as string) ?? "—",
    },
  ];

  return (
    <div>
      <PageHeader title="Agent Shops" description="Manage agent deposit locations" />
      <DataTable columns={columns} data={shops} error={error?.message} emptyMessage="No agent shops found." />
    </div>
  );
}
