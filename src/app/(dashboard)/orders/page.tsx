import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  delivered: "bg-green-500/10 text-green-400",
  canceled: "bg-red-500/10 text-red-400",
  merchant_rejected: "bg-red-500/10 text-red-400",
  on_the_way: "bg-blue-500/10 text-blue-400",
  searching: "bg-yellow-500/10 text-yellow-400",
  processing: "bg-yellow-500/10 text-yellow-400",
  preparation: "bg-orange-500/10 text-orange-400",
  pickup: "bg-purple-500/10 text-purple-400",
  heading_to_store: "bg-indigo-500/10 text-indigo-400",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Store</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {error ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-red-400">{error.message}</td>
              </tr>
            ) : !orders?.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-white">{order.store_name}</td>
                  <td className="px-6 py-4 capitalize">{order.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[order.status] ?? "bg-gray-800 text-gray-400"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{order.total?.toFixed(2)} DA</td>
                  <td className="px-6 py-4">{order.items?.length ?? 0}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
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
