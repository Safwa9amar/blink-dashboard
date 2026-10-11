import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getMerchantDues, getTransactions } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash");
}

// Blink Cash is the network's single finance hub — the ledger is the real
// `transactions` table (deposits & withdrawals) and the dues stat is the real
// merchant outstanding total from blink-server (the same report as the Dues tab).
// Agent float, the chart and the other headline stats are still mock data inside
// the client.
export default async function Page() {
  // getTransactions gates the section (redirects) before the dues report starts,
  // so the streamed promise below never carries an access redirect.
  const { rows, error } = await getTransactions();
  const duesHeadline = getMerchantDues().then(({ summary }) =>
    summary ? { totalOutstanding: summary.totalOutstanding, storesOwing: summary.owing.length } : null
  );
  return <Client tab="overview" transactions={rows} error={error} duesHeadline={duesHeadline} />;
}
