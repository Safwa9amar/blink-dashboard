import { createAdminClient } from "@/lib/supabase/admin";
import {
  LEDGER_PAGE_SIZE,
  SHORT_ID_RE,
  UUID_RE,
  dayRange,
  pageRange,
  sanitizeSearch,
  type LedgerFilters,
} from "@/features/blink-cash/lib/filters";
import { isMissingSchema } from "@/features/blink-cash/lib/errors";
import type { BlinkTransaction, LedgerRow } from "@/features/blink-cash/types";

export type Sb = Awaited<ReturnType<typeof createAdminClient>>;
type Raw = Record<string, unknown>;

export interface Person {
  name: string | null;
  phone: string | null;
}

const CHUNK = 100;

/** id -> display name + phone from `users` (names are best-effort; failures give empty). */
export async function userNames(sb: Sb, ids: (string | null | undefined)[]): Promise<Map<string, Person>> {
  const uniq = [...new Set(ids.filter((x): x is string => !!x))];
  const out = new Map<string, Person>();
  for (let i = 0; i < uniq.length; i += CHUNK) {
    const { data } = await sb
      .from("users")
      .select("id, first_name, last_name, email, phone")
      .in("id", uniq.slice(i, i + CHUNK));
    for (const u of (data as Raw[] | null) ?? []) {
      const name =
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        (typeof u.email === "string" ? u.email.split("@")[0] : "") ||
        null;
      out.set(String(u.id), { name, phone: typeof u.phone === "string" ? u.phone : null });
    }
  }
  return out;
}

/** Users whose name or phone contains `q` (capped) — the q filter on ledger and wallets. */
export async function findUserIds(sb: Sb, q: string): Promise<string[]> {
  const clean = sanitizeSearch(q);
  if (!clean) return [];
  const tokens = clean.split(" ").filter((t) => t.length >= 2).slice(0, 3);
  if (!tokens.length) return [];
  const ors = tokens.flatMap((t) => [`first_name.ilike.%${t}%`, `last_name.ilike.%${t}%`, `phone.ilike.%${t}%`]);
  const { data } = await sb.from("users").select("id").or(ors.join(",")).limit(200);
  return ((data as Raw[] | null) ?? []).map((u) => String(u.id));
}

const hexRange = (prefix: string) => {
  const p = prefix.toLowerCase();
  const pad = (c: string) => (p + c.repeat(32 - p.length)).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
  return { lo: pad("0"), hi: pad("f") };
};

export interface LedgerPage {
  rows: LedgerRow[];
  total: number;
  /** The Full Blink Cash migration (review / reversed statuses, new columns) isn't applied yet. */
  migrationPending: boolean;
  error?: string;
}

/** Ledger rows for the filters, with user and agent names. `range` overrides the page window (exports). */
export async function queryLedger(
  sb: Sb,
  f: Omit<LedgerFilters, "page"> & { page?: number },
  range?: [number, number]
): Promise<LedgerPage> {
  let query = sb.from("transactions").select("*", { count: "exact" });
  if (f.type) query = query.eq("type", f.type);
  if (f.status) query = query.eq("status", f.status);
  if (f.method) query = query.eq("method", f.method);
  const { fromIso, toIso } = dayRange(f.from, f.to);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (toIso) query = query.lt("created_at", toIso);

  if (f.q) {
    const parts: string[] = [];
    const ids = await findUserIds(sb, f.q);
    if (ids.length) parts.push(`user_id.in.(${ids.join(",")})`, `agent_id.in.(${ids.join(",")})`);
    if (UUID_RE.test(f.q)) parts.push(`id.eq.${f.q}`, `pending_id.eq.${f.q}`);
    else if (SHORT_ID_RE.test(f.q)) {
      const { lo, hi } = hexRange(f.q);
      parts.push(`and(id.gte.${lo},id.lte.${hi})`);
    }
    if (!parts.length) return { rows: [], total: 0, migrationPending: false };
    query = query.or(parts.join(","));
  }

  const [a, b] = range ?? pageRange(f.page ?? 1, LEDGER_PAGE_SIZE);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(a, b);
  if (error) return { rows: [], total: 0, migrationPending: isMissingSchema(error), error: error.message };

  const txns = (data as unknown as BlinkTransaction[] | null) ?? [];
  const names = await userNames(sb, txns.flatMap((t) => [t.user_id, t.agent_id]));
  const rows: LedgerRow[] = txns.map((t) => ({
    ...t,
    userName: names.get(t.user_id)?.name ?? null,
    userPhone: names.get(t.user_id)?.phone ?? null,
    agentName: t.agent_id ? (names.get(t.agent_id)?.name ?? null) : null,
  }));
  return { rows, total: count ?? rows.length, migrationPending: false };
}
