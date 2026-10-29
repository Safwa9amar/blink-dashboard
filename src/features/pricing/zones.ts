import type { Fee, GeoFeature, GeoFeatureCollection, Override, Position, Tier, Zone, ZoneGeometry } from "./types";

// Pure helpers for the zones map: tier lookups, GeoJSON parse / export. No map code here.

export const MAX_IMPORT_FEATURES = 200;
export const FALLBACK_TIER_COLOR = "#6B7280";

export const liveTiers = (tiers: Tier[]) => tiers.filter((t) => !t.archived_at).sort((a, b) => a.sort_order - b.sort_order);
export const liveZones = (zones: Zone[]) => zones.filter((z) => !z.archived_at);

/** A zone can be priced once it is saved (has an id) and not archived. */
export const canPriceZone = (zone: Pick<Zone, "id" | "archived_at"> | null | undefined): boolean => !!zone?.id && !zone.archived_at;

/** Overrides pinned to a zone that still matter: currently active or scheduled, ordered by fee key. */
export function zoneLiveOverrides(overrides: Override[], zoneId: string): Override[] {
  return overrides
    .filter((o) => o.zone_id === zoneId && (o.status === "active" || o.status === "scheduled"))
    .sort((a, b) => a.key.localeCompare(b.key) || (a.service ?? "").localeCompare(b.service ?? ""));
}

/** Fees that accept a zone scope: the only ones the "set prices" wizard may offer for a zone. */
export const zonePriceFees = (fees: Fee[]): Fee[] => fees.filter((f) => !!f.scopes.zone);

/** The tier's name in the active locale (code when the tier is unknown). */
export function tierName(tiers: Tier[], code: string | null | undefined, locale: string): string {
  if (!code) return "";
  const t = tiers.find((x) => x.code === code);
  if (!t) return code;
  const lang = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  return t.names[lang] || t.names.en || code;
}

export function tierColor(tiers: Tier[], code: string | null | undefined): string {
  return tiers.find((x) => x.code === code)?.color ?? FALLBACK_TIER_COLOR;
}

export const isHexColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
export const isTierCode = (v: string) => /^[a-z][a-z0-9_]{1,23}$/.test(v);

/** Next free sort position for a new tier. */
export const nextTierOrder = (tiers: Tier[]) => tiers.reduce((m, t) => Math.max(m, t.sort_order), 0) + 10;

// ---- GeoJSON -----------------------------------------------------------------------

const isPos = (p: unknown): p is Position =>
  Array.isArray(p) && p.length >= 2 && typeof p[0] === "number" && typeof p[1] === "number" && Number.isFinite(p[0]) && Number.isFinite(p[1]);
const isRing = (r: unknown): r is Position[] => Array.isArray(r) && r.length >= 4 && r.every(isPos);

/** A Polygon / MultiPolygon with well-formed rings, or null. Extra coordinate dims are dropped. */
export function normalizeGeometry(g: unknown): ZoneGeometry | null {
  if (!g || typeof g !== "object") return null;
  const geo = g as { type?: unknown; coordinates?: unknown };
  const trim = (r: Position[]): Position[] => r.map((p) => [p[0], p[1]] as Position);
  if (geo.type === "Polygon") {
    const rings = geo.coordinates;
    if (!Array.isArray(rings) || !rings.length || !rings.every(isRing)) return null;
    return { type: "Polygon", coordinates: (rings as Position[][]).map(trim) };
  }
  if (geo.type === "MultiPolygon") {
    const polys = geo.coordinates;
    if (!Array.isArray(polys) || !polys.length) return null;
    const out: Position[][][] = [];
    for (const poly of polys) {
      if (!Array.isArray(poly) || !poly.length || !poly.every(isRing)) return null;
      out.push((poly as Position[][]).map(trim));
    }
    return { type: "MultiPolygon", coordinates: out };
  }
  return null;
}

export type ParseError = "json" | "shape" | "empty" | "too_many" | "geometry";
export type ParseResult = { ok: true; collection: GeoFeatureCollection } | { ok: false; error: ParseError };

/**
 * Reads an import file: a FeatureCollection, a single Feature or a bare Polygon /
 * MultiPolygon. Every feature must be a polygon (the server import is all-or-nothing).
 */
export function parseGeoJson(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "json" };
  }
  if (!raw || typeof raw !== "object") return { ok: false, error: "shape" };
  const obj = raw as { type?: unknown; features?: unknown; geometry?: unknown; properties?: unknown };
  let features: unknown[];
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) features = obj.features;
  else if (obj.type === "Feature") features = [obj];
  else if (obj.type === "Polygon" || obj.type === "MultiPolygon") features = [{ type: "Feature", properties: {}, geometry: obj }];
  else return { ok: false, error: "shape" };
  if (!features.length) return { ok: false, error: "empty" };
  if (features.length > MAX_IMPORT_FEATURES) return { ok: false, error: "too_many" };
  const out: GeoFeature[] = [];
  for (const f of features) {
    const feat = f as { geometry?: unknown; properties?: unknown } | null;
    const geometry = normalizeGeometry(feat?.geometry);
    if (!geometry) return { ok: false, error: "geometry" };
    const props = feat?.properties && typeof feat.properties === "object" ? (feat.properties as Record<string, unknown>) : {};
    out.push({ type: "Feature", properties: props, geometry });
  }
  return { ok: true, collection: { type: "FeatureCollection", features: out } };
}

/** The zones as a FeatureCollection (what "Export" downloads and "Import" accepts back). */
export function exportZones(zones: Zone[]): GeoFeatureCollection {
  return {
    type: "FeatureCollection",
    features: liveZones(zones).map((z) => ({
      type: "Feature",
      properties: { name: z.name, tier: z.tier, priority: z.priority, note: z.note, wilaya_code: z.wilaya_code },
      geometry: z.geometry,
    })),
  };
}

/** Outer rings of a zone as Leaflet `[lat, lng]` lists (one per polygon), holes included. */
export function geometryToLatLngs(g: ZoneGeometry): [number, number][][][] {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.map((rings) => rings.map((r) => r.map((p) => [p[1], p[0]] as [number, number])));
}

/** A Leaflet layer's GeoJSON feature geometry, narrowed to a valid zone geometry (or null). */
export const layerGeometry = (feature: unknown): ZoneGeometry | null =>
  normalizeGeometry((feature as { geometry?: unknown } | null)?.geometry);

/** "12.4 km²" style area; sub-1 areas keep a decimal. */
export const formatArea = (km2: number) => (km2 >= 100 ? String(Math.round(km2)) : String(Number(km2.toFixed(km2 >= 10 ? 1 : 2))));
