import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const statusVariant: Record<string, "success" | "danger" | "info" | "warning" | "default"> = {
  completed: "success",
  canceled: "danger",
  upcoming: "info",
  under_review: "warning",
};

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "display_id",
      label: "ID",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-primary font-medium">{row.display_id as string}</span>
      ),
    },
    {
      key: "pickup_label",
      label: "Pickup",
      className: "max-w-[200px] truncate",
    },
    {
      key: "dropoff_label",
      label: "Dropoff",
      className: "max-w-[200px] truncate",
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
      key: "distance_km",
      label: "Distance",
      render: (row: Record<string, unknown>) => `${row.distance_km} km`,
    },
    {
      key: "net_payout",
      label: "Payout",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium">{(row.net_payout as number)?.toFixed(2)} DA</span>
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
      <PageHeader title="Trips" description="Monitor all rider trips" />
      <DataTable columns={columns} data={trips} error={error?.message} emptyMessage="No trips found." />
    </div>
  );
}
