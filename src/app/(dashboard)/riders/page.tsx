import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable } from "@/components/ui";

export default async function RidersPage() {
  const supabase = await createClient();
  const { data: riders, error } = await supabase
    .from("rider_profiles")
    .select("*, users(first_name, last_name, phone_number)")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "rider_id",
      label: "Rider ID",
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-primary font-medium">{row.rider_id as string}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (row: Record<string, unknown>) => {
        const user = row.users as { first_name: string | null; last_name: string | null } | null;
        return (
          <span className="font-medium text-text">
            {user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "—"}
          </span>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      render: (row: Record<string, unknown>) => {
        const user = row.users as { phone_number: string } | null;
        return user?.phone_number ?? "—";
      },
    },
    {
      key: "wilaya",
      label: "Wilaya",
      render: (row: Record<string, unknown>) => (row.wilaya as string) ?? "—",
    },
    {
      key: "vehicle_type",
      label: "Vehicle",
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{(row.vehicle_type as string) ?? "—"}</span>
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
      <PageHeader title="Riders" description="Manage rider profiles and vehicles" />
      <DataTable columns={columns} data={riders} error={error?.message} emptyMessage="No riders found." />
    </div>
  );
}
