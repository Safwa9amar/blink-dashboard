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
  courier_fare: {
    bicycle: FareTier;
    motorcycle: FareTier;
    extra_stop_fee: number;
  };
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

export type Scopes = {
  service: string[] | null;
  wilaya: boolean;
  merchant: boolean;
  agent: boolean;
};

export type FeeField = {
  /** Dotted path into the value, e.g. "amount", "bicycle.base". */
  path: string;
  unit: "da" | "rate" | "km" | "multiplier";
  min: number;
  max: number;
  step: number;
};

export type Fee = {
  key: PricingKey;
  group: FeeGroup;
  scopes: Scopes;
  value: FeeValue;
  seed: FeeValue;
  fields: FeeField[];
  updated_at: string | null;
  updated_by: string | null;
  active_overrides: number;
  /** Server-computed worked example for the default value (never computed in the dashboard). */
  example?: FeeExample | null;
};

export type FeeVehicle = "motorcycle" | "bicycle";

/** Worked example built by blink-server (`src/lib/pricing/examples.ts`). */
export type FeeExample =
  | { kind: "per_checkout"; output: number }
  | { kind: "trip_km"; vehicle: FeeVehicle; km: number; output: number }
  | { kind: "multiplier"; input: number; output: number }
  | { kind: "rate_on_amount"; input: number; output: number }
  | { kind: "agent_split"; input: number; output: number }
  | { kind: "amount"; output: number };

export type CandidateExample = { key: PricingKey; before: FeeExample | null; after: FeeExample | null };

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
  scope: {
    service?: string | null;
    wilaya_code?: string | null;
    merchant_id?: string | null;
    agent_id?: string | null;
  } | null;
};

export type PreviewSample = { km?: number; stops?: number; amount?: number };

export type PreviewExamples = {
  courier_fare?: { bicycle: number; motorcycle: number };
  ride_fare?: { motorcycle: number };
  blink_cash_fee?: { type: string; amount: number; fees: number };
};

export type PreviewResult = {
  values: PreviewValue[];
  examples?: PreviewExamples;
  candidate_examples?: PreviewExamples;
  candidate_example?: CandidateExample;
};

export type SimScenario = "store" | "courier" | "ride" | "deposit" | "withdrawal";
export type SimParty = "merchant" | "rider" | "agent" | "blink" | "tax";
export type SimLabel =
  | "merchant_keeps"
  | "rider_keeps"
  | "agent_keeps"
  | "service_fee"
  | "merchant_commission"
  | "rider_commission"
  | "platform_share"
  | "stamp_duty"
  | "agent_tax";

export type SimulateBody = {
  scenario: SimScenario;
  context?: { wilaya_code?: string; merchant_id?: string; agent_id?: string; store_id?: string; at?: string };
  inputs?: {
    subtotal?: number;
    delivery_fee?: number;
    km?: number;
    stops?: number;
    vehicle?: FeeVehicle;
    amount?: number;
  };
};

export type SimulateResult = {
  scenario: SimScenario;
  payer_total: number;
  lines: { party: SimParty; label: SimLabel; amount: number }[];
  values: PreviewValue[];
  unavailable: null | "too_far";
};

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
  | { ok: false; error: string; stale?: boolean; conflictId?: string; status?: number };

export type TFn = (key: string, values?: Record<string, string | number>) => string;
