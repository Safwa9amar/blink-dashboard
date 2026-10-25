// URL <-> filter state for the server-filtered Blink Cash lists (ledger, wallets,
// audit). Pure: parsed from `searchParams`, serialised back for links and exports.

export type SearchParams = Record<string, string | string[] | undefined>;

export const LEDGER_PAGE_SIZE = 25;
export const TX_TYPES = ["deposit", "withdrawal"] as const;
export const TX_STATUSES = ["pending", "review", "completed", "cancelled", "reversed"] as const;
export const TX_METHODS = ["agent", "electronic", "online"] as const;
export const WALLET_STATUSES = ["active", "frozen"] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const pick = <T extends string>(v: string | string[] | undefined, allowed: readonly T[]): T | undefined => {
  const s = first(v);
  return s && (allowed as readonly string[]).includes(s) ? (s as T) : undefined;
};
const day = (v: string | string[] | undefined) => {
  const s = first(v);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return Number.isNaN(Date.parse(`${s}T00:00:00Z`)) ? undefined : s;
};
const page = (v: string | string[] | undefined) => {
  const n = Math.floor(Number(first(v)));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 100_000) : 1;
};
const text = (v: string | string[] | undefined) => (first(v) ?? "").trim().slice(0, 80);

/** Strips characters that would break a PostgREST `or=(...)` / `ilike` expression. */
export const sanitizeSearch = (q: string) => q.replace(/[,()%*_\\"']/g, " ").replace(/\s+/g, " ").trim();

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The first 8 hex chars of an id (what the ledger shows) — matched as a prefix. */
export const SHORT_ID_RE = /^[0-9a-f]{6,8}$/i;

export interface LedgerFilters {
  type?: (typeof TX_TYPES)[number];
  status?: (typeof TX_STATUSES)[number];
  method?: (typeof TX_METHODS)[number];
  /** YYYY-MM-DD, Algiers calendar day (inclusive). */
  from?: string;
  to?: string;
  q: string;
  page: number;
}

export function parseLedgerFilters(sp: SearchParams): LedgerFilters {
  return {
    type: pick(sp.type, TX_TYPES),
    status: pick(sp.status, TX_STATUSES),
    method: pick(sp.method, TX_METHODS),
    from: day(sp.from),
    to: day(sp.to),
    q: text(sp.q),
    page: page(sp.page),
  };
}

/** Query string (no leading "?") for a filter object; empty values and page 1 are omitted. */
export function toQuery(f: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === "" || (k === "page" && Number(v) <= 1)) continue;
    p.set(k, String(v));
  }
  return p.toString();
}

const ALGIERS_OFFSET = "+01:00"; // Africa/Algiers has no DST (UTC+1 year-round)

/** Inclusive Algiers days -> `[fromIso, toIsoExclusive)` for a timestamptz range filter. */
export function dayRange(from?: string, to?: string): { fromIso?: string; toIso?: string } {
  const out: { fromIso?: string; toIso?: string } = {};
  if (from) out.fromIso = new Date(`${from}T00:00:00${ALGIERS_OFFSET}`).toISOString();
  if (to) out.toIso = new Date(new Date(`${to}T00:00:00${ALGIERS_OFFSET}`).getTime() + 86_400_000).toISOString();
  return out;
}

export interface WalletFilters {
  q: string;
  status?: (typeof WALLET_STATUSES)[number];
  page: number;
}
export function parseWalletFilters(sp: SearchParams): WalletFilters {
  return { q: text(sp.q), status: pick(sp.status, WALLET_STATUSES), page: page(sp.page) };
}

export interface AuditFilters {
  action: string;
  target_type: string;
  from?: string;
  to?: string;
  page: number;
}
export function parseAuditFilters(sp: SearchParams): AuditFilters {
  return {
    action: text(sp.action).replace(/[^a-z0-9_.:-]/gi, ""),
    target_type: text(sp.target_type).replace(/[^a-z0-9_.:-]/gi, ""),
    from: day(sp.from),
    to: day(sp.to),
    page: page(sp.page),
  };
}

/** Page window -> PostgREST `.range(from, to)` args. */
export const pageRange = (pageNo: number, size = LEDGER_PAGE_SIZE): [number, number] => [
  (pageNo - 1) * size,
  pageNo * size - 1,
];

export const pageCount = (total: number, size = LEDGER_PAGE_SIZE) => Math.max(1, Math.ceil(total / size));
