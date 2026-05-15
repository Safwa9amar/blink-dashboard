import { createClient } from "@/lib/supabase/server";
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

  return (
    <div>
      <PageHeader title="Overview" description="Your Blink platform at a glance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.users} variant="primary" />
        <StatCard label="Active Riders" value={stats.riders} variant="success" />
        <StatCard label="Orders" value={stats.orders} variant="info" />
        <StatCard label="Trips" value={stats.trips} variant="warning" />
        <StatCard label="Transactions" value={stats.transactions} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Orders" description="Latest order activity" />
          <p className="text-subtext text-sm">Order data will appear here once connected.</p>
        </Card>
        <Card>
          <CardHeader title="Recent Trips" description="Latest trip activity" />
          <p className="text-subtext text-sm">Trip data will appear here once connected.</p>
        </Card>
      </div>
    </div>
  );
}
