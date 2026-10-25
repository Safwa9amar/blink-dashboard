// Online payment gateways (Chargily / Stripe / SATIM): provider status from blink-server's
// staff API (GET /payments/admin/providers), and `payments` rows read straight from the
// database (an online deposit's detail, the Review queue). Kept snake_case, like the wire.

/** Method ids paid through a gateway. A dues row with one of these is settled by the gateway, never by staff. */
export const GATEWAY_METHODS = ["edahabia", "cib", "card"] as const;
export const isGatewayMethod = (m: string | null | undefined) => !!m && (GATEWAY_METHODS as readonly string[]).includes(m);

/** Failure reasons the server writes that read as words; anything else is a provider's raw message. */
export const KNOWN_FAILURE_REASONS = [
  "amount_mismatch",
  "canceled_by_user",
  "canceled_by_staff",
  "provider_error",
  "internal_error",
  "async_payment_failed",
  "expired",
  "failed",
  "canceled",
];

export interface GatewayProvider {
  provider: string;
  configured: boolean;
  test_mode: boolean;
  methods: string[];
  /** The currency it charges, and DZD for one unit of it (Blink's fixed rate; null when DZD). */
  currency: string;
  dzd_rate: number | null;
  webhook_url: string | null;
}

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

export function normalizeProviders(data: unknown): GatewayProvider[] {
  const rows = (data as { providers?: unknown } | null)?.providers;
  if (!Array.isArray(rows)) return [];
  return (rows as Raw[]).map((r) => ({
    provider: String(r.provider ?? ""),
    configured: r.configured === true,
    test_mode: r.test_mode === true,
    methods: Array.isArray(r.methods) ? r.methods.map(String) : [],
    currency: String(r.currency ?? "DZD").toUpperCase(),
    dzd_rate: r.dzd_rate == null ? null : Number(r.dzd_rate),
    webhook_url: str(r.webhook_url),
  }));
}

/** A `payments` row read straight from the database. */
export interface TxPayment {
  id: string;
  provider: string;
  method: string;
  amount: number;
  currency: string;
  /** The dinars behind a charge in another currency; null when it is DZD. */
  base_amount: number | null;
  status: string;
  failure_reason: string | null;
  provider_ref: string | null;
  test_mode: boolean;
  created_at: string;
  paid_at: string | null;
}

/** The columns TxPayment / ReviewPayment are read from. */
export const PAYMENT_COLUMNS =
  "id, user_id, purpose, ref_id, provider, method, amount, currency, metadata, status, failure_reason, provider_ref, livemode, created_at, paid_at, expires_at";

function toTxPayment(r: Raw): TxPayment {
  const meta = (r.metadata ?? {}) as Raw;
  return {
    id: String(r.id),
    provider: String(r.provider ?? ""),
    method: String(r.method ?? ""),
    amount: Number(r.amount) || 0,
    currency: String(r.currency ?? "DZD").toUpperCase(),
    base_amount: meta.base_amount == null ? null : Number(meta.base_amount),
    status: String(r.status ?? ""),
    failure_reason: str(r.failure_reason),
    provider_ref: str(r.provider_ref),
    test_mode: r.livemode !== true,
    created_at: String(r.created_at ?? ""),
    paid_at: str(r.paid_at),
  };
}

export function normalizeTxPayments(rows: unknown): TxPayment[] {
  return Array.isArray(rows) ? (rows as Raw[]).map(toTxPayment) : [];
}

/**
 * Why a payment is in the Review queue:
 *  - amount_mismatch: the provider reports another amount, so nothing was credited;
 *  - lapsed: still pending past its checkout lifetime (the expiry cron closes these;
 *    Re-check closes it now, or credits it if it was paid after all).
 */
export type PaymentIssue = "amount_mismatch" | "lapsed";

export interface ReviewPayment extends TxPayment {
  user_id: string;
  userName: string | null;
  purpose: string;
  /** The deposit (transactions.id) or dues payment the charge settles. */
  ref_id: string;
  issue: PaymentIssue;
}

/** The PostgREST `or` that selects Review payments (pair it with `status != paid`). */
export const reviewPaymentsFilter = (nowIso: string) =>
  `failure_reason.eq.amount_mismatch,and(status.eq.pending,expires_at.lt."${nowIso}")`;

export function normalizeReviewPayments(rows: unknown, names: Map<string, { name: string | null }>): ReviewPayment[] {
  if (!Array.isArray(rows)) return [];
  return (rows as Raw[]).map((r) => ({
    ...toTxPayment(r),
    user_id: String(r.user_id ?? ""),
    userName: names.get(String(r.user_id))?.name ?? null,
    purpose: String(r.purpose ?? ""),
    ref_id: String(r.ref_id ?? ""),
    issue: r.failure_reason === "amount_mismatch" ? "amount_mismatch" : "lapsed",
  }));
}

/** Where the thing a payment settles lives: the deposit itself, or the dues tab it counts in. */
export const purposeHref = (p: { purpose: string; ref_id: string }) =>
  p.purpose === "wallet_topup" ? `/blink-cash/ledger/${p.ref_id}` : p.purpose === "agent_dues" ? "/blink-cash/agents" : "/blink-cash/dues";

/** A charge in its own currency: DZD as "1,020 DA", euros as "4.08 €". */
export const formatCharge = (amount: number, currency: string, formatDA: (n: number) => string) =>
  currency === "DZD" ? formatDA(amount) : `${amount.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
