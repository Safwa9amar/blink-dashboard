"use server";

// Blink Cash staff writes. Every action is guarded by getStaffActor("/blink-cash") and
// calls blink-server's staff API through blinkApi (the server owns the money rules, the
// audit row and the notifications). Failures come back as translated messages; the
// server's machine `code` (insufficient_funds, wallet_frozen, …) wins over the HTTP status.
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getStaffActor } from "@/lib/auth/staff";
import { blinkApi, type BlinkApiMethod } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";
import { DUES_ROLES } from "./data";
import { knownErrorCode } from "@/features/blink-cash/lib/errors";
import { validateSettings, type SettingsForm } from "@/features/blink-cash/lib/settings";
import { validateOffer, type OfferForm } from "@/features/blink-cash/lib/offers";

const PATH = "/blink-cash";
export type ActionResult = { ok: true } | { ok: false; error: string };

const enc = encodeURIComponent;
const reasonOk = (r: string) => r.trim().length >= 3 && r.trim().length <= 500;

async function fail(res: { status: number; error: string; code?: string }): Promise<ActionResult> {
  const code = knownErrorCode(res.code);
  if (code) return { ok: false, error: (await getTranslations("blink_cash.err"))(code as never) };
  return { ok: false, error: await blinkApiErrorMessage("blink_cash.ops", res) };
}

async function invalid(): Promise<ActionResult> {
  return { ok: false, error: (await getTranslations("blink_cash.err"))("invalid") };
}

async function call(
  method: BlinkApiMethod,
  path: string,
  body?: unknown,
  opts: { superOnly?: boolean } = {}
): Promise<ActionResult> {
  const actor = await getStaffActor(PATH);
  if (!actor || (opts.superOnly && actor.role !== "super_admin")) {
    return { ok: false, error: (await getTranslations("blink_cash.err"))("forbidden") };
  }
  const res = await blinkApi(path, { method, body, roles: DUES_ROLES });
  if (!res.ok) return fail(res);
  revalidatePath("/d/blink-cash", "layout");
  return { ok: true };
}

// ── transactions ─────────────────────────────────────────────────────────────
// POST /blink-cash/admin/transactions/{id}/cancel {reason}
export async function cancelTransaction(id: string, reason: string) {
  if (!reasonOk(reason)) return invalid();
  return call("POST", `/blink-cash/admin/transactions/${enc(id)}/cancel`, { reason: reason.trim() });
}
// POST /blink-cash/admin/transactions/{id}/approve {reference}
export async function approveTransaction(id: string, reference: string) {
  if (!reference.trim() || reference.length > 200) return invalid();
  return call("POST", `/blink-cash/admin/transactions/${enc(id)}/approve`, { reference: reference.trim() });
}
// POST /blink-cash/admin/transactions/{id}/reject {reason}
export async function rejectTransaction(id: string, reason: string) {
  if (!reasonOk(reason)) return invalid();
  return call("POST", `/blink-cash/admin/transactions/${enc(id)}/reject`, { reason: reason.trim() });
}
// POST /blink-cash/admin/transactions/{id}/reverse {reason}
export async function reverseTransaction(id: string, reason: string) {
  if (!reasonOk(reason)) return invalid();
  return call("POST", `/blink-cash/admin/transactions/${enc(id)}/reverse`, { reason: reason.trim() });
}

// ── wallets ──────────────────────────────────────────────────────────────────
// POST /blink-cash/admin/wallets/{user_id}/adjust {amount (signed), reason}
export async function adjustWallet(userId: string, amount: number, reason: string) {
  if (!Number.isFinite(amount) || amount === 0 || !reasonOk(reason)) return invalid();
  return call("POST", `/blink-cash/admin/wallets/${enc(userId)}/adjust`, { amount, reason: reason.trim() });
}
// POST /blink-cash/admin/wallets/{user_id}/freeze {reason}
export async function freezeWallet(userId: string, reason: string) {
  if (!reasonOk(reason)) return invalid();
  return call("POST", `/blink-cash/admin/wallets/${enc(userId)}/freeze`, { reason: reason.trim() });
}
// POST /blink-cash/admin/wallets/{user_id}/unfreeze {reason?}
export async function unfreezeWallet(userId: string, reason: string) {
  return call("POST", `/blink-cash/admin/wallets/${enc(userId)}/unfreeze`, reason.trim() ? { reason: reason.trim() } : {});
}

// ── agent dues ───────────────────────────────────────────────────────────────
export interface RecordPaymentInput {
  amount: number;
  method: string;
  reference: string;
  note: string;
}
function paymentBody(p: RecordPaymentInput) {
  return { amount: p.amount, method: p.method.trim(), reference: p.reference.trim(), note: p.note.trim() };
}
const paymentOk = (p: RecordPaymentInput) => Number.isFinite(p.amount) && p.amount > 0 && !!p.method.trim();

// POST /agents/admin/dues/{agent_id}/payments {amount, method, reference, note}
export async function recordAgentPayment(agentId: string, p: RecordPaymentInput) {
  if (!paymentOk(p)) return invalid();
  return call("POST", `/agents/admin/dues/${enc(agentId)}/payments`, paymentBody(p));
}
// POST /agents/admin/dues/payments/{id}/confirm
export async function confirmAgentPayment(id: string) {
  return call("POST", `/agents/admin/dues/payments/${enc(id)}/confirm`, {});
}
// POST /agents/admin/dues/payments/{id}/reject {reason}
export async function rejectAgentPayment(id: string, reason: string) {
  if (!reasonOk(reason)) return invalid();
  return call("POST", `/agents/admin/dues/payments/${enc(id)}/reject`, { reason: reason.trim() });
}
// PATCH /agents/admin/{agent_id}/credit-limit {credit_limit | null}
export async function setAgentCreditLimit(agentId: string, limit: number | null) {
  if (limit !== null && (!Number.isFinite(limit) || limit < 0)) return invalid();
  return call("PATCH", `/agents/admin/${enc(agentId)}/credit-limit`, { credit_limit: limit });
}

// ── merchant dues ────────────────────────────────────────────────────────────
// POST /merchant/admin/dues/{store_id}/payments {amount, method, reference, note}
export async function recordMerchantPayment(storeId: string, p: RecordPaymentInput) {
  if (!paymentOk(p)) return invalid();
  return call("POST", `/merchant/admin/dues/${enc(storeId)}/payments`, paymentBody(p));
}
// POST /merchant/admin/dues/payments/{id}/confirm
export async function confirmMerchantPayment(id: string) {
  return call("POST", `/merchant/admin/dues/payments/${enc(id)}/confirm`, {});
}
// POST /merchant/admin/dues/payments/{id}/reject {reason}
export async function rejectMerchantPayment(id: string, reason: string) {
  if (!reasonOk(reason)) return invalid();
  return call("POST", `/merchant/admin/dues/payments/${enc(id)}/reject`, { reason: reason.trim() });
}

// ── settings & offers ────────────────────────────────────────────────────────
// PUT /blink-cash/admin/settings {…every §3 field}
export async function saveSettings(form: SettingsForm) {
  const v = validateSettings(form);
  if (!v.ok) return invalid();
  return call("PUT", "/blink-cash/admin/settings", v.payload);
}
// POST /blink-cash/admin/offers {…offer}
export async function createOffer(form: OfferForm) {
  const v = validateOffer(form);
  if (!v.ok) return invalid();
  return call("POST", "/blink-cash/admin/offers", v.payload);
}
// PATCH /blink-cash/admin/offers/{id} {…offer}
export async function updateOffer(id: string, form: OfferForm) {
  const v = validateOffer(form);
  if (!v.ok) return invalid();
  return call("PATCH", `/blink-cash/admin/offers/${enc(id)}`, v.payload);
}
// PATCH /blink-cash/admin/offers/{id} {active} — archive = active false
export async function setOfferActive(id: string, active: boolean) {
  return call("PATCH", `/blink-cash/admin/offers/${enc(id)}`, { active });
}

// ── ledger ───────────────────────────────────────────────────────────────────
// POST /blink-cash/admin/ledger/backfill — super_admin only (spec §1)
export async function runLedgerBackfill() {
  return call("POST", "/blink-cash/admin/ledger/backfill", {}, { superOnly: true });
}
