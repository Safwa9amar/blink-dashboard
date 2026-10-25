// Online payment gateways (Chargily / Stripe / SATIM) as blink-server's staff API returns them
// (GET /payments/admin, GET /payments/admin/providers). Kept snake_case, like the wire.
import type { GatewayFilters } from "./filters";
import { GW_PAGE_SIZE } from "./filters";

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

export interface GatewayPayment {
  id: string;
  purpose: string;
  /** The deposit (transactions.id) or dues payment the charge settles. */
  ref_id: string;
  provider: string;
  method: string;
  /** What the card was charged, in `currency` (EUR for Stripe). */
  amount: number;
  currency: string;
  /** The dinars behind a charge in another currency; null when it is DZD. */
  base_amount: number | null;
  status: string;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
  test_mode: boolean;
  user_id: string;
  user_name: string | null;
}

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

export function normalizePayments(data: unknown): { payments: GatewayPayment[]; total: number } {
  const body = (data ?? {}) as Raw;
  const rows = Array.isArray(body.payments) ? (body.payments as Raw[]) : [];
  const total = Number((body.pagination as Raw | undefined)?.total);
  return {
    payments: rows.map((r) => ({
      id: String(r.id),
      purpose: String(r.purpose ?? ""),
      ref_id: String(r.ref_id ?? ""),
      provider: String(r.provider ?? ""),
      method: String(r.method ?? ""),
      amount: Number(r.amount) || 0,
      currency: String(r.currency ?? "DZD").toUpperCase(),
      base_amount: r.base_amount == null ? null : Number(r.base_amount),
      status: String(r.status ?? ""),
      failure_reason: str(r.failure_reason),
      paid_at: str(r.paid_at),
      created_at: String(r.created_at ?? ""),
      test_mode: r.test_mode === true,
      user_id: String(r.user_id ?? ""),
      user_name: str(r.user_name),
    })),
    total: Number.isFinite(total) ? total : rows.length,
  };
}

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

export function gatewayQuery(f: GatewayFilters): string {
  const p = new URLSearchParams({ page: String(f.page), limit: String(GW_PAGE_SIZE) });
  if (f.status) p.set("status", f.status);
  if (f.provider) p.set("provider", f.provider);
  if (f.purpose) p.set("purpose", f.purpose);
  if (f.user) p.set("user_id", f.user);
  return p.toString();
}

/** A `payments` row read straight from the database (the transaction detail page). */
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

export function normalizeTxPayments(rows: unknown): TxPayment[] {
  if (!Array.isArray(rows)) return [];
  return (rows as Raw[]).map((r) => {
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
  });
}

/** A charge in its own currency: DZD as "1,020 DA", euros as "4.08 €". */
export const formatCharge = (amount: number, currency: string, formatDA: (n: number) => string) =>
  currency === "DZD" ? formatDA(amount) : `${amount.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
