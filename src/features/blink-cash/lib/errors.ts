// Server error codes surfaced by the staff API (spec §1 / §5 / §7) that have a
// translated message under `blink_cash.err.<code>`.
export const KNOWN_ERROR_CODES = [
  "insufficient_funds",
  "wallet_frozen",
  "not_pending",
  "not_in_review",
  "not_completed",
  "expired",
  "wrong_agent",
  "not_found",
  "adjust_limit",
  "negative_balance",
  "already_frozen",
  "not_frozen",
  "agent_limit_reached",
  "invalid",
  "forbidden",
] as const;

// The staff API's own names for codes that share a message here.
const ALIASES: Record<string, string> = {
  adjust_limit_exceeded: "adjust_limit",
  invalid_settings: "invalid",
  invalid_offer: "invalid",
  invalid_amount: "invalid",
};

export function knownErrorCode(code: string | null | undefined): string | null {
  const c = code ? (ALIASES[code] ?? code) : null;
  return c && (KNOWN_ERROR_CODES as readonly string[]).includes(c) ? c : null;
}

/** Postgres / PostgREST "table or column missing" — the migration isn't applied yet. */
export function isMissingSchema(e: { code?: string; message?: string } | null | undefined): boolean {
  if (!e) return false;
  if (e.code && ["42703", "42P01", "PGRST204", "PGRST205"].includes(e.code)) return true;
  // A filter on a not-yet-added enum value (transaction_status 'review' / 'reversed').
  if (e.code === "22P02" && /enum/i.test(e.message ?? "")) return true;
  return /does not exist|schema cache/i.test(e.message ?? "");
}
