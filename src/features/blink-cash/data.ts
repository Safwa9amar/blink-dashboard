// Blink Cash module.
//
// The LEDGER is the *real* Supabase `transactions` table (deposits &
// withdrawals) — fetched in the route's page.tsx and passed down as props.
// The maps below decorate those real rows (icon / variant per enum value).
//
// The DUES tab is real too: merchant dues come from blink-server
// (GET /merchant/admin/dues), fetched in the route's dues/page.tsx and
// normalized by `summarizeMerchantDues` below. Agent dues are out of scope.
//
// Agent float and the deposits-vs-withdrawals chart are still presentational
// mock data (from the Blink Design System handoff) until they get a source.
import type { Variant } from "@/components/ui";

import type {
  BlinkTransaction,
  MerchantDue,
  MerchantDuesPayment,
  MerchantDuesSummary,
} from "./types";
export type {
  BlinkTransaction,
  DuesHeadline,
  MerchantDue,
  MerchantDuesPayment,
  MerchantDuesResponse,
  MerchantDuesSummary,
} from "./types";

// ── Ledger decoration (keyed by the real transaction enums) ──────────────────
// transaction_type → icon. deposit credits the wallet, withdrawal debits it.
export const TX_TYPE_ICON: Record<BlinkTransaction["type"], string> = {
  deposit: "wallet",
  withdrawal: "bank",
};
// deposit_method → icon (agent = cash via shop, electronic = card / online).
export const TX_METHOD_ICON: Record<string, string> = {
  agent: "store",
  electronic: "card",
};
// transaction_status → semantic colour.
export const TX_STATUS_VARIANT: Record<string, Variant> = {
  completed: "success",
  pending: "warning",
  cancelled: "danger",
};

// deposits vs withdrawals by day: [day, deposits, withdrawals] (000 DA)
export const BC_WEEK: [string, number, number][] = [
  ["Mon", 62, 40], ["Tue", 70, 52], ["Wed", 58, 48], ["Thu", 82, 60], ["Fri", 96, 72], ["Sat", 88, 80], ["Sun", 74, 55],
];

// ── Agent float (UI aggregate) ───────────────────────────────────────────────
export const AGENT_FLOAT = [
  { who: "Superette El Baraka", area: "Bab Ezzouar", float: 142000, cap: 200000, txns: 318 },
  { who: "Kiosque Nour", area: "El Harrach", float: 88000, cap: 150000, txns: 204 },
  { who: "Tabac Presse Centrale", area: "Rouiba", float: 36000, cap: 120000, txns: 96 },
  { who: "Alimentation Sofiane", area: "Cheraga", float: 174000, cap: 180000, txns: 412 },
];

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
