import { createClient } from "@/lib/supabase/server";

const typeColors: Record<string, string> = {
  order: "bg-blue-500/10 text-blue-400",
  courier: "bg-green-500/10 text-green-400",
  promo: "bg-purple-500/10 text-purple-400",
  alert: "bg-red-500/10 text-red-400",
  security: "bg-red-500/10 text-red-400",
  deposit: "bg-yellow-500/10 text-yellow-400",
  news: "bg-indigo-500/10 text-indigo-400",
  announcement: "bg-orange-500/10 text-orange-400",
  benefit: "bg-pink-500/10 text-pink-400",
  offer: "bg-teal-500/10 text-teal-400",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Read</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {error ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-red-400">{error.message}</td>
              </tr>
            ) : !notifications?.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No notifications found.</td>
              </tr>
            ) : (
              notifications.map((n) => (
                <tr key={n.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${typeColors[n.type] ?? "bg-gray-800 text-gray-400"}`}>
                      {n.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{n.title}</td>
                  <td className="px-6 py-4 max-w-[300px] truncate">{n.description}</td>
                  <td className="px-6 py-4">
                    <span className={`w-2 h-2 rounded-full inline-block ${n.is_unread ? "bg-blue-400" : "bg-gray-600"}`} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(n.created_at).toLocaleDateString()}
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
