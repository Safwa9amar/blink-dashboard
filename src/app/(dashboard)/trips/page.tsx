import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader, DataTable, Badge } from "@/components/ui";

const statusVariant: Record<string, "success" | "danger" | "info" | "warning" | "default"> = {
  completed: "success",
  canceled: "danger",
  upcoming: "info",
  under_review: "warning",
};

export default async function TripsPage() {
  const supabase = await createClient();
  const t = await getTranslations("trips");
  const tc = await getTranslations("common");

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const columns = [
    {
      key: "display_id",
      label: t("id"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-primary font-medium">{row.display_id as string}</span>
      ),
    },
    { key: "pickup_label", label: t("pickup"), className: "max-w-[200px] truncate" },
    { key: "dropoff_label", label: t("dropoff"), className: "max-w-[200px] truncate" },
    {
      key: "status",
      label: t("status"),
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <Badge variant={statusVariant[status] ?? "default"}>
            {t(`statuses.${status}` as Parameters<typeof t>[0])}
          </Badge>
        );
      },
    },
    {
      key: "distance_km",
      label: t("distance"),
      render: (row: Record<string, unknown>) => `${row.distance_km} km`,
    },
    {
      key: "net_payout",
      label: t("payout"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium">{(row.net_payout as number)?.toFixed(2)} {tc("da")}</span>
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
      <DataTable columns={columns} data={trips} error={error?.message} emptyMessage={t("empty")} />
    </div>
  );
}
