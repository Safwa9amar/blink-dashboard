import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getTransactions } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash");
}

// Blink Cash is the network's single finance hub — the ledger is the real
// `transactions` table (deposits & withdrawals). Dues / agent-float remain
// UI aggregates rendered from mock data inside the client.
export default async function Page() {
  const { rows, error } = await getTransactions();
  return <Client tab="overview" transactions={rows} error={error} />;
}
