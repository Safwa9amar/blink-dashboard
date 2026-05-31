// Blink Cash module.
//
// The LEDGER is now the *real* Supabase `transactions` table (deposits &
// withdrawals) — fetched in the route's page.tsx and passed down as props.
// The maps below decorate those real rows (icon / variant per enum value).
//
// Dues, agent-float and the deposits-vs-withdrawals chart are UI aggregates the
// mobile app derives client-side — there are no DB tables for them — so they
// stay as presentational mock data here (from the Blink Design System handoff).
import type { Variant } from "@/components/ui";

import type { BlinkTransaction, DueRow } from "./types";
export type { BlinkTransaction, DueRow } from "./types";

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

// Role badge colours — reused by the (mock) dues table.
export const ROLE_VARIANT: Record<string, Variant> = {
  rider: "success",
  merchant: "primary",
  agent: "warning",
  customer: "info",
};

// ── Dues (UI aggregate) ──────────────────────────────────────────────────────
export const DUES: DueRow[] = [
  { who: "Karim Électro", role: "merchant", dues: 9200, fees: 320, due: "in 3 days", status: "open" },
  { who: "Pizza Roma", role: "merchant", dues: 6400, fees: 210, due: "in 5 days", status: "open" },
  { who: "Superette El Baraka", role: "agent", dues: 12500, fees: 0, due: "today", status: "overdue" },
  { who: "Kiosque Nour", role: "agent", dues: 4300, fees: 0, due: "in 2 days", status: "open" },
  { who: "Karim Mobile", role: "merchant", dues: 3300, fees: 180, due: "in 6 days", status: "open" },
];
export const DUE_STATUS: Record<string, Variant> = { open: "info", overdue: "danger", paid: "success" };

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
