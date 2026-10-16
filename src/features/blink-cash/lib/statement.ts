// Wallet statement helpers. Pure.

export interface StatementEntry {
  id: string;
  amount: number;
  /** Balance right after this entry, as stored by blink_wallet_post. */
  balance_after: number | null;
  created_at: string;
  kind: string;
  memo?: string | null;
  transaction_id?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  actor_id?: string | null;
}

export interface StatementRow extends StatementEntry {
  /** Running balance after this entry. */
  balance: number;
}

/**
 * Adds a running balance to entries sorted NEWEST first. Uses the stored
 * `balance_after` when present; otherwise walks back from `currentBalance`
 * (the wallet balance the newest entry should end on), so a page that doesn't
 * start at the newest entry still lines up if `currentBalance` is that page's top.
 */
export function withRunningBalance(entries: StatementEntry[], currentBalance: number): StatementRow[] {
  let running = currentBalance;
  return entries.map((e) => {
    const stored = e.balance_after;
    const balance = typeof stored === "number" && Number.isFinite(stored) ? stored : running;
    running = Math.round((balance - e.amount) * 100) / 100;
    return { ...e, balance };
  });
}

export const available = (balance: number, held: number) => Math.round((balance - held) * 100) / 100;

/** Signed adjustment from the dialog: credit => +, debit => −. NaN/≤0 -> null. */
export function signedAdjustment(direction: "credit" | "debit", raw: string): number | null {
  const n = Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const cents = Math.round(n * 100) / 100;
  return direction === "credit" ? cents : -cents;
}
