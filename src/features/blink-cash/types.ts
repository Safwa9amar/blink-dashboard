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
  status: "completed" | "cancelled" | "pending" | "review" | "reversed";
  method: "electronic" | "agent" | null;
  offer_title: string | null;
  offer_detail: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  // Full Blink Cash columns (migration 20261016120000). Absent until it is applied.
  pending_id?: string | null;
  shop_id?: string | null;
  expires_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  cancelled_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reference?: string | null;
  receipt_url?: string | null;
  payout_account?: { type?: string; number?: string; holder?: string } | null;
  client_ref?: string | null;
  reversed_by?: string | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  offer_id?: string | null;
  bonus_amount?: number | null;
  staff_note?: string | null;
}

/** A transaction with the people on it resolved to names (ledger list, review queue). */
export interface LedgerRow extends BlinkTransaction {
  userName: string | null;
  userPhone: string | null;
  agentName: string | null;
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

// ── Blink Cash report (blink-server GET /blink-cash/admin/summary) ───────────
export type CashDays = 7 | 30 | 90;

export interface CashDaily {
  /** YYYY-MM-DD, Africa/Algiers. */
  date: string;
  deposits: number;
  withdrawals: number;
  deposits_count: number;
  withdrawals_count: number;
}

export interface BlinkCashSummary {
  windowDays: number;
  generatedAt: string | null;
  circulation: { total: number; available: number; pendingWithdrawals: number; wallets: number };
  deposits: { count: number; amount: number };
  withdrawals: { count: number; amount: number };
  fees: { total: number; platform: number; tax: number; agentsNet: number };
  pending: { count: number; amount: number };
  agentCash: { owedToBlink: number; credit: number; agentsOwing: number; agents: number };
  daily: CashDaily[];
}

/** What a page hands the client: the report, or why it couldn't load. */
export interface SummaryResult {
  summary: BlinkCashSummary | null;
  error?: string;
}

// ── Agent dues (blink-server GET /agents/admin/dues) ─────────────────────────
export type Exposure = "high" | "medium" | "low" | "none";

/** One agent as the Agents tab renders it (flat, so table columns sort by field). */
export interface AgentDueRow {
  id: string;
  name: string;
  phone: string | null;
  shopName: string | null;
  shopAddress: string | null;
  lat: number | null;
  lng: number | null;
  shopsTotal: number;
  shopsOpen: number;
  depCount: number;
  depAmount: number;
  wdCount: number;
  wdAmount: number;
  ops30: number;
  feeNet: number;
  /** Cash the agent owes Blink (0 when settled or in credit). */
  owed: number;
  credit: number;
  exposure: Exposure;
  /** 0..3 so the Exposure column sorts. */
  exposureRank: number;
  lastOperationAt: string | null;
  lastPaymentAt: string | null;
  rating: number | null;
  ratingsCount: number;
  /** Per-agent cash limit from agent_profiles.credit_limit (null = use the settings default). */
  creditLimit?: number | null;
}

export interface AgentDuesPayment {
  id: string;
  agentId: string | null;
  agentName: string | null;
  amount: number;
  fees: number;
  method: string;
  status: string;
  createdAt: string;
}

export interface AgentDuesSummary {
  /** Largest balance first (as the server sorts). */
  agents: AgentDueRow[];
  payments: AgentDuesPayment[];
  totalOwed: number;
  totalCredit: number;
  agentsOwing: number;
  operations30: number;
}
