import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { parseCashDays } from "@/features/blink-cash";
import { getBlinkCashSummary, getMerchantDues, getTransactions } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash");
}

// Blink Cash is the network's single finance hub — the ledger is the real
// `transactions` table (deposits & withdrawals); the wallet, deposit/withdrawal,
// agent-cash stats and the chart come from blink-server's report for `?days=`, and
// the dues stat from the merchant dues report. Both streamed so a slow report never
// blocks the page.
export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string | string[] }> }) {
  const days = parseCashDays((await searchParams).days);
  // getTransactions gates the section (redirects) before the reports start,
  // so the streamed promises below never carry an access redirect.
  const { rows, error } = await getTransactions();
  const duesHeadline = getMerchantDues().then(({ summary }) =>
    summary ? { totalOutstanding: summary.totalOutstanding, storesOwing: summary.owing.length } : null
  );
  const cash = getBlinkCashSummary(days);
  return (
    <Client tab="overview" transactions={rows} error={error} duesHeadline={duesHeadline} cash={cash} days={days} />
  );
}
