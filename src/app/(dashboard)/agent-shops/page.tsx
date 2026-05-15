import { createClient } from "@/lib/supabase/server";

export default async function AgentShopsPage() {
  const supabase = await createClient();
  const { data: shops, error } = await supabase
    .from("agent_shops")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Agent Shops</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Shop Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Hours</th>
              <th className="px-6 py-3">Rating</th>
              <th className="px-6 py-3">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {error ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-red-400">{error.message}</td>
              </tr>
            ) : !shops?.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No agent shops found.</td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-white">{shop.shop_name}</td>
                  <td className="px-6 py-4">{shop.phone_number ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      shop.status === "open"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{shop.open_time} - {shop.close_time}</td>
                  <td className="px-6 py-4">{shop.rating?.toFixed(1)}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{shop.address ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
