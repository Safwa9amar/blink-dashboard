import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("users");
  const tc = await getTranslations("common");

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">
          {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    { key: "phone_number", label: t("phone") },
    {
      key: "role",
      label: t("role"),
      render: (row: Record<string, unknown>) => (
        <Badge variant={roleVariant[row.role as string] ?? "default"}>
          {row.role as string}
        </Badge>
      ),
    },
    {
      key: "gender",
      label: t("gender"),
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{(row.gender as string) ?? "—"}</span>
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
      <DataTable columns={columns} data={users} error={error?.message} emptyMessage={t("empty")} />
    </div>
  );
}
