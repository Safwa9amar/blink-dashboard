import { createAdminClient } from "@/lib/supabase/admin";
import { csvCell, toCsv } from "@/features/blink-cash/lib/csv";
import { parseCashDays } from "@/features/blink-cash/report";
import type { LedgerRow } from "@/features/blink-cash/types";
import { getBlinkCashSummary } from "../../data";
import { queryLedger } from "../../queries";
import { csvResponse, guard, stamp } from "../csv-response";
import { LEDGER_EXPORT_CAP, ledgerCsvColumns } from "../ledger-csv";

export const dynamic = "force-dynamic";

// GET /blink-cash/export/report?days=7|30|90 — a period CSV: the summary figures, then the
// window's transactions.
export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const days = parseCashDays(new URL(req.url).searchParams.get("days") ?? undefined);
  const from = new Date(Date.now() + 3_600_000 - days * 86_400_000).toISOString().slice(0, 10);

  const { summary } = await getBlinkCashSummary(days);
  const lines: string[] = [[csvCell("Blink Cash report"), csvCell(`${from} → ${stamp()}`), csvCell(`${days} days`)].join(",")];
  if (summary) {
    const kv: [string, number][] = [
      ["circulation_total", summary.circulation.total],
      ["circulation_available", summary.circulation.available],
      ["pending_withdrawals", summary.circulation.pendingWithdrawals],
      ["wallets", summary.circulation.wallets],
      ["deposits_count", summary.deposits.count],
      ["deposits_amount", summary.deposits.amount],
      ["withdrawals_count", summary.withdrawals.count],
      ["withdrawals_amount", summary.withdrawals.amount],
      ["fees_total", summary.fees.total],
      ["fees_platform", summary.fees.platform],
      ["fees_tax", summary.fees.tax],
      ["fees_agents_net", summary.fees.agentsNet],
      ["pending_count", summary.pending.count],
      ["pending_amount", summary.pending.amount],
      ["agent_cash_owed_to_blink", summary.agentCash.owedToBlink],
      ["agent_cash_credit", summary.agentCash.credit],
    ];
    lines.push("metric,value", ...kv.map(([k, v]) => `${csvCell(k)},${csvCell(v)}`));
  } else {
    lines.push("summary,unavailable");
  }
  lines.push("", "date,deposits,withdrawals,deposits_count,withdrawals_count");
  for (const d of summary?.daily ?? []) lines.push([d.date, d.deposits, d.withdrawals, d.deposits_count, d.withdrawals_count].map(csvCell).join(","));
  lines.push("");

  const sb = await createAdminClient();
  const rows: LedgerRow[] = [];
  for (let start = 0; start < LEDGER_EXPORT_CAP; start += 1000) {
    const page = await queryLedger(sb, { q: "", from, to: stamp() }, [start, start + 999]);
    if (page.error) return new Response(page.error, { status: 500 });
    rows.push(...page.rows);
    if (page.rows.length < 1000) break;
  }
  return csvResponse(`blink-cash-report-${days}d-${stamp()}.csv`, lines.join("\r\n") + "\r\n" + toCsv(ledgerCsvColumns, rows));
}
