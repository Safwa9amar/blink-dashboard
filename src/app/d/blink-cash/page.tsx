import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { pageMeta } from "@/lib/dash-metadata";
import type { BlinkTransaction } from "@/features/blink-cash";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash");
}

// Blink Cash is the network's single finance hub — the ledger is the real
// `transactions` table (deposits & withdrawals). Dues / agent-float remain
// UI aggregates rendered from mock data inside the client.
export default async function Page() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return <Client transactions={(data as BlinkTransaction[] | null) ?? null} error={error?.message} />;
}
