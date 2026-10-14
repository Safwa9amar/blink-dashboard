// Computed availability of a promotion. Same precedence as blink-server
// (`promotionAvailability` in src/lib/coupons.ts), spec §3:
// archived → paused → scheduled → ended → sold_out → budget_spent → live.

export type Availability =
  | "archived"
  | "paused"
  | "scheduled"
  | "ended"
  | "sold_out"
  | "budget_spent"
  | "live";

export interface AvailabilityInput {
  archived_at: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_coupons: number | null;
  discount_budget: number | null;
}

export interface AvailabilityUsage {
  issued: number;
  discount_given: number;
}

export function promotionAvailability(
  p: AvailabilityInput,
  usage: AvailabilityUsage,
  now: Date = new Date()
): Availability {
  const t = now.getTime();
  if (p.archived_at) return "archived";
  if (!p.is_active) return "paused";
  if (p.starts_at && new Date(p.starts_at).getTime() > t) return "scheduled";
  if (p.ends_at && new Date(p.ends_at).getTime() < t) return "ended";
  if (p.max_coupons != null && usage.issued >= p.max_coupons) return "sold_out";
  if (p.discount_budget != null && usage.discount_given >= p.discount_budget) return "budget_spent";
  return "live";
}
