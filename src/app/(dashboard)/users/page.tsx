import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const roleVariant: Record<string, "primary" | "success" | "info" | "warning" | "default"> = {
  super_admin: "primary",
  rider: "success",
  merchant: "info",
  agent: "warning",
  customer: "default",
};

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">
          {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    { key: "phone_number", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (row: Record<string, unknown>) => (
        <Badge variant={roleVariant[row.role as string] ?? "default"}>
          {row.role as string}
        </Badge>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{(row.gender as string) ?? "—"}</span>
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
      <PageHeader title="Users" description="Manage all platform users" />
      <DataTable columns={columns} data={users} error={error?.message} emptyMessage="No users found." />
    </div>
  );
}
