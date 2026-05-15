import { createClient } from "@/lib/supabase/server";

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

  const cards = [
    { label: "Total Users", value: stats.users, color: "blue" },
    { label: "Active Riders", value: stats.riders, color: "green" },
    { label: "Orders", value: stats.orders, color: "purple" },
    { label: "Trips", value: stats.trips, color: "orange" },
    { label: "Transactions", value: stats.transactions, color: "pink" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 ${colorMap[card.color]}`}
          >
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
          <p className="text-gray-500 text-sm">Connect your Supabase credentials to see live data.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Trips</h2>
          <p className="text-gray-500 text-sm">Connect your Supabase credentials to see live data.</p>
        </div>
      </div>
    </div>
  );
}
