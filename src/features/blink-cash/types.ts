// Domain types for the blink-cash feature.

// A row of the real Supabase `transactions` table (deposits & withdrawals).
// Mirrors blink-server migration 00001 — the authoritative finance ledger.
export interface BlinkTransaction {
  id: string;
  type: "deposit" | "withdrawal";
  user_id: string;
  agent_id: string | null;
  rider_id: string | null;
  amount: number;
  fees: number;
  total: number;
  status: "completed" | "cancelled" | "pending";
  method: "electronic" | "agent" | null;
  offer_title: string | null;
  offer_detail: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
}

// Merchant dues — the commission Blink takes on a store's delivered orders, minus
// what the merchant already paid (`merchant_dues_payments`). Aggregated by
// blink-server (GET /merchant/admin/dues), not read from the DB here.
export interface MerchantDue {
  store_id: string;
  store_name: string;
  merchant_id: string | null;
  merchant_name: string | null;
  merchant_phone: string | null;
  commission_total: number;
  paid_total: number;
  outstanding: number;
  last_payment_at: string | null;
}

export interface MerchantDuesPayment {
  id: string;
  store_id: string | null;
  store_name: string | null;
  merchant_name: string | null;
  amount: number;
  fees: number;
  method: string;
  status: string;
  created_at: string;
}

export interface MerchantDuesResponse {
  dues: MerchantDue[];
  payments: MerchantDuesPayment[];
}

/** The Dues tab's view data: normalized rows + headline numbers. */
export interface MerchantDuesSummary {
  /** Stores that still owe Blink, largest balance first. */
  owing: MerchantDue[];
  /** Latest dues payments, newest first. */
  payments: MerchantDuesPayment[];
  totalOutstanding: number;
  paidLast30: number;
  paymentsLast30: number;
  /**
   * Whether the two "last 30 days" figures cover every payment of that window.
   * blink-server only returns the latest DUES_PAYMENTS_CAP payments, so they're
   * exact only when that list is complete or already reaches past 30 days.
   */
  last30Exact: boolean;
  /** `payments` hit the server's cap — older payments exist but aren't listed. */
  paymentsCapped: boolean;
}

/** The Overview's dues stat: merchant dues from the same blink-server report as the Dues tab. */
export interface DuesHeadline {
  totalOutstanding: number;
  storesOwing: number;
}

export type TFn = (k: string, v?: Record<string, string | number>) => string;
