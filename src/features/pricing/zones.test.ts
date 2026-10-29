import { describe, expect, it } from "vitest";
import { exportZones, formatArea, geometryToLatLngs, isHexColor, isTierCode, layerGeometry, liveTiers, nextTierOrder, normalizeGeometry, parseGeoJson, tierColor, tierName } from "./zones";
import type { Tier, Zone } from "./types";

const ring = [[3, 36], [3.1, 36], [3.1, 36.1], [3, 36]];
const poly = { type: "Polygon", coordinates: [ring] };

const tier = (p: Partial<Tier>): Tier => ({
  code: "urban",
  names: { en: "Urban", fr: "Urbain", ar: "حضري" },
  color: "#2563EB",
  sort_order: 10,
  note: null,
  archived_at: null,
  zone_count: 0,
  override_count: 0,
  updated_at: "2026-10-29T00:00:00Z",
  ...p,
});

const zone = (p: Partial<Zone>): Zone => ({
  id: "z1",
  name: "Oran centre",
  tier: "urban",
  wilaya_code: "31",
  geometry: poly as Zone["geometry"],
  priority: 0,
  note: null,
  area_km2: 12.4,
  override_count: 0,
  archived_at: null,
  created_at: "2026-10-29T00:00:00Z",
  updated_at: "2026-10-29T00:00:00Z",
  ...p,
});

describe("tiers", () => {
  const tiers = [tier({}), tier({ code: "rural", names: { en: "Rural", fr: "Rural", ar: "ريفي" }, color: "#D97706", sort_order: 30 }), tier({ code: "old", archived_at: "2026-10-01T00:00:00Z", sort_order: 5 })];
  it("names by locale with a code fallback", () => {
    expect(tierName(tiers, "urban", "ar")).toBe("حضري");
    expect(tierName(tiers, "urban", "fr")).toBe("Urbain");
    expect(tierName(tiers, "urban", "en")).toBe("Urban");
    expect(tierName(tiers, "ghost", "en")).toBe("ghost");
  });
  it("colors with a neutral fallback", () => {
    expect(tierColor(tiers, "rural")).toBe("#D97706");
    expect(tierColor(tiers, "ghost")).toMatch(/^#/);
  });
  it("lists live tiers in order and picks the next sort slot", () => {
    expect(liveTiers(tiers).map((t) => t.code)).toEqual(["urban", "rural"]);
    expect(nextTierOrder(tiers)).toBe(40);
  });
  it("validates codes and colors", () => {
    expect(isTierCode("suburban")).toBe(true);
    expect(isTierCode("Urban")).toBe(false);
    expect(isTierCode("1a")).toBe(false);
    expect(isTierCode("a")).toBe(false);
    expect(isHexColor("#2563EB")).toBe(true);
    expect(isHexColor("2563EB")).toBe(false);
  });
});

describe("parseGeoJson", () => {
  it("reads a FeatureCollection", () => {
    const r = parseGeoJson(JSON.stringify({ type: "FeatureCollection", features: [{ type: "Feature", properties: { name: "A" }, geometry: poly }] }));
    expect(r.ok && r.collection.features[0].properties.name).toBe("A");
  });
  it("wraps a single feature and a bare polygon", () => {
    expect(parseGeoJson(JSON.stringify({ type: "Feature", properties: null, geometry: poly })).ok).toBe(true);
    const bare = parseGeoJson(JSON.stringify(poly));
    expect(bare.ok && bare.collection.features).toHaveLength(1);
  });
  it("drops extra coordinate dimensions", () => {
    const g = normalizeGeometry({ type: "Polygon", coordinates: [ring.map((p) => [...p, 100])] });
    expect(g?.type === "Polygon" && g.coordinates[0][0]).toEqual([3, 36]);
  });
  it("rejects bad input with a reason", () => {
    expect(parseGeoJson("nope")).toEqual({ ok: false, error: "json" });
    expect(parseGeoJson("[1]")).toEqual({ ok: false, error: "shape" });
    expect(parseGeoJson(JSON.stringify({ type: "FeatureCollection", features: [] }))).toEqual({ ok: false, error: "empty" });
    const point = { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [3, 36] } };
    expect(parseGeoJson(JSON.stringify({ type: "FeatureCollection", features: [point] }))).toEqual({ ok: false, error: "geometry" });
    const short = { type: "Polygon", coordinates: [[[3, 36], [3.1, 36], [3, 36]]] };
    expect(parseGeoJson(JSON.stringify(short))).toEqual({ ok: false, error: "geometry" });
    const many = { type: "FeatureCollection", features: Array.from({ length: 201 }, () => ({ type: "Feature", properties: {}, geometry: poly })) };
    expect(parseGeoJson(JSON.stringify(many))).toEqual({ ok: false, error: "too_many" });
  });
});

describe("export / geometry helpers", () => {
  it("exports live zones only, with their properties", () => {
    const fc = exportZones([zone({}), zone({ id: "z2", archived_at: "2026-10-02T00:00:00Z" })]);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].properties).toMatchObject({ name: "Oran centre", tier: "urban", priority: 0 });
    // Round trip: what we export is importable.
    expect(parseGeoJson(JSON.stringify(fc)).ok).toBe(true);
  });
  it("flips [lng, lat] to Leaflet [lat, lng]", () => {
    expect(geometryToLatLngs(poly as Zone["geometry"])[0][0][0]).toEqual([36, 3]);
    const multi = { type: "MultiPolygon", coordinates: [poly.coordinates, poly.coordinates] } as Zone["geometry"];
    expect(geometryToLatLngs(multi)).toHaveLength(2);
  });
  it("narrows a layer feature to a zone geometry", () => {
    expect(layerGeometry({ type: "Feature", geometry: poly })?.type).toBe("Polygon");
    expect(layerGeometry({ type: "Feature", geometry: { type: "LineString", coordinates: [] } })).toBeNull();
    expect(layerGeometry(null)).toBeNull();
  });
  it("formats areas", () => {
    expect(formatArea(0.456)).toBe("0.46");
    expect(formatArea(12.44)).toBe("12.4");
    expect(formatArea(250.7)).toBe("251");
  });
});
