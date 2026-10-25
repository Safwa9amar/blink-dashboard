import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { DUES_ROLES } from "./data";
import { queryLedger, userNames, findUserIds, type Sb } from "./queries";
import { isMissingSchema } from "@/features/blink-cash/lib/errors";
import {
  LEDGER_PAGE_SIZE,
  dayRange,
  pageRange,
  type AuditFilters,
  type LedgerFilters,
  type WalletFilters,
} from "@/features/blink-cash/lib/filters";
import { GATEWAY_METHODS, normalizeTxPayments, type TxPayment } from "@/features/blink-cash/lib/gateway";
import { normalizeSettings, type BlinkCashSettings } from "@/features/blink-cash/lib/settings";
import { normalizeOffer, type Offer } from "@/features/blink-cash/lib/offers";
import { normalizeReconciliation, type Reconciliation } from "@/features/blink-cash/lib/reconciliation";
import { withRunningBalance, type StatementEntry } from "@/features/blink-cash/lib/statement";
import type { BlinkTransaction, LedgerRow } from "@/features/blink-cash/types";
import type { AuditEvent, OpsCounts, PendingPayment, WalletDetail, WalletRow } from "@/features/blink-cash/ops-types";

const SECTION = "/blink-cash";
type Raw = Record<string, unknown>;
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

const admin = () => createAdminClient();

// ── counts (layout badge, Overview cards) ─────────────────────────────────────
async function count(sb: Sb, table: string, eq: [string, string]): Promise<number | null> {
  const { count: c, error } = await sb.from(table).select("*", { count: "exact", head: true }).eq(eq[0], eq[1]);
  return error ? null : (c ?? 0);
}

/** PostgREST filter: a dues payment staff settle (manual method), not one a payment gateway settles. */
const MANUAL_DUES = `method.is.null,method.not.in.(${GATEWAY_METHODS.join(",")})`;

/** Pending dues payments waiting on staff (gateway ones complete or lapse by themselves). */
async function countManualPending(sb: Sb, table: string): Promise<number | null> {
  const { count: c, error } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .or(MANUAL_DUES);
  return error ? null : (c ?? 0);
}

/** Online payments the provider reported with a different amount: money that needs a staff look. */
async function countGatewayIssues(sb: Sb): Promise<number | null> {
  const { count: c, error } = await sb
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("failure_reason", "amount_mismatch")
    .neq("status", "paid");
  return error ? null : (c ?? 0);
}

/** Cheap head-count queries; each is null when its table/enum value isn't there yet. */
export const getOpsCounts = cache(async (): Promise<OpsCounts> => {
  await requirePathAccess(SECTION);
  const sb = await admin();
  const [pendingOps, review, frozen, pendingAgentPayments, pendingMerchantPayments, gatewayIssues] = await Promise.all([
    count(sb, "transactions", ["status", "pending"]),
    count(sb, "transactions", ["status", "review"]),
    count(sb, "blink_wallets", ["status", "frozen"]),
    countManualPending(sb, "agent_dues_payments"),
    countManualPending(sb, "merchant_dues_payments"),
    countGatewayIssues(sb),
  ]);
  return { pendingOps, review, frozen, pendingAgentPayments, pendingMerchantPayments, gatewayIssues };
});

/** The Review tab badge: everything waiting on a staff decision. */
export const reviewBadge = (c: OpsCounts) => (c.review ?? 0) + (c.pendingAgentPayments ?? 0) + (c.pendingMerchantPayments ?? 0);

// ── settings ─────────────────────────────────────────────────────────────────
export const getSettings = cache(
  async (): Promise<{ settings: BlinkCashSettings | null; migrationPending: boolean; error?: string }> => {
    await requirePathAccess(SECTION);
    const sb = await admin();
    const { data, error } = await sb.from("blink_cash_settings").select("*").limit(1).maybeSingle();
    if (error) return { settings: null, migrationPending: isMissingSchema(error), error: error.message };
    return { settings: normalizeSettings(data as Raw | null), migrationPending: false };
  }
);

// ── ledger ───────────────────────────────────────────────────────────────────
export async function getLedgerPage(f: LedgerFilters, range?: [number, number]) {
  await requirePathAccess(SECTION);
  return queryLedger(await admin(), f, range);
}

export interface TxDetail {
  tx: LedgerRow;
  entries: (StatementEntry & { balance_after: number | null })[];
  hold: { status: string; amount: number; created_at: string; resolved_at: string | null } | null;
  actors: Record<string, string>;
  offerTitle: string | null;
  walletFrozen: boolean | null;
  /** The gateway payments of an online deposit, newest first (empty for other methods). */
  payments: TxPayment[];
}

export async function getTxDetail(id: string): Promise<{ detail: TxDetail | null; migrationPending: boolean; error?: string }> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  const { data, error } = await sb.from("transactions").select("*").eq("id", id).maybeSingle();
  if (error) return { detail: null, migrationPending: isMissingSchema(error), error: error.message };
  if (!data) return { detail: null, migrationPending: false };
  const t = data as unknown as BlinkTransaction;
  const staffIds = [t.reviewed_by, t.cancelled_by, t.reversed_by];
  const names = await userNames(sb, [t.user_id, t.agent_id, ...staffIds]);

  const [entriesRes, holdRes, offerRes, paymentsRes] = await Promise.all([
    sb
      .from("blink_wallet_entries")
      .select("id, amount, balance_after, created_at, kind, memo, transaction_id, ref_type, ref_id, actor_id")
      .eq("transaction_id", id)
      .order("created_at", { ascending: true }),
    sb.from("blink_wallet_holds").select("status, amount, created_at, resolved_at").eq("transaction_id", id).maybeSingle(),
    t.offer_id ? sb.from("blink_cash_offers").select("title").eq("id", t.offer_id).maybeSingle() : Promise.resolve({ data: null }),
    t.method === "online"
      ? sb
          .from("payments")
          .select("id, provider, method, amount, currency, metadata, status, failure_reason, provider_ref, livemode, created_at, paid_at")
          .eq("purpose", "wallet_topup")
          .eq("ref_id", id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const entries = ((entriesRes.data as Raw[] | null) ?? []).map((e) => ({
    id: String(e.id),
    amount: num(e.amount),
    balance_after: e.balance_after == null ? null : num(e.balance_after),
    created_at: String(e.created_at),
    kind: String(e.kind),
    memo: str(e.memo),
    transaction_id: str(e.transaction_id),
    ref_type: str(e.ref_type),
    ref_id: str(e.ref_id),
    actor_id: str(e.actor_id),
  }));
  const actorNames = await userNames(sb, entries.map((e) => e.actor_id));
  const actors: Record<string, string> = {};
  for (const [k, v] of [...names, ...actorNames]) if (v.name) actors[k] = v.name;

  const h = holdRes.data as Raw | null;
  const title = (offerRes.data as { title?: Raw } | null)?.title;
  const { data: w } = await sb.from("blink_wallets").select("status").eq("user_id", t.user_id).maybeSingle();
  return {
    detail: {
      tx: {
        ...t,
        userName: names.get(t.user_id)?.name ?? null,
        userPhone: names.get(t.user_id)?.phone ?? null,
        agentName: t.agent_id ? (names.get(t.agent_id)?.name ?? null) : null,
      },
      entries,
      hold: h ? { status: String(h.status), amount: num(h.amount), created_at: String(h.created_at), resolved_at: str(h.resolved_at) } : null,
      actors,
      offerTitle: title ? (str(title.en) ?? str(title.fr) ?? str(title.ar)) : null,
      walletFrozen: w ? (w as Raw).status === "frozen" : null,
      payments: normalizeTxPayments(paymentsRes.data),
    },
    migrationPending: false,
  };
}

// ── wallets ──────────────────────────────────────────────────────────────────
const WALLET_PAGE = 25;
const ENTRY_PAGE = 50;

function toWallet(w: Raw, p?: { name: string | null; phone: string | null }): WalletRow {
  return {
    id: String(w.id),
    userId: String(w.user_id),
    name: p?.name ?? null,
    phone: p?.phone ?? null,
    role: String(w.role ?? "rider"),
    balance: num(w.balance),
    held: num(w.held),
    status: w.status === "frozen" ? "frozen" : "active",
    updatedAt: str(w.updated_at),
  };
}

export async function getWalletsPage(f: WalletFilters): Promise<{ rows: WalletRow[]; total: number; migrationPending: boolean; error?: string }> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  let q = sb.from("blink_wallets").select("*", { count: "exact" });
  if (f.status) q = q.eq("status", f.status);
  if (f.q) {
    const ids = await findUserIds(sb, f.q);
    if (!ids.length) return { rows: [], total: 0, migrationPending: false };
    q = q.in("user_id", ids);
  }
  const [a, b] = pageRange(f.page, WALLET_PAGE);
  const { data, error, count: total } = await q.order("updated_at", { ascending: false }).range(a, b);
  if (error) return { rows: [], total: 0, migrationPending: isMissingSchema(error), error: error.message };
  const raw = (data as Raw[] | null) ?? [];
  const names = await userNames(sb, raw.map((w) => String(w.user_id)));
  return { rows: raw.map((w) => toWallet(w, names.get(String(w.user_id)))), total: total ?? raw.length, migrationPending: false };
}
export const WALLET_PAGE_SIZE = WALLET_PAGE;
export const ENTRY_PAGE_SIZE = ENTRY_PAGE;

export async function getWalletDetail(
  userId: string,
  page: number
): Promise<{
  detail: WalletDetail | null;
  transactions: LedgerRow[];
  migrationPending: boolean;
  error?: string;
}> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  const { data, error } = await sb.from("blink_wallets").select("*").eq("user_id", userId).limit(1).maybeSingle();
  if (error) return { detail: null, transactions: [], migrationPending: isMissingSchema(error), error: error.message };
  const names = await userNames(sb, [userId]);
  if (!data) return { detail: null, transactions: [], migrationPending: false };
  const w = data as Raw;

  const [a, b] = pageRange(page, ENTRY_PAGE);
  const { data: ents, count: entriesTotal } = await sb
    .from("blink_wallet_entries")
    .select("id, amount, balance_after, created_at, kind, memo, transaction_id, ref_type, ref_id, actor_id", { count: "exact" })
    .eq("wallet_id", String(w.id))
    .order("created_at", { ascending: false })
    .range(a, b);
  const rawEntries = (ents as Raw[] | null) ?? [];
  const actorNames = await userNames(sb, rawEntries.map((e) => str(e.actor_id)));
  const entries: StatementEntry[] = rawEntries.map((e) => ({
    id: String(e.id),
    amount: num(e.amount),
    balance_after: e.balance_after == null ? null : num(e.balance_after),
    created_at: String(e.created_at),
    kind: String(e.kind),
    memo: str(e.memo),
    transaction_id: str(e.transaction_id),
    ref_type: str(e.ref_type),
    ref_id: str(e.ref_id),
    actor_id: str(e.actor_id),
  }));
  // Page 1 ends on the live balance; later pages carry their own stored balance_after.
  const rows = withRunningBalance(entries, num(w.balance)).map((r) => ({
    ...r,
    actorName: r.actor_id ? (actorNames.get(r.actor_id)?.name ?? null) : null,
  }));

  const { data: tx } = await sb.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  const txList = ((tx as unknown as BlinkTransaction[] | null) ?? []).map((t) => ({
    ...t,
    userName: names.get(userId)?.name ?? null,
    userPhone: names.get(userId)?.phone ?? null,
    agentName: null,
  }));

  return {
    detail: {
      wallet: {
        ...toWallet(w, names.get(userId)),
        frozenReason: str(w.frozen_reason),
        frozenAt: str(w.frozen_at),
        backfilledAt: str(w.backfilled_at),
      },
      entries: rows,
      entriesTotal: entriesTotal ?? rows.length,
    },
    transactions: txList,
    migrationPending: false,
  };
}

/** Every entry for a wallet, oldest-last, for the statement CSV (capped). */
export async function getWalletStatementAll(sb: Sb, userId: string, cap = 10000) {
  const { data: w } = await sb.from("blink_wallets").select("id, balance").eq("user_id", userId).limit(1).maybeSingle();
  if (!w) return null;
  const out: StatementEntry[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data } = await sb
      .from("blink_wallet_entries")
      .select("id, amount, balance_after, created_at, kind, memo, transaction_id, ref_type, ref_id, actor_id")
      .eq("wallet_id", String((w as Raw).id))
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    const rows = (data as Raw[] | null) ?? [];
    for (const e of rows)
      out.push({
        id: String(e.id),
        amount: num(e.amount),
        balance_after: e.balance_after == null ? null : num(e.balance_after),
        created_at: String(e.created_at),
        kind: String(e.kind),
        memo: str(e.memo),
        transaction_id: str(e.transaction_id),
        ref_type: str(e.ref_type),
        ref_id: str(e.ref_id),
        actor_id: str(e.actor_id),
      });
    if (rows.length < 1000) break;
  }
  return { balance: num((w as Raw).balance), entries: out };
}

// ── review queue ─────────────────────────────────────────────────────────────
export interface ReviewQueue {
  electronic: LedgerRow[];
  payments: PendingPayment[];
  migrationPending: boolean;
  error?: string;
}

export async function getReviewQueue(): Promise<ReviewQueue> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  const [led, ap, mp] = await Promise.all([
    queryLedger(sb, { status: "review", q: "" }, [0, 199]),
    sb.from("agent_dues_payments").select("*").eq("status", "pending").or(MANUAL_DUES).order("created_at", { ascending: true }).limit(200),
    sb.from("merchant_dues_payments").select("*").eq("status", "pending").or(MANUAL_DUES).order("created_at", { ascending: true }).limit(200),
  ]);
  const agentRows = (ap.data as Raw[] | null) ?? [];
  const merchRows = (mp.data as Raw[] | null) ?? [];
  const storeIds = [...new Set(merchRows.map((r) => str(r.store_id)).filter((x): x is string => !!x))];
  const { data: stores } = storeIds.length ? await sb.from("stores").select("id, name").in("id", storeIds) : { data: [] };
  const storeName = new Map(((stores as Raw[] | null) ?? []).map((s) => [String(s.id), str(s.name)]));
  const names = await userNames(sb, [...agentRows.map((r) => str(r.agent_id)), ...merchRows.map((r) => str(r.merchant_id))]);

  const payments: PendingPayment[] = [
    ...agentRows.map((r) => ({
      id: String(r.id),
      kind: "agent" as const,
      partyId: str(r.agent_id),
      partyName: names.get(String(r.agent_id))?.name ?? null,
      storeName: null,
      amount: num(r.amount),
      fees: num(r.fees),
      method: str(r.method) ?? "—",
      reference: str(r.reference),
      note: str(r.note),
      createdAt: String(r.created_at),
    })),
    ...merchRows.map((r) => ({
      id: String(r.id),
      kind: "merchant" as const,
      partyId: str(r.store_id),
      partyName: names.get(String(r.merchant_id))?.name ?? null,
      storeName: storeName.get(String(r.store_id)) ?? null,
      amount: num(r.amount),
      fees: num(r.fees),
      method: str(r.method) ?? "—",
      reference: str(r.reference),
      note: str(r.note),
      createdAt: String(r.created_at),
    })),
  ].sort((x, y) => Date.parse(x.createdAt) - Date.parse(y.createdAt));

  return {
    electronic: led.rows,
    payments,
    migrationPending: led.migrationPending,
    error: led.error && !led.migrationPending ? led.error : (ap.error ?? mp.error)?.message,
  };
}

// ── agent credit limits ──────────────────────────────────────────────────────
export async function getAgentLimits(): Promise<{ limits: Record<string, number | null>; defaultLimit: number | null; migrationPending: boolean }> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  const [{ data, error }, { settings }] = await Promise.all([
    sb.from("agent_profiles").select("user_id, credit_limit").limit(5000),
    getSettings(),
  ]);
  const limits: Record<string, number | null> = {};
  if (!error) for (const r of (data as Raw[] | null) ?? []) limits[String(r.user_id)] = r.credit_limit == null ? null : num(r.credit_limit);
  return { limits, defaultLimit: settings?.agent_credit_limit ?? null, migrationPending: !!error && isMissingSchema(error) };
}

// ── offers ───────────────────────────────────────────────────────────────────
export async function getOffers(): Promise<{ offers: Offer[]; migrationPending: boolean; error?: string; nowMs: number }> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  const { data, error } = await sb.from("blink_cash_offers").select("*").order("created_at", { ascending: false }).limit(500);
  // Read once on the server so the state badges agree between the server render and hydration.
  const nowMs = Date.now();
  if (error) return { offers: [], migrationPending: isMissingSchema(error), error: error.message, nowMs };
  return { offers: ((data as Raw[] | null) ?? []).map(normalizeOffer), migrationPending: false, nowMs };
}

// ── audit ────────────────────────────────────────────────────────────────────
export const AUDIT_PAGE_SIZE = LEDGER_PAGE_SIZE;
export async function getAudit(f: AuditFilters): Promise<{ events: AuditEvent[]; total: number; migrationPending: boolean; error?: string }> {
  await requirePathAccess(SECTION);
  const sb = await admin();
  let q = sb.from("finance_audit_events").select("*", { count: "exact" });
  if (f.action) q = q.eq("action", f.action);
  if (f.target_type) q = q.eq("target_type", f.target_type);
  const { fromIso, toIso } = dayRange(f.from, f.to);
  if (fromIso) q = q.gte("created_at", fromIso);
  if (toIso) q = q.lt("created_at", toIso);
  const [a, b] = pageRange(f.page, AUDIT_PAGE_SIZE);
  const { data, error, count: total } = await q.order("created_at", { ascending: false }).range(a, b);
  if (error) return { events: [], total: 0, migrationPending: isMissingSchema(error), error: error.message };
  const raw = (data as Raw[] | null) ?? [];
  const names = await userNames(sb, raw.map((r) => str(r.actor_id)));
  return {
    events: raw.map((r) => ({
      id: String(r.id),
      actorId: str(r.actor_id),
      actorName: r.actor_id ? (names.get(String(r.actor_id))?.name ?? null) : null,
      action: String(r.action ?? ""),
      targetType: str(r.target_type),
      targetId: str(r.target_id),
      amount: r.amount == null ? null : num(r.amount),
      reason: str(r.reason),
      details: r.details ?? null,
      createdAt: String(r.created_at),
    })),
    total: total ?? raw.length,
    migrationPending: false,
  };
}

// ── reconciliation (server-computed) ─────────────────────────────────────────
export const getReconciliation = cache(
  async (): Promise<{ data: Reconciliation | null; notDeployed: boolean; error?: string }> => {
    await requirePathAccess(SECTION);
    const res = await blinkApi("/blink-cash/admin/reconciliation", { roles: DUES_ROLES });
    if (!res.ok) return { data: null, notDeployed: res.status === 404, error: res.status ? `${res.error} (${res.status})` : res.error };
    try {
      const data = normalizeReconciliation(res.data);
      if (data.mismatches.length) {
        const names = await userNames(await admin(), data.mismatches.map((m) => m.userId));
        for (const m of data.mismatches) m.name = m.name ?? names.get(m.userId)?.name ?? null;
      }
      return { data, notDeployed: false };
    } catch (e) {
      return { data: null, notDeployed: false, error: (e as Error).message };
    }
  }
);
