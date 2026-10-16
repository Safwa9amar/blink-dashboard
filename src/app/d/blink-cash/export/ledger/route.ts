import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/features/blink-cash/lib/csv";
import { parseLedgerFilters } from "@/features/blink-cash/lib/filters";
import { queryLedger } from "../../queries";
import { csvResponse, guard, stamp } from "../csv-response";
import { LEDGER_EXPORT_CAP, ledgerCsvColumns } from "../ledger-csv";
import type { LedgerRow } from "@/features/blink-cash/types";

export const dynamic = "force-dynamic";

// GET /blink-cash/export/ledger?<ledger filters> — every row the filters match (capped), as CSV.
export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const filters = parseLedgerFilters(Object.fromEntries(new URL(req.url).searchParams));
  const sb = await createAdminClient();
  const rows: LedgerRow[] = [];
  for (let from = 0; from < LEDGER_EXPORT_CAP; from += 1000) {
    const page = await queryLedger(sb, filters, [from, from + 999]);
    if (page.error) return new Response(page.error, { status: 500 });
    rows.push(...page.rows);
    if (page.rows.length < 1000) break;
  }
  return csvResponse(`blink-cash-ledger-${stamp()}.csv`, toCsv(ledgerCsvColumns, rows));
}
