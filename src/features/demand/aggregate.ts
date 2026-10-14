// Pure aggregation for the Demand page. No I/O: the loader fetches rows, this turns them
// into the snapshot. Volumes are small (tens of orders); when they grow, move the group-bys
// to SQL (an RPC with date_trunc at time zone 'Africa/Algiers') and keep these as the spec.
import type {
  AreaStat,
  DemandKpis,
  DemandOrder,
  DemandRange,
  DemandSnapshot,
  DemandStore,
  HeatGrid,
  HourBucket,
  MixSlice,
  OnlineRider,
  OrderType,
  StoreStat,
} from "./types";

export const TZ = "Africa/Algiers";
export const CELL_DEG = 0.015;
export const ACTIVE_STATUSES = ["processing", "searching", "heading_to_store", "preparation", "pickup", "on_the_way"];
export const FAILED_STATUSES = ["canceled", "merchant_rejected"];
/** Hour bands [from, to) shown on the heatmap. */
export const HEAT_BANDS: [number, number][] = [[0, 6], [6, 10], [10, 14], [14, 18], [18, 22], [22, 24]];
/** Algerian week order, Saturday first. */
export const WEEK_KEYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;
const ORDER_TYPES: OrderType[] = ["merchant", "shopper", "courier", "ride"];

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", weekday: "short", hourCycle: "h23" });

/** Algiers hour (0-23) and weekday index (0 = Saturday .. 6 = Friday) of an instant. */
export function algiersParts(iso: string | Date): { hour: number; weekday: number } | null {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  let hour = 0;
  let wd = "";
  for (const p of fmt.formatToParts(d)) {
    if (p.type === "hour") hour = Number(p.value) % 24;
    if (p.type === "weekday") wd = p.value.slice(0, 3).toLowerCase();
  }
  const weekday = (WEEK_KEYS as readonly string[]).indexOf(wd);
  return weekday < 0 ? null : { hour, weekday };
}

export function bandOf(hour: number): number {
  const i = HEAT_BANDS.findIndex(([a, b]) => hour >= a && hour < b);
  return i < 0 ? HEAT_BANDS.length - 1 : i;
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const minutesBetween = (from: string, to: string): number | null => {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Number.isFinite(ms) && ms >= 0 ? ms / 60_000 : null;
};

export const isFailed = (o: Pick<DemandOrder, "status">) => FAILED_STATUSES.includes(o.status);
export const isActive = (o: Pick<DemandOrder, "status">) => ACTIVE_STATUSES.includes(o.status);
/** Unmet demand: canceled or rejected before any rider was assigned. */
export const isUnmet = (o: Pick<DemandOrder, "status" | "rider_assigned_at">) => isFailed(o) && !o.rider_assigned_at;

const waitOf = (o: DemandOrder) => (o.rider_assigned_at ? minutesBetween(o.created_at, o.rider_assigned_at) : null);

const nums = (xs: (number | null)[]) => xs.filter((x): x is number => x != null);

/** Start of the window: Algiers midnight of today, minus N-1 days. Algiers is UTC+1 with no DST. */
export function rangeStartISO(range: DemandRange, now: Date = new Date()): string {
  const DAY = 86_400_000;
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const algiersMidnight = Math.floor((now.getTime() + 3_600_000) / DAY) * DAY;
  return new Date(algiersMidnight - (days - 1) * DAY - 3_600_000).toISOString();
}

export function computeKpis(orders: DemandOrder[]): DemandKpis {
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const finished = delivered + orders.filter(isFailed).length;
  const unmet = orders.filter(isUnmet).length;
  return {
    orders: orders.length,
    delivered,
    finished,
    completionRate: finished ? delivered / finished : null,
    unmet,
    unmetRate: orders.length ? unmet / orders.length : null,
    medianWait: median(nums(orders.map(waitOf))),
    medianDelivery: median(
      nums(orders.map((o) => (o.status === "delivered" && o.delivered_at ? minutesBetween(o.created_at, o.delivered_at) : null)))
    ),
  };
}

export function computeHours(orders: DemandOrder[]): HourBucket[] {
  const waits: number[][] = Array.from({ length: 24 }, () => []);
  const out: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, delivered: 0, failed: 0, active: 0, total: 0, medianWait: null }));
  for (const o of orders) {
    const p = algiersParts(o.created_at);
    if (!p) continue;
    const b = out[p.hour];
    b.total++;
    if (o.status === "delivered") b.delivered++;
    else if (isFailed(o)) b.failed++;
    else b.active++;
    const w = waitOf(o);
    if (w != null) waits[p.hour].push(w);
  }
  for (const b of out) b.medianWait = median(waits[b.hour]);
  return out;
}

export function computeMix(orders: DemandOrder[]): MixSlice[] {
  const counts = new Map<OrderType, number>();
  for (const o of orders) {
    const t = ORDER_TYPES.find((x) => x === o.type);
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return ORDER_TYPES.filter((t) => counts.has(t)).map((type) => ({ type, count: counts.get(type)! }));
}

export function computeHeat(orders: DemandOrder[]): HeatGrid {
  const cells = WEEK_KEYS.map(() => HEAT_BANDS.map(() => 0));
  for (const o of orders) {
    const p = algiersParts(o.created_at);
    if (p) cells[p.weekday][bandOf(p.hour)]++;
  }
  return { cells, max: Math.max(0, ...cells.flat()) };
}

const cellIdx = (v: number) => Math.round(v / CELL_DEG);
const cellId = (lat: number, lng: number) => `${cellIdx(lat)}:${cellIdx(lng)}`;

/** Where an order was placed: its pickup point, else its store's location. */
function locate(o: DemandOrder, stores: Map<string, DemandStore>): [number, number] | null {
  if (o.pickup_lat != null && o.pickup_lng != null) return [Number(o.pickup_lat), Number(o.pickup_lng)];
  const s = o.store_id ? stores.get(o.store_id) : undefined;
  return s && s.latitude != null && s.longitude != null ? [Number(s.latitude), Number(s.longitude)] : null;
}

const d2 = (a: number, b: number, c: number, d: number) => (a - c) ** 2 + (b - d) ** 2;

/** City of the store nearest to a point, falling back to "lat, lng". */
export function areaLabel(lat: number, lng: number, stores: DemandStore[]): string {
  let best: DemandStore | null = null;
  let bd = Infinity;
  for (const s of stores) {
    if (s.latitude == null || s.longitude == null || !s.city) continue;
    const d = d2(lat, lng, Number(s.latitude), Number(s.longitude));
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best?.city ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

export function computeAreas(orders: DemandOrder[], stores: DemandStore[], riders: OnlineRider[]): AreaStat[] {
  const byId = new Map(stores.map((s) => [s.id, s]));
  const ridersIn = new Map<string, number>();
  for (const r of riders) ridersIn.set(cellId(r.lat, r.lng), (ridersIn.get(cellId(r.lat, r.lng)) ?? 0) + 1);

  const groups = new Map<string, DemandOrder[]>();
  for (const o of orders) {
    const at = locate(o, byId);
    if (!at) continue;
    const id = cellId(at[0], at[1]);
    (groups.get(id) ?? groups.set(id, []).get(id)!).push(o);
  }

  const out: AreaStat[] = [];
  for (const [id, list] of groups) {
    const [ri, rj] = id.split(":").map(Number);
    const lat = ri * CELL_DEG;
    const lng = rj * CELL_DEG;
    const unmet = list.filter(isUnmet).length;
    const perStore = new Map<string, { name: string; orders: number }>();
    for (const o of list) {
      const name = (o.store_id ? byId.get(o.store_id)?.name : null) ?? o.store_name;
      if (!name) continue;
      const k = o.store_id ?? name;
      const cur = perStore.get(k) ?? { name, orders: 0 };
      cur.orders++;
      perStore.set(k, cur);
    }
    out.push({
      id,
      label: areaLabel(lat, lng, stores),
      lat,
      lng,
      orders: list.length,
      unmet,
      unmetRate: unmet / list.length,
      medianWait: median(nums(list.map(waitOf))),
      ridersNow: ridersIn.get(id) ?? 0,
      topStores: [...perStore.values()].sort((a, b) => b.orders - a.orders).slice(0, 3),
    });
  }
  return out.sort((a, b) => b.orders - a.orders || a.label.localeCompare(b.label));
}

export function computeStores(orders: DemandOrder[], stores: DemandStore[]): StoreStat[] {
  const byId = new Map(stores.map((s) => [s.id, s]));
  const m = new Map<string, StoreStat>();
  for (const o of orders) {
    const name = (o.store_id ? byId.get(o.store_id)?.name : null) ?? o.store_name;
    if (!name) continue;
    const key = o.store_id ?? name;
    const s = m.get(key) ?? { key, name, orders: 0, delivered: 0, finished: 0, completionRate: null };
    s.orders++;
    if (o.status === "delivered") {
      s.delivered++;
      s.finished++;
    } else if (isFailed(o)) s.finished++;
    m.set(key, s);
  }
  return [...m.values()]
    .map((s) => ({ ...s, completionRate: s.finished ? s.delivered / s.finished : null }))
    .sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name));
}

export function aggregateDemand(input: {
  range: DemandRange;
  orders: DemandOrder[];
  stores: DemandStore[];
  riders: OnlineRider[];
  truncated?: boolean;
  now?: Date;
}): DemandSnapshot {
  const { orders, stores, riders } = input;
  return {
    range: input.range,
    generatedAt: (input.now ?? new Date()).toISOString(),
    truncated: input.truncated ?? false,
    kpis: computeKpis(orders),
    hours: computeHours(orders),
    mix: computeMix(orders),
    heat: computeHeat(orders),
    areas: computeAreas(orders, stores, riders),
    stores: computeStores(orders, stores),
    riders,
  };
}

export function emptySnapshot(range: DemandRange, error?: string): DemandSnapshot {
  return { ...aggregateDemand({ range, orders: [], stores: [], riders: [] }), error };
}
