import type { Fee, Override, PricingKey, Tier } from "./types";
import { liveTiers } from "./zones";

// Tier matrix: one row per tier-scopable fee (per service for service-scoped fees), one column
// per live tier. A cell shows the undated tier-only override when there is one, else the default.

export type MatrixRow = {
  fee: Fee;
  /** Set when the fee is scoped to several services: this row is that service only. */
  service: string | null;
  id: string;
};

export type MatrixCell = {
  kind: "override" | "inherited";
  value: Fee["value"];
  /** The override that edits this cell (kind "override" only). */
  override: Override | null;
  /** A broader tier override (any service) supplies the value shown. */
  fromTierWide: boolean;
};

const isUndated = (o: Override) => !o.starts_at && !o.ends_at;

/** Active, undated, tier-only (no zone / wilaya / partner) override for this fee + tier + service. */
export function findTierOverride(overrides: Override[], key: PricingKey, tier: string, service: string | null): Override | null {
  return (
    overrides.find(
      (o) =>
        o.key === key &&
        o.status === "active" &&
        isUndated(o) &&
        o.tier === tier &&
        !o.zone_id &&
        !o.wilaya_code &&
        !o.merchant_id &&
        !o.agent_id &&
        (o.service ?? null) === service,
    ) ?? null
  );
}

export function matrixRows(fees: Fee[]): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const fee of fees) {
    if (!fee.scopes.tier) continue;
    const services = fee.scopes.service ?? [];
    if (services.length > 1) for (const s of services) rows.push({ fee, service: s, id: `${fee.key}:${s}` });
    else rows.push({ fee, service: null, id: fee.key });
  }
  return rows;
}

export function matrixCell(row: MatrixRow, tier: string, overrides: Override[]): MatrixCell {
  const exact = findTierOverride(overrides, row.fee.key, tier, row.service);
  if (exact) return { kind: "override", value: exact.value, override: exact, fromTierWide: false };
  // On a per-service row, an override for the whole tier (no service) still applies.
  const wide = row.service ? findTierOverride(overrides, row.fee.key, tier, null) : null;
  if (wide) return { kind: "inherited", value: wide.value, override: null, fromTierWide: true };
  return { kind: "inherited", value: row.fee.value, override: null, fromTierWide: false };
}

export type TierMatrix = { tiers: Tier[]; rows: (MatrixRow & { cells: MatrixCell[] })[] };

export function buildTierMatrix(fees: Fee[], overrides: Override[], tiers: Tier[]): TierMatrix {
  const cols = liveTiers(tiers);
  return {
    tiers: cols,
    rows: matrixRows(fees).map((r) => ({ ...r, cells: cols.map((t) => matrixCell(r, t.code, overrides)) })),
  };
}
