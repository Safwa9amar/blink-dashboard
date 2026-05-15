import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const typeVariant: Record<string, "info" | "success" | "primary" | "danger" | "warning" | "default"> = {
  order: "info",
  courier: "success",
  promo: "primary",
  alert: "danger",
  security: "danger",
  deposit: "warning",
  news: "info",
  announcement: "warning",
  benefit: "primary",
  offer: "success",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const t = await getTranslations("notifications");
  const tc = await getTranslations("common");

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "type",
      label: t("type"),
      render: (row: Record<string, unknown>) => (
        <Badge variant={typeVariant[row.type as string] ?? "default"}>
          {row.type as string}
        </Badge>
      ),
    },
    {
      key: "title",
      label: t("title_col"),
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">{row.title as string}</span>
      ),
    },
    {
      key: "description",
      label: t("description_col"),
      className: "max-w-[300px] truncate",
    },
    {
      key: "is_unread",
      label: t("read"),
      render: (row: Record<string, unknown>) => (
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${row.is_unread ? "bg-primary" : "bg-border"}`} />
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
      <DataTable columns={columns} data={notifications} error={error?.message} emptyMessage={t("empty")} />
    </div>
  );
}
