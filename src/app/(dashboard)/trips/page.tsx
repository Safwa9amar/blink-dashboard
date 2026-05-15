import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400",
  canceled: "bg-red-500/10 text-red-400",
  upcoming: "bg-blue-500/10 text-blue-400",
  under_review: "bg-yellow-500/10 text-yellow-400",
};

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Trips</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Pickup</th>
              <th className="px-6 py-3">Dropoff</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Distance</th>
              <th className="px-6 py-3">Payout</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {error ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-red-400">{error.message}</td>
              </tr>
            ) : !trips?.length ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No trips found.</td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-mono text-blue-400">{trip.display_id}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{trip.pickup_label}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{trip.dropoff_label}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[trip.status] ?? "bg-gray-800 text-gray-400"}`}>
                      {trip.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">{trip.distance_km} km</td>
                  <td className="px-6 py-4 font-mono">{trip.net_payout?.toFixed(2)} DA</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(trip.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
