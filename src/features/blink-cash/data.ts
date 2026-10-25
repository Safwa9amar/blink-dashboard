// Blink Cash module.
//
// The LEDGER is the *real* Supabase `transactions` table (deposits &
// withdrawals) — fetched in the route's page.tsx and passed down as props.
// The maps below decorate those real rows (icon / variant per enum value).
//
// The DUES tab is real too: merchant dues come from blink-server
// (GET /merchant/admin/dues), fetched in the route's dues/page.tsx and
// normalized by `summarizeMerchantDues` below.
//
// The Overview stats/chart and the Agents tab are real too: blink-server's
// GET /blink-cash/admin/summary and GET /agents/admin/dues, normalized in ./report.
import type { Variant } from "@/components/ui";

import type {
  BlinkTransaction,
  MerchantDue,
  MerchantDuesPayment,
  MerchantDuesSummary,
} from "./types";
export type {
  AgentDueRow,
  AgentDuesPayment,
  AgentDuesSummary,
  BlinkCashSummary,
  BlinkTransaction,
  CashDaily,
  CashDays,
  DuesHeadline,
  LedgerRow,
  Exposure,
  MerchantDue,
  MerchantDuesPayment,
  MerchantDuesResponse,
  MerchantDuesSummary,
  SummaryResult,
} from "./types";
export * from "./report";

// ── Ledger decoration (keyed by the real transaction enums) ──────────────────
// transaction_type → icon. deposit credits the wallet, withdrawal debits it.
export const TX_TYPE_ICON: Record<BlinkTransaction["type"], string> = {
  deposit: "wallet",
  withdrawal: "bank",
};
// deposit_method → icon (agent = cash via shop, electronic = transfer reviewed by
// finance, online = card paid through a payment gateway).
export const TX_METHOD_ICON: Record<string, string> = {
  agent: "store",
  electronic: "bank",
  online: "card",
};
// transaction_status → semantic colour.
export const TX_STATUS_VARIANT: Record<string, Variant> = {
  completed: "success",
  pending: "warning",
  cancelled: "danger",
  review: "info",
  reversed: "default",
};

// ── Merchant dues (from blink-server) ────────────────────────────────────────
/** GET /merchant/admin/dues returns at most this many payments, newest first (admin-dues.ts). */
export const DUES_PAYMENTS_CAP = 100;

/** "12,500 DA" — fixed en-US grouping so the server render and the client hydrate the same string. */
export const formatDA = (n: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)} DA`;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

const DAY_MS = 86_400_000;

/**
 * Normalizes the GET /merchant/admin/dues payload (numerics may arrive as strings)
 * and derives the headline numbers. Throws on a payload that isn't the expected
 * shape so the page shows an error instead of an empty table.
 */
export function summarizeMerchantDues(payload: unknown, nowMs: number): MerchantDuesSummary {
  const body = payload as { dues?: unknown; payments?: unknown } | null;
  if (!body || !Array.isArray(body.dues) || !Array.isArray(body.payments)) {
    throw new Error("Unexpected response from /merchant/admin/dues");
  }

  const dues: MerchantDue[] = (body.dues as Record<string, unknown>[]).map((d) => ({
    store_id: String(d.store_id),
    store_name: str(d.store_name) ?? "—",
    merchant_id: str(d.merchant_id),
    merchant_name: str(d.merchant_name),
    merchant_phone: str(d.merchant_phone),
    commission_total: num(d.commission_total),
    paid_total: num(d.paid_total),
    outstanding: num(d.outstanding),
    last_payment_at: str(d.last_payment_at),
  }));
  const payments: MerchantDuesPayment[] = (body.payments as Record<string, unknown>[])
    .map((p) => ({
      id: String(p.id),
      store_id: str(p.store_id),
      store_name: str(p.store_name),
      merchant_name: str(p.merchant_name),
      amount: num(p.amount),
      fees: num(p.fees),
      method: str(p.method) ?? "—",
      status: str(p.status) ?? "completed",
      created_at: String(p.created_at),
    }))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  const owing = dues.filter((d) => d.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);
  const since = nowMs - 30 * DAY_MS;
  const recent = payments.filter((p) => p.status === "completed" && Date.parse(p.created_at) >= since);
  // A capped list still covers the whole window when its oldest payment predates it.
  const paymentsCapped = payments.length >= DUES_PAYMENTS_CAP;
  const oldest = payments.at(-1);
  const last30Exact = !paymentsCapped || (!!oldest && Date.parse(oldest.created_at) < since);

  return {
    owing,
    payments,
    totalOutstanding: owing.reduce((s, d) => s + d.outstanding, 0),
    paidLast30: recent.reduce((s, p) => s + p.amount, 0),
    paymentsLast30: recent.length,
    last30Exact,
    paymentsCapped,
  };
}
