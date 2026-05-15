import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader, StatCard, Card, CardHeader } from "@/components/ui";

async function getStats() {
  const supabase = await createClient();

  const [users, riders, orders, trips, transactions] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("rider_profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
  ]);

  return {
    users: users.count ?? 0,
    riders: riders.count ?? 0,
    orders: orders.count ?? 0,
    trips: trips.count ?? 0,
    transactions: transactions.count ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  const t = await getTranslations("overview");

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label={t("total_users")} value={stats.users} variant="primary" />
        <StatCard label={t("active_riders")} value={stats.riders} variant="success" />
        <StatCard label={t("orders")} value={stats.orders} variant="info" />
        <StatCard label={t("trips")} value={stats.trips} variant="warning" />
        <StatCard label={t("transactions")} value={stats.transactions} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={t("recent_orders")} description={t("recent_orders_desc")} />
          <p className="text-subtext text-sm">{t("placeholder_text")}</p>
        </Card>
        <Card>
          <CardHeader title={t("recent_trips")} description={t("recent_trips_desc")} />
          <p className="text-subtext text-sm">{t("placeholder_text")}</p>
        </Card>
      </div>
    </div>
  );
}
