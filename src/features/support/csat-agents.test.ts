import { describe, expect, it } from "vitest";
import { agentRows, csatStats, isOnline, type ResolverCase } from "./csat-agents";

const NOW = Date.parse("2026-10-15T12:00:00Z");
const iso = (minAgo: number) => new Date(NOW - minAgo * 60000).toISOString();

const kase = (o: Partial<ResolverCase>): ResolverCase => ({
  conversationId: "c1",
  priority: "normal",
  escalatedAt: iso(120),
  firstResponseAt: iso(110),
  resolvedAt: iso(60),
  assignedTo: "s1",
  resolvedBy: "s1",
  reason: null,
  resolvedByName: "Sara",
  ...o,
});
const conv = (o: object) => ({
  id: "c1",
  user_role: "customer",
  csat_rating: null,
  csat_comment: null,
  csat_at: null,
  ownerName: "Lina",
  ...o,
});

describe("csatStats", () => {
  it("is empty without ratings", () => {
    const s = csatStats([conv({})], [kase({})], NOW);
    expect(s.rated).toBe(0);
    expect(s.avg).toBeNull();
    expect(s.responseRate).toBe(0);
    expect(s.latest).toEqual([]);
  });
  it("computes avg, dist, weeks, rate and latest", () => {
    const convs = [
      conv({ id: "c1", csat_rating: 5, csat_comment: " great ", csat_at: iso(30) }),
      conv({ id: "c2", csat_rating: 3, csat_at: iso(60 * 24 * 8) }),
      conv({ id: "c3" }),
    ];
    const cases = [kase({ conversationId: "c1" }), kase({ conversationId: "c2" }), kase({ conversationId: "c3" })];
    const s = csatStats(convs, cases, NOW);
    expect(s.avg).toBe(4);
    expect(s.dist).toEqual([0, 0, 1, 0, 1]);
    expect(s.weeks).toHaveLength(6);
    expect(s.weeks[5]).toMatchObject({ avg: 5, count: 1 });
    expect(s.weeks[4]).toMatchObject({ avg: 3, count: 1 });
    expect(s.responseRate).toBeCloseTo(2 / 3);
    expect(s.latest[0]).toMatchObject({ conversationId: "c1", comment: "great", agent: "Sara" });
  });
  it("null response rate with no resolved cases", () => {
    expect(csatStats([], [], NOW).responseRate).toBeNull();
  });
});

describe("agents", () => {
  it("online window", () => {
    expect(isOnline(iso(10), NOW)).toBe(true);
    expect(isOnline(iso(20), NOW)).toBe(false);
    expect(isOnline(null, NOW)).toBe(false);
  });
  it("aggregates per staff", () => {
    const rows = agentRows(
      [
        { id: "s1", name: "Sara", staff_role: "support_admin" },
        { id: "s2", name: "Omar", staff_role: "super_admin" },
      ],
      [
        { id: "c1", status: "resolved", assigned_agent_id: "s1", csat_rating: 4 },
        { id: "c2", status: "assigned", assigned_agent_id: "s1", csat_rating: null },
      ],
      [kase({}), kase({ conversationId: "c3", resolvedAt: iso(60 * 24 * 10), firstResponseAt: iso(120 - 30) })],
      { s1: iso(5) },
      NOW
    );
    const s1 = rows.find((r) => r.id === "s1")!;
    expect(s1).toMatchObject({ openAssigned: 1, resolved7: 1, resolved30: 2, csatAvg: 4, csatCount: 1, lastActiveAt: iso(5) });
    expect(s1.medianFirstResponse).toBe(20);
    expect(rows.find((r) => r.id === "s2")).toMatchObject({ resolved30: 0, csatAvg: null, medianFirstResponse: null });
    expect(rows[0].id).toBe("s1");
  });
});
