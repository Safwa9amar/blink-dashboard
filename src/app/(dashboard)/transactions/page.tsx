import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
  pending: "bg-yellow-500/10 text-yellow-400",
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Transactions</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Fees</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {error ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-red-400">{error.message}</td>
              </tr>
            ) : !transactions?.length ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transactions found.</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4 capitalize">{tx.type}</td>
                  <td className="px-6 py-4 capitalize">{tx.method ?? "—"}</td>
                  <td className="px-6 py-4 font-mono">{tx.amount?.toFixed(2)} DA</td>
                  <td className="px-6 py-4 font-mono text-gray-500">{tx.fees?.toFixed(2)} DA</td>
                  <td className="px-6 py-4 font-mono font-medium text-white">{tx.total?.toFixed(2)} DA</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[tx.status] ?? "bg-gray-800 text-gray-400"}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString()}
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
