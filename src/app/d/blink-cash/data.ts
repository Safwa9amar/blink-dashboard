import { cache } from "react";
import type { StaffRole } from "@/lib/auth/access";
import { requirePathAccess } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { createClient } from "@/lib/supabase/server";
import { summarizeMerchantDues, type BlinkTransaction, type MerchantDuesSummary } from "@/features/blink-cash";

// Every loader gates on the section first, so a staff role without /blink-cash
// never gets ledger or merchant rows in its payload (the layout alone can't
// guarantee that — it renders in parallel with the page).
const SECTION = "/blink-cash";

// Cached per request so the layout (ledger badge count) and the Overview/Ledger
// pages share a single `transactions` read instead of querying once each.
export const getTransactions = cache(
  async (): Promise<{ rows: BlinkTransaction[] | null; error?: string }> => {
    await requirePathAccess(SECTION);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return { rows: (data as BlinkTransaction[] | null) ?? null, error: error?.message };
  }
);

/** Roles that see /blink-cash (ROLE_ACCESS) — and so may read or chase merchant dues. */
export const DUES_ROLES: readonly StaffRole[] = ["super_admin", "finance_admin"];

// Merchant dues are aggregated by blink-server (commission on delivered orders −
// dues payments), so this calls its staff endpoint with the operator's token.
// Never throws (beyond the access redirect): a missing endpoint / unreachable
// server becomes an inline error. Cached: the Overview's dues stat and the Dues
// tab read the same report.
export const getMerchantDues = cache(
  async (): Promise<{ summary: MerchantDuesSummary | null; error?: string }> => {
    await requirePathAccess(SECTION);
    const res = await blinkApi("/merchant/admin/dues", { roles: DUES_ROLES });
    if (!res.ok) return { summary: null, error: res.status ? `${res.error} (${res.status})` : res.error };
    try {
      return { summary: summarizeMerchantDues(res.data, Date.now()) };
    } catch (e) {
      return { summary: null, error: (e as Error).message };
    }
  }
);
