import { cache } from "react";
import type { StaffRole } from "@/lib/auth/access";
import { requirePathAccess } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  summarizeAgentDues,
  summarizeBlinkCash,
  summarizeMerchantDues,
  type AgentDuesSummary,
  type BlinkTransaction,
  type CashDays,
  type MerchantDuesSummary,
  type SummaryResult,
} from "@/features/blink-cash";
import { normalizeProviders, type GatewayProvider } from "@/features/blink-cash/lib/gateway";

// Every loader gates on the section first, so a staff role without /blink-cash
// never gets ledger or merchant rows in its payload (the layout alone can't
// guarantee that — it renders in parallel with the page).
const SECTION = "/blink-cash";

// Cached per request so the layout (ledger badge count) and the Overview/Ledger
// pages share a single `transactions` read instead of querying once each.
export const getTransactions = cache(
  async (): Promise<{ rows: BlinkTransaction[] | null; error?: string }> => {
    await requirePathAccess(SECTION);
    // Service role: `transactions` RLS only shows a user their own rows, so the
    // operator's client would see an empty ledger.
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
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

const failure = (res: { status: number; error: string }) => (res.status ? `${res.error} (${res.status})` : res.error);

// Network-wide Blink Cash report (wallet circulation, window deposits/withdrawals,
// fees, agent cash owed, per-day series), computed by blink-server so the money
// rules stay in one place. Never throws (beyond the access redirect): a 404 from a
// server that predates the endpoint becomes "Report unavailable" in the UI.
export const getBlinkCashSummary = cache(async (days: CashDays): Promise<SummaryResult> => {
  await requirePathAccess(SECTION);
  const res = await blinkApi(`/blink-cash/admin/summary?days=${days}`, { roles: DUES_ROLES });
  if (!res.ok) return { summary: null, error: failure(res) };
  try {
    return { summary: summarizeBlinkCash(res.data) };
  } catch (e) {
    return { summary: null, error: (e as Error).message };
  }
});

// What each agent owes Blink (cash collected on deposits minus fees/payments), plus
// the latest dues payments — blink-server's GET /agents/admin/dues.
export const getAgentDues = cache(
  async (): Promise<{ summary: AgentDuesSummary | null; error?: string }> => {
    await requirePathAccess(SECTION);
    const res = await blinkApi("/agents/admin/dues", { roles: DUES_ROLES });
    if (!res.ok) return { summary: null, error: failure(res) };
    try {
      return { summary: summarizeAgentDues(res.data) };
    } catch (e) {
      return { summary: null, error: (e as Error).message };
    }
  }
);

// Online payment providers (Settings): which are configured, test / live, webhook URL, EUR rate.
export const getPaymentProviders = cache(
  async (): Promise<{ providers: GatewayProvider[]; error?: string }> => {
    await requirePathAccess(SECTION);
    const res = await blinkApi("/payments/admin/providers", { roles: DUES_ROLES });
    if (!res.ok) return { providers: [], error: failure(res) };
    return { providers: normalizeProviders(res.data) };
  }
);
