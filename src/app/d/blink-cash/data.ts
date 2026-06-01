import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BlinkTransaction } from "@/features/blink-cash";

// Cached per request so the layout (ledger badge count) and the Overview/Ledger
// pages share a single `transactions` read instead of querying once each.
export const getTransactions = cache(
  async (): Promise<{ rows: BlinkTransaction[] | null; error?: string }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return { rows: (data as BlinkTransaction[] | null) ?? null, error: error?.message };
  }
);
