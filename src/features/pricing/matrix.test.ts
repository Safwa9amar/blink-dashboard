import { describe, expect, it } from "vitest";
import { buildTierMatrix, findTierOverride, matrixRows } from "./matrix";
import type { Fee, Override, Tier } from "./types";

const fee = (key: string, scopes: Partial<Fee["scopes"]>, value: unknown): Fee =>
  ({
    key,
    group: "customer",
    scopes: { service: null, wilaya: true, merchant: false, agent: false, zone: true, tier: true, ...scopes },
    value,
    seed: value,
    fields: [],
    updated_at: null,
    updated_by: null,
    active_overrides: 0,
  }) as unknown as Fee;

const tier = (code: string, sort_order: number, archived_at: string | null = null): Tier => ({
  code,
  names: { en: code, fr: code, ar: code },
  color: "#000000",
  sort_order,
  note: null,
  archived_at,
  zone_count: 0,
  override_count: 0,
  updated_at: "x",
});

const ov = (p: Partial<Override>): Override =>
  ({
    id: "o1",
    key: "service_fee",
    service: null,
    wilaya_code: null,
    merchant_id: null,
    agent_id: null,
    zone_id: null,
    tier: "rural",
    value: { amount: 5 },
    starts_at: null,
    ends_at: null,
    note: null,
    status: "active",
    partner_name: null,
    created_by: null,
    created_at: "x",
    updated_at: "x",
    ...p,
  }) as Override;

const fees = [
  fee("service_fee", {}, { amount: 10 }),
  fee("fare_multiplier", { service: ["courier", "ride"] }, { multiplier: 1 }),
  fee("courier_fare", { service: ["courier"] }, { extra_stop_fee: 1 }),
  fee("stamp_duty_rate", { tier: false }, { rate: 0.01 }),
];
const tiers = [tier("rural", 30), tier("urban", 10), tier("gone", 5, "2026-01-01")];

describe("matrixRows", () => {
  it("keeps tier-scopable fees and splits multi-service fees per service", () => {
    expect(matrixRows(fees).map((r) => r.id)).toEqual(["service_fee", "fare_multiplier:courier", "fare_multiplier:ride", "courier_fare"]);
    expect(matrixRows(fees).find((r) => r.id === "courier_fare")?.service).toBeNull();
  });
});

describe("findTierOverride", () => {
  it("only matches active, undated, tier-only overrides", () => {
    expect(findTierOverride([ov({})], "service_fee", "rural", null)?.id).toBe("o1");
    expect(findTierOverride([ov({ starts_at: "2026-11-01T00:00:00Z" })], "service_fee", "rural", null)).toBeNull();
    expect(findTierOverride([ov({ ends_at: "2026-11-01T00:00:00Z" })], "service_fee", "rural", null)).toBeNull();
    expect(findTierOverride([ov({ wilaya_code: "16" })], "service_fee", "rural", null)).toBeNull();
    expect(findTierOverride([ov({ merchant_id: "m" })], "service_fee", "rural", null)).toBeNull();
    expect(findTierOverride([ov({ zone_id: "z" })], "service_fee", "rural", null)).toBeNull();
    expect(findTierOverride([ov({ status: "archived" })], "service_fee", "rural", null)).toBeNull();
    expect(findTierOverride([ov({})], "service_fee", "urban", null)).toBeNull();
    expect(findTierOverride([ov({ service: "courier" })], "service_fee", "rural", null)).toBeNull();
  });
});

describe("buildTierMatrix", () => {
  it("has one live column per tier, ordered, and shows override vs inherited", () => {
    const m = buildTierMatrix(fees, [ov({})], tiers);
    expect(m.tiers.map((t) => t.code)).toEqual(["urban", "rural"]);
    const row = m.rows[0];
    expect(row.cells[0]).toMatchObject({ kind: "inherited", value: { amount: 10 }, override: null });
    expect(row.cells[1]).toMatchObject({ kind: "override", value: { amount: 5 } });
    expect(row.cells[1].override?.id).toBe("o1");
  });
  it("a whole-tier override feeds the per-service rows until a service one exists", () => {
    const wide = ov({ id: "w", key: "fare_multiplier", value: { multiplier: 1.2 } });
    const m = buildTierMatrix(fees, [wide], tiers);
    const courier = m.rows.find((r) => r.id === "fare_multiplier:courier")!;
    expect(courier.cells[1]).toMatchObject({ kind: "inherited", fromTierWide: true, value: { multiplier: 1.2 } });
    const exact = ov({ id: "c", key: "fare_multiplier", service: "courier", value: { multiplier: 1.5 } });
    const m2 = buildTierMatrix(fees, [wide, exact], tiers);
    expect(m2.rows.find((r) => r.id === "fare_multiplier:courier")!.cells[1]).toMatchObject({ kind: "override", value: { multiplier: 1.5 } });
    expect(m2.rows.find((r) => r.id === "fare_multiplier:ride")!.cells[1].fromTierWide).toBe(true);
  });
});
