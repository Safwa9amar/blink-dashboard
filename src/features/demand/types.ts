// Domain types for the demand feature (real data, aggregated in ./aggregate.ts).

export type DemandRange = "today" | "7d" | "30d";
export const DEMAND_RANGES: DemandRange[] = ["today", "7d", "30d"];

export type OrderType = "merchant" | "shopper" | "courier" | "ride";

/** The `orders` columns the aggregation needs. */
export interface DemandOrder {
  id: string;
  type: string | null;
  status: string;
  created_at: string;
  rider_assigned_at: string | null;
  delivered_at: string | null;
  store_id: string | null;
  store_name: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
}

export interface DemandStore {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface OnlineRider {
  id: string;
  lat: number;
  lng: number;
}

export interface HourBucket {
  hour: number;
  delivered: number;
  failed: number;
  active: number;
  total: number;
  /** Median minutes from placement to rider assigned, null when no order had a rider. */
  medianWait: number | null;
}

export interface DemandKpis {
  orders: number;
  delivered: number;
  /** delivered + canceled + rejected. */
  finished: number;
  /** 0..1, null when nothing finished yet. */
  completionRate: number | null;
  unmet: number;
  /** 0..1, null when no orders. */
  unmetRate: number | null;
  medianWait: number | null;
  medianDelivery: number | null;
}

export interface MixSlice {
  type: OrderType;
  count: number;
}

export interface HeatGrid {
  /** [weekday Sat..Fri][band 0..5] */
  cells: number[][];
  max: number;
}

export interface StoreStat {
  key: string;
  name: string;
  orders: number;
  delivered: number;
  finished: number;
  /** 0..1, null when none finished. */
  completionRate: number | null;
}

export interface AreaStat {
  id: string;
  label: string;
  lat: number;
  lng: number;
  orders: number;
  unmet: number;
  /** 0..1 */
  unmetRate: number;
  medianWait: number | null;
  ridersNow: number;
  topStores: { name: string; orders: number }[];
}

export interface DemandSnapshot {
  range: DemandRange;
  generatedAt: string;
  /** True when the row cap was hit (older orders are missing). */
  truncated: boolean;
  error?: string;
  kpis: DemandKpis;
  hours: HourBucket[];
  mix: MixSlice[];
  heat: HeatGrid;
  areas: AreaStat[];
  stores: StoreStat[];
  riders: OnlineRider[];
}
