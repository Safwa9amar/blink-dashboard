import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getTransactions } from "../data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_ledger");
}

export default async function Page() {
  const { rows, error } = await getTransactions();
  return <Client tab="ledger" transactions={rows} error={error} />;
}
