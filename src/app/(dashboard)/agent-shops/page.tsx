import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

export default async function AgentShopsPage() {
  const supabase = await createClient();
  const t = await getTranslations("agent_shops");

  const { data: shops, error } = await supabase
    .from("agent_shops")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "shop_name",
      label: t("shop_name"),
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-text">{row.shop_name as string}</span>
      ),
    },
    {
      key: "phone_number",
      label: t("phone"),
      render: (row: Record<string, unknown>) => (row.phone_number as string) ?? "—",
    },
    {
      key: "status",
      label: t("status"),
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <Badge variant={status === "open" ? "success" : "danger"}>
            {t(`statuses.${status}` as Parameters<typeof t>[0])}
          </Badge>
        );
      },
    },
    {
      key: "hours",
      label: t("hours"),
      render: (row: Record<string, unknown>) => `${row.open_time} - ${row.close_time}`,
    },
    {
      key: "rating",
      label: t("rating"),
      render: (row: Record<string, unknown>) => (
        <span className="text-warning font-medium">{(row.rating as number)?.toFixed(1)}</span>
      ),
    },
    {
      key: "address",
      label: t("address"),
      className: "max-w-[200px] truncate",
      render: (row: Record<string, unknown>) => (row.address as string) ?? "—",
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable columns={columns} data={shops} error={error?.message} emptyMessage={t("empty")} />
    </div>
  );
}
