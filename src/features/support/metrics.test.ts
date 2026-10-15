import { describe, expect, it } from "vitest";
import {
  DEFAULT_SLA_POLICIES,
  buildCases,
  complianceByPriority,
  containmentRate,
  conversationsPerDay,
  dayKey,
  firstResponseMinutes,
  formatMinutes,
  median,
  resolutionMinutes,
  slaMetRate,
  slaState,
  topSubjects,
  type MetricMessage,
} from "./metrics";

const T0 = "2026-10-10T10:00:00.000Z";
const at = (min: number) => new Date(new Date(T0).getTime() + min * 60000).toISOString();
const sys = (type: string, min: number, sender_id: string | null = null, extra = {}): MetricMessage => ({
  sender: "system",
  sender_id,
  meta: { type, ...extra },
  created_at: at(min),
});
const agent = (min: number): MetricMessage => ({ sender: "agent", sender_id: "s1", created_at: at(min) });
const user = (min: number): MetricMessage => ({ sender: "user", sender_id: "u1", created_at: at(min) });
const conv = { id: "c1", priority: "normal" as const };
const normal = DEFAULT_SLA_POLICIES.find((p) => p.priority === "normal")!;

describe("buildCases", () => {
  it("returns nothing for a bot-only conversation", () => {
    expect(buildCases([user(0)], conv)).toEqual([]);
  });

  it("builds a resolved case", () => {
    const [c] = buildCases(
      [user(0), sys("escalated", 1, null, { reason: "asked" }), sys("assigned", 3, "s1"), agent(5), sys("resolved", 30, "s2")],
      conv
    );
    expect(c.escalatedAt).toBe(at(1));
    expect(c.firstResponseAt).toBe(at(5));
    expect(c.resolvedAt).toBe(at(30));
    expect(c.assignedTo).toBe("s1");
    expect(c.resolvedBy).toBe("s2");
    expect(c.reason).toBe("asked");
    expect(firstResponseMinutes(c)).toBe(4);
    expect(resolutionMinutes(c)).toBe(29);
  });

  it("splits reopened conversations into several cases, sorting by time", () => {
    const cases = buildCases(
      [sys("resolved", 20, "s1"), sys("escalated", 0), agent(2), sys("escalated", 100), sys("assigned", 101, "s3")],
      conv
    );
    expect(cases).toHaveLength(2);
    expect(cases[0].resolvedAt).toBe(at(20));
    expect(cases[1].resolvedAt).toBeNull();
    expect(cases[1].assignedTo).toBe("s3");
    expect(firstResponseMinutes(cases[1])).toBeNull();
  });

  it("ignores a repeated escalation while open and agent messages before one", () => {
    const cases = buildCases([agent(0), sys("escalated", 1), sys("escalated", 2), agent(3)], conv);
    expect(cases).toHaveLength(1);
    expect(cases[0].escalatedAt).toBe(at(1));
    expect(cases[0].firstResponseAt).toBe(at(3));
  });
});

describe("slaState", () => {
  const open = (min = 0) => buildCases([sys("escalated", min)], conv)[0];
  const now = (min: number) => new Date(at(min));

  it("is ok with plenty of time", () => {
    expect(slaState(open(), normal, now(10))).toEqual({ state: "ok", kind: "first_response", minutes: 50 });
  });
  it("is due soon below 25% left", () => {
    const s = slaState(open(), normal, now(50));
    expect(s.state).toBe("due_soon");
    expect(s.minutes).toBe(10);
  });
  it("breaches an unanswered case after the first-response target", () => {
    const s = slaState(open(), normal, now(75));
    expect(s).toEqual({ state: "breached", kind: "first_response", minutes: -15 });
  });
  it("tracks resolution once answered", () => {
    const c = buildCases([sys("escalated", 0), agent(5)], conv)[0];
    expect(slaState(c, normal, now(60)).kind).toBe("resolution");
    expect(slaState(c, normal, now(1500)).state).toBe("breached");
  });
  it("judges resolved cases against both targets", () => {
    const fast = buildCases([sys("escalated", 0), agent(5), sys("resolved", 60)], conv)[0];
    expect(slaState(fast, normal, now(99999)).state).toBe("ok");
    const slow = buildCases([sys("escalated", 0), agent(90), sys("resolved", 100)], conv)[0];
    expect(slaState(slow, normal, now(99999)).kind).toBe("first_response");
  });
});

describe("aggregations", () => {
  it("median", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 10])).toBe(2.5);
  });
  it("containmentRate", () => {
    expect(containmentRate([])).toBeNull();
    expect(containmentRate([0, 0, 1, 2])).toBe(0.5);
  });
  it("dayKey uses Africa/Algiers", () => {
    expect(dayKey("2026-10-10T23:30:00Z")).toBe("2026-10-11");
  });
  it("conversationsPerDay buckets and ignores out-of-range days", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    const r = conversationsPerDay(
      [
        { created_at: "2026-10-10T08:00:00Z", escalated: false },
        { created_at: "2026-10-10T09:00:00Z", escalated: true },
        { created_at: "2026-10-09T09:00:00Z", escalated: true },
        { created_at: "2026-08-01T09:00:00Z", escalated: true },
      ],
      3,
      now
    );
    expect(r.map((b) => b.day)).toEqual(["2026-10-08", "2026-10-09", "2026-10-10"]);
    expect(r[2]).toMatchObject({ bot: 1, escalated: 1 });
    expect(r[1]).toMatchObject({ bot: 0, escalated: 1 });
  });
  it("topSubjects groups case-insensitively", () => {
    expect(topSubjects(["Refund", " refund ", "Late order", null, "REFUND"], 2)).toEqual([
      { subject: "Refund", count: 3 },
      { subject: "Late order", count: 1 },
    ]);
  });
  it("compliance and met rate", () => {
    const cases = [
      buildCases([sys("escalated", 0), agent(5), sys("resolved", 60)], conv)[0],
      buildCases([sys("escalated", 0), agent(200), sys("resolved", 300)], conv)[0],
    ];
    const n = complianceByPriority(cases, DEFAULT_SLA_POLICIES, new Date(at(999))).find((r) => r.priority === "normal")!;
    expect(n).toMatchObject({ total: 2, firstTotal: 2, firstMet: 1, resTotal: 2, resMet: 2 });
    expect(slaMetRate(cases, DEFAULT_SLA_POLICIES, new Date(at(999)))).toBe(0.5);
    expect(slaMetRate([], DEFAULT_SLA_POLICIES)).toBeNull();
  });
  it("formatMinutes", () => {
    const u = { m: "min", h: "h", d: "d" };
    expect(formatMinutes(45, u)).toBe("45 min");
    expect(formatMinutes(60, u)).toBe("1 h");
    expect(formatMinutes(1440, u)).toBe("24 h");
    expect(formatMinutes(4320, u)).toBe("3 d");
    expect(formatMinutes(-126_900, u)).toBe("88 d");
  });
});
