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
  "fare_formula",
  "dropoff_surcharge",
  "service_area",
  "zone_defaults",
] as const;
export type PricingKey = (typeof PRICING_KEYS)[number];

export type FeeGroup = "customer" | "partner" | "tax" | "formula" | "zones";

export interface FareTier {
  base: number;
  included_km: number;
  per_km: number;
  max_km: number;
  /** DA per driving minute (0 = off). Absent on rows stored before zone pricing. */
  per_minute?: number;
}

export type RoundingMode = "up" | "nearest" | "down";

/** The configurable fare pipeline constants (`fare_formula`). */
export interface FareFormula {
  road_factor: number;
  rounding_step: number;
  rounding_mode: RoundingMode;
  min_fare: number;
  /** 0 = no cap. */
  max_fare: number;
  min_ride_km: number;
  speed_kmh: { bicycle: number; motorcycle: number };
  stop_minutes: number;
  boarding_minutes: number;
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
  fare_formula: FareFormula;
  dropoff_surcharge: { amount: number; only_when_tier_changes: boolean };
  service_area: { enabled: boolean };
  zone_defaults: { unzoned_tier: string };
}
/** A fee value — shape depends on the key (see FeeValueMap). */
export type FeeValue = FeeValueMap[PricingKey];

export type Scopes = {
  service: string[] | null;
  wilaya: boolean;
  merchant: boolean;
  agent: boolean;
  /** Absent from older servers: treat as false. */
  zone?: boolean;
  tier?: boolean;
};

export type FeeField = {
  /** Dotted path into the value, e.g. "amount", "bicycle.base". */
  path: string;
  unit: "da" | "rate" | "km" | "multiplier" | "kmh" | "min" | "bool" | "choice" | "tier";
  /** Bounds are meaningless for bool / choice / tier fields. */
  min: number;
  max: number;
  step: number;
  /** Allowed values for `choice` (and `tier`, where they are the live tier codes). */
  options?: string[];
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
  | { kind: "multiplier"; km: number; input: number; output: number }
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
  zone_id?: string | null;
  tier?: string | null;
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

export type FeeChangeAction = "update_default" | "create_override" | "update_override" | "archive_override";
export type ZoneChangeAction = "create_zone" | "update_zone" | "archive_zone";
export type TierChangeAction = "create_tier" | "update_tier" | "archive_tier";
export type ChangeAction = FeeChangeAction | ZoneChangeAction | TierChangeAction;

/** `before` / `after` of a zone or tier change: the row snapshot (name, tier, color, ...). */
export type EntitySnapshot = Record<string, unknown>;

export type Change = {
  id: string;
  /** A fee key, or `pricing_zone` / `pricing_tier` for zone and tier changes. */
  key: PricingKey | "pricing_zone" | "pricing_tier";
  override_id: string | null;
  zone_id?: string | null;
  tier?: string | null;
  action: ChangeAction;
  before: FeeValue | EntitySnapshot | null;
  after: FeeValue | EntitySnapshot | null;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
};

export type PreviewContext = {
  service?: string;
  wilaya_code?: string;
  zone_id?: string;
  tier?: string;
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
    zone_id?: string | null;
    tier?: string | null;
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
  context?: {
    wilaya_code?: string;
    merchant_id?: string;
    agent_id?: string;
    store_id?: string;
    at?: string;
    zone_id?: string;
    tier?: string;
    /** With both points the server derives km, places, surcharge and service area. */
    pickup?: LatLng;
    dropoff?: LatLng;
  };
  inputs?: {
    subtotal?: number;
    delivery_fee?: number;
    km?: number;
    stops?: number;
    vehicle?: FeeVehicle;
    amount?: number;
  };
};

export type LatLng = { lat: number; lng: number };

export type BreakdownStep = "base" | "distance" | "time" | "extra_stops" | "dropoff_surcharge" | "multiplier" | "clamp" | "rounding";
export type BreakdownLine = { step: BreakdownStep; amount: number };

/** Where a point is priced: `place` of a simulate result. */
export type SimPlace = {
  wilaya_code?: string | null;
  zone?: { id: string; name: string; tier: string } | null;
  tier?: string | null;
  unzoned?: boolean;
};

export type SimulateResult = {
  scenario: SimScenario;
  payer_total: number;
  lines: { party: SimParty; label: SimLabel; amount: number }[];
  values: PreviewValue[];
  unavailable: null | "too_far" | "too_close" | "out_of_service_area";
  /** Courier / ride only: the fare, step by step. */
  breakdown?: BreakdownLine[];
  place?: SimPlace | null;
};

export type OverrideInput = {
  key: PricingKey;
  service?: string;
  wilaya_code?: string;
  merchant_id?: string;
  agent_id?: string;
  zone_id?: string;
  tier?: string;
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
  zone_id?: string;
  tier?: string;
};

export type PartnerKind = "merchant" | "agent";
export type PartnerHit = { id: string; name: string; sub: string };

// ---- zones & tiers -----------------------------------------------------------------

export type LocalizedNames = { en: string; fr: string; ar: string };

export type Tier = {
  code: string;
  names: LocalizedNames;
  /** #RRGGBB */
  color: string;
  sort_order: number;
  note: string | null;
  archived_at: string | null;
  zone_count: number;
  override_count: number;
  updated_at: string;
};

export type TierInput = { code: string; names: LocalizedNames; color: string; sort_order?: number; note?: string | null };
export type TierPatch = Partial<Omit<TierInput, "code">> & { expected_updated_at?: string };

/** GeoJSON, `[lng, lat]` order. */
export type Position = [number, number];
export type PolygonGeometry = { type: "Polygon"; coordinates: Position[][] };
export type MultiPolygonGeometry = { type: "MultiPolygon"; coordinates: Position[][][] };
export type ZoneGeometry = PolygonGeometry | MultiPolygonGeometry;
export type GeoFeature = { type: "Feature"; properties: Record<string, unknown>; geometry: ZoneGeometry };
export type GeoFeatureCollection = { type: "FeatureCollection"; features: GeoFeature[] };

export type Zone = {
  id: string;
  name: string;
  tier: string;
  wilaya_code: string | null;
  geometry: ZoneGeometry;
  priority: number;
  note: string | null;
  area_km2: number;
  override_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ZoneInput = {
  name: string;
  tier: string;
  geometry: ZoneGeometry;
  priority?: number;
  note?: string | null;
  wilaya_code?: string;
};
export type ZonePatch = Partial<ZoneInput> & { expected_updated_at?: string };

export type ZonesPayload = { zones: Zone[]; tiers: Tier[]; unzoned_tier: string };

export type ZoneLookup = {
  place: {
    wilaya_code: string | null;
    zone: { id: string; name: string; tier: string } | null;
    tier: string;
    unzoned: boolean;
  };
  values: { key: PricingKey; service: string | null; value: FeeValue; override_id: string | null }[];
  samples: {
    scenario: "ride" | "courier";
    vehicle: FeeVehicle;
    km: number;
    fare: number | null;
    available: boolean;
    unavailable: string | null;
  }[];
};

/** Result of a pricing server action. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; stale?: boolean; conflictId?: string; status?: number; code?: string; overrideCount?: number };

export type TFn = (key: string, values?: Record<string, string | number>) => string;
