import { createClient } from "@/lib/supabase/server";

export default async function RidersPage() {
  const supabase = await createClient();
  const { data: riders, error } = await supabase
    .from("rider_profiles")
    .select("*, users(first_name, last_name, phone_number)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Riders</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Rider ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Wilaya</th>
              <th className="px-6 py-3">Vehicle</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {error ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-red-400">
                  {error.message}
                </td>
              </tr>
            ) : !riders?.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No riders found.
                </td>
              </tr>
            ) : (
              riders.map((rider) => {
                const user = rider.users as { first_name: string | null; last_name: string | null; phone_number: string } | null;
                return (
                  <tr key={rider.id} className="text-gray-300 hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-blue-400">{rider.rider_id}</td>
                    <td className="px-6 py-4 font-medium text-white">
                      {user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "—"}
                    </td>
                    <td className="px-6 py-4">{user?.phone_number ?? "—"}</td>
                    <td className="px-6 py-4">{rider.wilaya ?? "—"}</td>
                    <td className="px-6 py-4 capitalize">{rider.vehicle_type ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(rider.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
