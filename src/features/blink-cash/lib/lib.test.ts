import { describe, expect, it } from "vitest";
import { dayRange, pageCount, pageRange, parseAuditFilters, parseLedgerFilters, parseWalletFilters, sanitizeSearch, toQuery } from "./filters";
import { csvCell, toCsv } from "./csv";
import { available, signedAdjustment, withRunningBalance } from "./statement";
import { buildTimeline, needsReason, txActions } from "./lifecycle";
import { capacityLevel, capacityPercent, capacityRatio, effectiveLimit } from "./capacity";
import { isMissingSchema, knownErrorCode } from "./errors";
import { normalizeSettings, ratePct, toSettingsForm, validateSettings, SETTINGS_DEFAULTS } from "./settings";
import { emptyOfferForm, isoToLocalInput, normalizeOffer, offerState, validateOffer } from "./offers";
import { attentionItems } from "./attention";

describe("filters", () => {
  it("parses and whitelists ledger filters", () => {
    const f = parseLedgerFilters({ type: "deposit", status: "bogus", method: ["electronic", "agent"], from: "2026-10-01", to: "nope", q: "  ali ", page: "3" });
    expect(f).toEqual({ type: "deposit", status: undefined, method: "electronic", from: "2026-10-01", to: undefined, q: "ali", page: 3 });
  });
  it("defaults the page and rejects bad numbers", () => {
    expect(parseLedgerFilters({}).page).toBe(1);
    expect(parseLedgerFilters({ page: "-4" }).page).toBe(1);
    expect(parseLedgerFilters({ page: "abc" }).page).toBe(1);
  });
  it("accepts review and reversed statuses", () => {
    expect(parseLedgerFilters({ status: "review" }).status).toBe("review");
    expect(parseLedgerFilters({ status: "reversed" }).status).toBe("reversed");
  });
  it("serialises, dropping empties and page 1", () => {
    expect(toQuery({ type: "deposit", q: "", page: 1, status: undefined })).toBe("type=deposit");
    expect(toQuery({ page: 2, q: "a b" })).toBe("page=2&q=a+b");
  });
  it("converts Algiers days to an exclusive UTC range", () => {
    expect(dayRange("2026-10-01", "2026-10-02")).toEqual({
      fromIso: "2026-09-30T23:00:00.000Z",
      toIso: "2026-10-02T23:00:00.000Z",
    });
    expect(dayRange()).toEqual({});
  });
  it("sanitises PostgREST-breaking characters", () => {
    expect(sanitizeSearch("a,b(c)%d*")).toBe("a b c d");
  });
  it("parses wallet and audit filters", () => {
    expect(parseWalletFilters({ status: "frozen", q: "x" })).toEqual({ q: "x", status: "frozen", page: 1 });
    expect(parseWalletFilters({ status: "weird" }).status).toBeUndefined();
    expect(parseAuditFilters({ action: "wallet.adjust!", page: "2" })).toMatchObject({ action: "wallet.adjust", page: 2 });
  });
  it("computes page windows", () => {
    expect(pageRange(1)).toEqual([0, 24]);
    expect(pageRange(3, 10)).toEqual([20, 29]);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(51)).toBe(3);
  });
});

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("x\ny")).toBe('"x\ny"');
  });
  it("neutralises formulas in text but not numbers", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+213")).toBe("'+213");
    expect(csvCell(-500)).toBe("-500");
    expect(csvCell(null)).toBe("");
  });
  it("builds rows with CRLF", () => {
    const out = toCsv([{ header: "a", value: (r: { a: number }) => r.a }, { header: "b", value: () => "x,y" }], [{ a: 1 }, { a: 2 }]);
    expect(out).toBe('a,b\r\n1,"x,y"\r\n2,"x,y"\r\n');
  });
});

describe("statement", () => {
  it("uses stored balance_after and falls back to walking back", () => {
    const rows = withRunningBalance(
      [
        { id: "c", amount: -300, balance_after: null, created_at: "3", kind: "withdrawal" },
        { id: "b", amount: 200, balance_after: 700, created_at: "2", kind: "deposit" },
        { id: "a", amount: 500, balance_after: null, created_at: "1", kind: "deposit" },
      ],
      400
    );
    expect(rows.map((r) => r.balance)).toEqual([400, 700, 500]);
  });
  it("rounds away float noise", () => {
    const rows = withRunningBalance(
      [
        { id: "b", amount: 0.1, balance_after: null, created_at: "2", kind: "x" },
        { id: "a", amount: 0.2, balance_after: null, created_at: "1", kind: "x" },
      ],
      0.3
    );
    expect(rows.map((r) => r.balance)).toEqual([0.3, 0.2]);
  });
  it("computes available and signed adjustments", () => {
    expect(available(1000, 250.5)).toBe(749.5);
    expect(signedAdjustment("credit", "1 500,5")).toBe(1500.5);
    expect(signedAdjustment("debit", "200")).toBe(-200);
    expect(signedAdjustment("debit", "0")).toBeNull();
    expect(signedAdjustment("credit", "abc")).toBeNull();
  });
});

describe("lifecycle", () => {
  it("maps status to actions", () => {
    expect(txActions("pending")).toEqual(["cancel"]);
    expect(txActions("review")).toEqual(["approve", "reject"]);
    expect(txActions("completed")).toEqual(["reverse"]);
    expect(txActions("cancelled")).toEqual([]);
    expect(txActions("reversed")).toEqual([]);
    expect(needsReason("approve")).toBe(false);
    expect(needsReason("reverse")).toBe(true);
  });
  it("orders the timeline and hides expiry once resolved", () => {
    const base = { created_at: "2026-10-01T10:00:00Z" };
    expect(buildTimeline({ ...base, status: "pending", expires_at: "2026-10-01T10:15:00Z" }).map((e) => e.key)).toEqual(["created", "expires"]);
    const done = buildTimeline({
      ...base,
      status: "reversed",
      expires_at: "2026-10-01T10:15:00Z",
      completed_at: "2026-10-01T10:05:00Z",
      reversed_at: "2026-10-02T09:00:00Z",
      reversal_reason: "dup",
    });
    expect(done.map((e) => e.key)).toEqual(["created", "completed", "reversed"]);
    expect(done[2].note).toBe("dup");
  });
});

describe("capacity", () => {
  it("falls back to the default limit", () => {
    expect(effectiveLimit(150000, 200000)).toBe(150000);
    expect(effectiveLimit(null, 200000)).toBe(200000);
    expect(effectiveLimit(undefined, null)).toBeNull();
  });
  it("computes ratio, level and percent", () => {
    expect(capacityRatio(100000, 200000)).toBe(0.5);
    expect(capacityRatio(-5, 100)).toBe(0);
    expect(capacityRatio(10, null)).toBeNull();
    expect(capacityRatio(10, 0)).toBeNull();
    expect(capacityLevel(0.79)).toBe("ok");
    expect(capacityLevel(0.8)).toBe("warn");
    expect(capacityLevel(1)).toBe("full");
    expect(capacityLevel(null)).toBe("ok");
    expect(capacityPercent(0.456)).toBe(46);
    expect(capacityPercent(null)).toBeNull();
  });
});

describe("errors", () => {
  it("knows server codes", () => {
    expect(knownErrorCode("insufficient_funds")).toBe("insufficient_funds");
    expect(knownErrorCode("weird")).toBeNull();
    expect(knownErrorCode(undefined)).toBeNull();
  });
  it("detects a missing table or column", () => {
    expect(isMissingSchema({ code: "42P01" })).toBe(true);
    expect(isMissingSchema({ code: "PGRST205" })).toBe(true);
    expect(isMissingSchema({ message: 'column "x" does not exist' })).toBe(true);
    expect(isMissingSchema({ code: "23505", message: "dup" })).toBe(false);
    expect(isMissingSchema({ code: "22P02", message: 'invalid input value for enum transaction_status: "review"' })).toBe(true);
    expect(isMissingSchema({ code: "22P02", message: "invalid input syntax for type uuid" })).toBe(false);
    expect(isMissingSchema(null)).toBe(false);
  });
});

describe("settings", () => {
  it("normalises a partial row onto defaults", () => {
    const s = normalizeSettings({ deposit_fee_rate: "0.03", electronic_enabled: true, quick_amounts: [500, "1000"] });
    expect(s.deposit_fee_rate).toBe(0.03);
    expect(s.withdrawal_fee_rate).toBe(0.02);
    expect(s.quick_amounts).toEqual([500, 1000]);
    expect(s.electronic_enabled).toBe(true);
    expect(normalizeSettings(null)).toMatchObject({ min_amount: 1000 });
  });
  it("formats rates", () => {
    expect(ratePct(0.02)).toBe("2%");
    expect(ratePct(0.002)).toBe("0.2%");
  });
  it("round-trips defaults through the form", () => {
    const r = validateSettings(toSettingsForm(SETTINGS_DEFAULTS));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload).toMatchObject({ deposit_fee_rate: 0.02, min_amount: 1000, quick_amounts: [1000, 2000, 5000, 10000] });
  });
  it("flags invalid fields", () => {
    const f = toSettingsForm(SETTINGS_DEFAULTS);
    const r = validateSettings({ ...f, deposit_fee_pct: "80", max_amount: "10", monthly_deposit_limit: "5", pending_expiry_minutes: "0", quick_amounts: "a", electronic_enabled: true });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(["deposit_fee_pct", "electronic_accounts", "max_amount", "monthly_deposit_limit", "pending_expiry_minutes", "quick_amounts"]);
    }
  });
  it("rejects duplicate dues method ids", () => {
    const f = toSettingsForm(SETTINGS_DEFAULTS);
    const r = validateSettings({ ...f, dues_payment_methods: [{ id: "ccp", label: "A" }, { id: "ccp", label: "B" }] });
    expect(r.ok).toBe(false);
  });
});

describe("offers", () => {
  const row = { id: "1", title: { en: "a", fr: "b", ar: "c" }, min_deposit: "5000", bonus_type: "percent", bonus_value: "10", max_bonus: "1000", starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-10-31T00:00:00Z", active: true, per_user_limit: 1, budget: "50000", used_count: 2, used_amount: "1000" };
  it("normalises and computes state", () => {
    const o = normalizeOffer(row);
    expect(o.bonus_value).toBe(10);
    expect(o.budget).toBe(50000);
    const day = (d: string) => Date.parse(d);
    expect(offerState(o, day("2026-09-01T00:00:00Z"))).toBe("scheduled");
    expect(offerState(o, day("2026-10-15T00:00:00Z"))).toBe("live");
    expect(offerState(o, day("2026-11-15T00:00:00Z"))).toBe("ended");
    expect(offerState({ ...o, active: false }, day("2026-10-15T00:00:00Z"))).toBe("inactive");
    expect(offerState({ ...o, used_amount: 50000 }, day("2026-10-15T00:00:00Z"))).toBe("exhausted");
  });
  it("converts instants to Algiers wall time", () => {
    expect(isoToLocalInput("2026-10-01T23:30:00Z")).toBe("2026-10-02T00:30");
    expect(isoToLocalInput(null)).toBe("");
  });
  it("validates the drawer form", () => {
    const bad = validateOffer(emptyOfferForm());
    expect(bad.ok).toBe(false);
    const ok = validateOffer({
      ...emptyOfferForm(),
      title: { en: "x", fr: "y", ar: "z" },
      min_deposit: "5000",
      bonus_value: "10",
      bonus_type: "percent",
      max_bonus: "1000",
      starts_at: "2026-10-01T00:00",
      ends_at: "2026-10-31T00:00",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.payload.starts_at).toBe("2026-09-30T23:00:00.000Z");
      expect(ok.payload.max_bonus).toBe(1000);
    }
  });
  it("rejects a percent over 100, an inverted window and drops max_bonus for fixed", () => {
    const f = { ...emptyOfferForm(), title: { en: "x", fr: "y", ar: "z" }, min_deposit: "0", bonus_value: "150", bonus_type: "percent" as const, starts_at: "2026-10-02T00:00", ends_at: "2026-10-01T00:00" };
    const r = validateOffer(f);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["bonus_value", "window"]);
    const fixed = validateOffer({ ...f, bonus_type: "fixed", bonus_value: "500", max_bonus: "99", starts_at: "2026-10-01T00:00", ends_at: "2026-10-02T00:00" });
    expect(fixed.ok && fixed.payload.max_bonus).toBeNull();
  });
});

describe("attention", () => {
  it("lists only non-zero items", () => {
    const items = attentionItems({ reviewCount: 2, pendingAgentPayments: 0, pendingMerchantPayments: 1, agentsNearLimit: 0, driftCount: null, frozenWallets: 3 });
    expect(items.map((i) => i.key)).toEqual(["review", "merchant_payments", "frozen"]);
    expect(attentionItems({ reviewCount: 0, pendingAgentPayments: 0, pendingMerchantPayments: 0, agentsNearLimit: 0, driftCount: 4, frozenWallets: 0 })[0].key).toBe("drift");
  });
});

import { normalizeReconciliation } from "./reconciliation";
describe("reconciliation", () => {
  it("accepts the likely shape and derives diff/drift", () => {
    const r = normalizeReconciliation({
      mismatches: [{ user_id: "u1", ledger_balance: "1000", derived_balance: 900 }],
      totals: { circulation: 5000, held: 200, wallets: 3 },
    });
    expect(r.mismatches[0]).toMatchObject({ userId: "u1", ledger: 1000, derived: 900, diff: 100 });
    expect(r).toMatchObject({ circulation: 5000, held: 200, wallets: 3, drift: 1 });
  });
  it("throws on an unrelated payload", () => {
    expect(() => normalizeReconciliation({ error: "x" })).toThrow();
  });
});

import { formatDateTime, safeHttpUrl, shortId, signedDA } from "./format";
describe("format", () => {
  it("formats Algiers date-time and tolerates bad input", () => {
    expect(formatDateTime("2026-10-16T13:05:00Z", "fr")).toContain("14:05");
    expect(formatDateTime(null, "en")).toBe("—");
    expect(formatDateTime("nope", "en")).toBe("—");
  });
  it("signs amounts", () => {
    expect(signedDA(1500)).toBe("+1,500 DA");
    expect(signedDA(-300.5)).toBe("−300.5 DA");
  });
  it("only allows http(s) links", () => {
    expect(safeHttpUrl("https://x.dz/r.png")).toBe("https://x.dz/r.png");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
    expect(shortId("12345678-aaaa")).toBe("12345678");
  });
});
