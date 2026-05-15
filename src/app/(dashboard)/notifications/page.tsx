import { createClient } from "@/lib/supabase/server";
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
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "type",
      label: "Type",
      render: (row: Record<string, unknown>) => (
        <Badge variant={typeVariant[row.type as string] ?? "default"}>
          {row.type as string}
        </Badge>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">{row.title as string}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      className: "max-w-[300px] truncate",
    },
    {
      key: "is_unread",
      label: "Read",
      render: (row: Record<string, unknown>) => (
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${row.is_unread ? "bg-primary" : "bg-border"}`} />
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
      <PageHeader title="Notifications" description="View all sent notifications" />
      <DataTable columns={columns} data={notifications} error={error?.message} emptyMessage="No notifications found." />
    </div>
  );
}
