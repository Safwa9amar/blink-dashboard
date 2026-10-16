// GET /blink-cash/admin/reconciliation (spec §1): per-wallet ledger balance vs the
// derived balance, plus totals. The exact JSON isn't pinned in the spec, so the
// normaliser accepts the obvious spellings and never throws on a missing field.

export interface ReconMismatch {
  userId: string;
  name: string | null;
  ledger: number;
  derived: number;
  diff: number;
}
export interface Reconciliation {
  mismatches: ReconMismatch[];
  circulation: number;
  held: number;
  wallets: number;
  drift: number;
}

const n = (...vs: unknown[]) => {
  for (const v of vs) {
    const x = Number(v);
    if (v !== null && v !== undefined && v !== "" && Number.isFinite(x)) return x;
  }
  return 0;
};
const o = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export function normalizeReconciliation(payload: unknown): Reconciliation {
  const body = o(payload);
  const list = Array.isArray(body.mismatches) ? (body.mismatches as unknown[]) : Array.isArray(body.drift) ? (body.drift as unknown[]) : null;
  if (!list && !body.totals) throw new Error("Unexpected response from /blink-cash/admin/reconciliation");
  const t = o(body.totals);
  const mismatches = (list ?? []).map((raw) => {
    const m = o(raw);
    const ledger = n(m.ledger_balance, m.ledger, m.balance);
    const derived = n(m.derived_balance, m.derived, m.expected);
    return {
      userId: String(m.user_id ?? m.userId ?? ""),
      name: typeof m.name === "string" && m.name ? m.name : null,
      ledger,
      derived,
      diff: n(m.diff, m.difference, ledger - derived),
    };
  });
  return {
    mismatches,
    circulation: n(t.circulation, t.balance, t.total_balance, body.circulation),
    held: n(t.held, t.total_held, body.held),
    wallets: n(t.wallets, t.wallet_count, body.wallets),
    drift: n(t.drift, t.drift_count, body.drift_count, mismatches.length),
  };
}
