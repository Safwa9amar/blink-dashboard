import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/features/blink-cash/lib/csv";
import { UUID_RE } from "@/features/blink-cash/lib/filters";
import { withRunningBalance } from "@/features/blink-cash/lib/statement";
import { userNames } from "../../../queries";
import { getWalletStatementAll } from "../../../ops-data";
import { csvResponse, guard, stamp } from "../../csv-response";

export const dynamic = "force-dynamic";

// GET /blink-cash/export/wallet/{userId} — the wallet statement with a running balance.
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { userId } = await params;
  if (!UUID_RE.test(userId)) return new Response("Bad request", { status: 400 });
  const sb = await createAdminClient();
  const stmt = await getWalletStatementAll(sb, userId);
  if (!stmt) return new Response("Not found", { status: 404 });
  const rows = withRunningBalance(stmt.entries, stmt.balance);
  const actors = await userNames(sb, rows.map((r) => r.actor_id));
  const body = toCsv(
    [
      { header: "created_at", value: (r: (typeof rows)[number]) => r.created_at },
      { header: "kind", value: (r) => r.kind },
      { header: "amount", value: (r) => r.amount },
      { header: "balance", value: (r) => r.balance },
      { header: "transaction_id", value: (r) => r.transaction_id },
      { header: "memo", value: (r) => r.memo },
      { header: "staff", value: (r) => (r.actor_id ? (actors.get(r.actor_id)?.name ?? r.actor_id) : null) },
    ],
    rows
  );
  return csvResponse(`blink-cash-statement-${userId.slice(0, 8)}-${stamp()}.csv`, body);
}
