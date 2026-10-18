// Mirrors the blink-server staff pricing contract (`/pricing/admin/*`, tag admin-pricing).

export const PRICING_KEYS = [
  "service_fee",
  "courier_fare",
  "ride_fare",
  "fare_multiplier",
  "rider_commission_rate",
  "merchant_commission_rate",
  "blink_cash_fee_rate",
  "agent_platform_share",
  "rider_cancel_penalty",
  "stamp_duty_rate",
  "agent_tax_rate",
  "dues_payment_fee_rate",
] as const;
export type PricingKey = (typeof PRICING_KEYS)[number];

export type FeeGroup = "customer" | "partner" | "tax";

export interface FareTier {
  base: number;
  included_km: number;
  per_km: number;
  max_km: number;
}

export interface FeeValueMap {
  service_fee: { amount: number };
  courier_fare: { bicycle: FareTier; motorcycle: FareTier; extra_stop_fee: number };
  ride_fare: { motorcycle: FareTier };
  fare_multiplier: { multiplier: number };
  rider_commission_rate: { rate: number };
  merchant_commission_rate: { rate: number };
  blink_cash_fee_rate: { rate: number };
  agent_platform_share: { rate: number };
  rider_cancel_penalty: { amount: number };
  stamp_duty_rate: { rate: number };
  agent_tax_rate: { rate: number };
  dues_payment_fee_rate: { rate: number };
}
/** A fee value — shape depends on the key (see FeeValueMap). */
export type FeeValue = FeeValueMap[PricingKey];

export type Scopes = { service: string[] | null; wilaya: boolean; merchant: boolean; agent: boolean };

export type Fee = {
  key: PricingKey;
  group: FeeGroup;
  scopes: Scopes;
  value: FeeValue;
  seed: FeeValue;
  updated_at: string | null;
  updated_by: string | null;
  active_overrides: number;
};

export type OverrideStatus = "active" | "scheduled" | "ended" | "archived";

export type Override = {
  id: string;
  key: PricingKey;
  service: string | null;
  wilaya_code: string | null;
  merchant_id: string | null;
  agent_id: string | null;
  value: FeeValue;
  starts_at: string | null;
  ends_at: string | null;
  note: string | null;
  status: OverrideStatus;
  partner_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChangeAction = "update_default" | "create_override" | "update_override" | "archive_override";

export type Change = {
  id: string;
  key: PricingKey;
  override_id: string | null;
  action: ChangeAction;
  before: FeeValue | null;
  after: FeeValue | null;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
};

export type PreviewContext = {
  service?: string;
  wilaya_code?: string;
  merchant_id?: string;
  agent_id?: string;
  at?: string;
};

export type PreviewValue = {
  key: PricingKey;
  value: FeeValue;
  override_id: string | null;
  scope: { service?: string | null; wilaya_code?: string | null; merchant_id?: string | null; agent_id?: string | null } | null;
};

export type PreviewResult = { values: PreviewValue[]; examples: Record<string, unknown> };

export type OverrideInput = {
  key: PricingKey;
  service?: string;
  wilaya_code?: string;
  merchant_id?: string;
  agent_id?: string;
  value: FeeValue;
  starts_at?: string | null;
  ends_at?: string | null;
  note?: string | null;
};

export type OverrideFilters = {
  key?: string;
  status?: string;
  wilaya_code?: string;
  merchant_id?: string;
  agent_id?: string;
};

export type PartnerKind = "merchant" | "agent";
export type PartnerHit = { id: string; name: string; sub: string };

/** Result of a pricing server action. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; stale?: boolean; conflictId?: string };

export type TFn = (key: string, values?: Record<string, string | number>) => string;
