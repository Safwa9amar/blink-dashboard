import { describe, expect, it } from "vitest";
import { exposureOf, hasCashFlow, parseCashDays, summarizeAgentDues, summarizeBlinkCash } from "./report";

const summaryFixture = {
  window_days: 7,
  generated_at: "2026-10-15T10:00:00Z",
  circulation: { total: "8400000", available: 8000000, pending_withdrawals: 400000, wallets: 41 },
  deposits: { count: 3, amount: 90000 },
  withdrawals: { count: 2, amount: 40000 },
  fees: { total: 1500, platform: 900, tax: 100, agents_net: 500 },
  pending: { count: 1, amount: 5000 },
  agent_cash: { owed_to_blink: 120000, credit: 3000, agents_owing: 4, agents: 9 },
  daily: [
    { date: "2026-10-14", deposits: 50000, withdrawals: 0, deposits_count: 2, withdrawals_count: 0 },
    { date: "2026-10-15", deposits: 40000, withdrawals: 40000, deposits_count: 1, withdrawals_count: 2 },
  ],
};

describe("summarizeBlinkCash", () => {
  it("maps the server shape and coerces numeric strings", () => {
    const s = summarizeBlinkCash(summaryFixture);
    expect(s.circulation).toEqual({ total: 8400000, available: 8000000, pendingWithdrawals: 400000, wallets: 41 });
    expect(s.fees.agentsNet).toBe(500);
    expect(s.agentCash.owedToBlink).toBe(120000);
    expect(s.daily).toHaveLength(2);
    expect(hasCashFlow(s)).toBe(true);
  });
  it("detects an all-zero window", () => {
    const s = summarizeBlinkCash({
      ...summaryFixture,
      daily: [{ date: "2026-10-15", deposits: 0, withdrawals: 0, deposits_count: 0, withdrawals_count: 0 }],
    });
    expect(hasCashFlow(s)).toBe(false);
  });
  it("throws on an unexpected payload", () => {
    expect(() => summarizeBlinkCash(null)).toThrow();
    expect(() => summarizeBlinkCash({ error: "x" })).toThrow();
  });
});

describe("parseCashDays", () => {
  it("accepts 7/30/90 and defaults to 30", () => {
    expect(parseCashDays("7")).toBe(7);
    expect(parseCashDays(["90"])).toBe(90);
    expect(parseCashDays("15")).toBe(30);
    expect(parseCashDays(undefined)).toBe(30);
  });
});

describe("exposureOf", () => {
  it("uses the 20k / 50k thresholds", () => {
    expect(exposureOf(50000)).toBe("high");
    expect(exposureOf(49999)).toBe("medium");
    expect(exposureOf(20000)).toBe("medium");
    expect(exposureOf(19999)).toBe("low");
    expect(exposureOf(0)).toBe("none");
  });
});

const agent = (over: Record<string, unknown>) => ({
  agent_id: "a1",
  name: "Karim",
  phone: "+213555",
  shops_total: 2,
  shops_open: 1,
  primary_shop: { id: "s1", name: "Kiosque", address: "Rouiba", lat: "36.7", lng: 3.2 },
  deposits: { count: 4, amount: 80000 },
  withdrawals: { count: 1, amount: 10000 },
  operations_30d: 5,
  fee_income_net: 700,
  total_dues: 60000,
  credit: 0,
  last_operation_at: "2026-10-14T09:00:00Z",
  last_payment_at: null,
  rating_avg: 4.5,
  ratings_count: 2,
  ...over,
});

describe("summarizeAgentDues", () => {
  it("flattens agents, derives exposure and totals", () => {
    const s = summarizeAgentDues({
      agents: [
        agent({ agent_id: "a2", name: null, total_dues: -2500, credit: 2500, primary_shop: null, rating_avg: null }),
        agent({}),
        agent({ agent_id: "a3", total_dues: 25000 }),
      ],
      payments: [
        { id: "p1", agent_id: "a1", agent_name: "Karim", amount: 100, fees: 0, method: "cash", status: "completed", created_at: "2026-10-01T00:00:00Z" },
        { id: "p2", agent_id: "a1", agent_name: "Karim", amount: 200, fees: 5, method: "cash", status: "completed", created_at: "2026-10-10T00:00:00Z" },
      ],
    });
    expect(s.agents.map((a) => a.id)).toEqual(["a1", "a3", "a2"]);
    expect(s.agents[0]).toMatchObject({ exposure: "high", lat: 36.7, lng: 3.2, shopName: "Kiosque", owed: 60000 });
    expect(s.agents[1].exposure).toBe("medium");
    expect(s.agents[2]).toMatchObject({ name: "—", owed: 0, credit: 2500, lat: null, rating: null, exposure: "none" });
    expect(s.totalOwed).toBe(85000);
    expect(s.totalCredit).toBe(2500);
    expect(s.agentsOwing).toBe(2);
    expect(s.operations30).toBe(15);
    expect(s.payments.map((p) => p.id)).toEqual(["p2", "p1"]);
  });
  it("throws on an unexpected payload", () => {
    expect(() => summarizeAgentDues({})).toThrow();
  });
});
