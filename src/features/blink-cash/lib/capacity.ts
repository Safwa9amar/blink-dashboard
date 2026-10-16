// Agent cash capacity: how much of its limit an agent's unsettled cash uses. Pure.

export type CapacityLevel = "ok" | "warn" | "full";
export const CAPACITY_WARN = 0.8;

/** The agent's own limit, else the settings default; null when neither is known. */
export function effectiveLimit(agentLimit: number | null | undefined, defaultLimit: number | null | undefined) {
  if (typeof agentLimit === "number" && Number.isFinite(agentLimit)) return agentLimit;
  if (typeof defaultLimit === "number" && Number.isFinite(defaultLimit)) return defaultLimit;
  return null;
}

/** 0..∞ ratio (1 = at the limit); null without a usable limit. */
export function capacityRatio(owed: number, limit: number | null): number | null {
  if (limit === null || !(limit > 0)) return null;
  return Math.max(0, owed) / limit;
}

export function capacityLevel(ratio: number | null): CapacityLevel {
  if (ratio === null) return "ok";
  if (ratio >= 1) return "full";
  return ratio >= CAPACITY_WARN ? "warn" : "ok";
}

/** Whole-percent label, capped for display at 999. */
export const capacityPercent = (ratio: number | null) => (ratio === null ? null : Math.min(999, Math.round(ratio * 100)));
