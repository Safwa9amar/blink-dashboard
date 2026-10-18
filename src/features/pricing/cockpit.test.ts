import { describe, expect, it } from "vitest";
import {
  addDays,
  calendarLayout,
  endOfDayIso,
  endingSoon,
  filterByStatus,
  fromInputDate,
  overviewKpis,
  statusCounts,
  summaryParts,
  toInputDate,
} from "./cockpit";
import type { Override } from "./types";

const NOW = new Date("2026-10-18T10:00:00+01:00");

function ov(p: Partial<Override>): Override {
  return {
    id: p.id ?? "x",
    key: "service_fee",
    service: null,
    wilaya_code: null,
    merchant_id: null,
    agent_id: null,
    value: { amount: 1 } as never,
    starts_at: null,
    ends_at: null,
    note: null,
    status: "active",
    partner_name: null,
    created_by: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...p,
  };
}

describe("dates", () => {
  it("round-trips Algiers input dates", () => {
    const iso = fromInputDate("2026-11-01T00:00")!;
    expect(iso).toBe("2026-10-31T23:00:00.000Z");
    expect(toInputDate(iso)).toBe("2026-11-01T00:00");
    expect(endOfDayIso("2026-10-21")).toBe("2026-10-21T22:59:00.000Z");
    expect(addDays("2026-10-21T22:59:00.000Z", 7)).toBe("2026-10-28T22:59:00.000Z");
  });
});

describe("endingSoon", () => {
  it("keeps active overrides ending within the window, soonest first, with Algiers day counts", () => {
    const list = [
      ov({ id: "later", ends_at: "2026-10-24T22:00:00Z" }),
      ov({ id: "soon", ends_at: "2026-10-21T22:59:00Z" }),
      ov({ id: "far", ends_at: "2026-11-30T00:00:00Z" }),
      ov({ id: "past", ends_at: "2026-10-17T00:00:00Z" }),
      ov({ id: "noend" }),
      ov({ id: "sched", status: "scheduled", ends_at: "2026-10-20T00:00:00Z" }),
    ];
    const r = endingSoon(list, NOW, 7);
    expect(r.map((e) => e.override.id)).toEqual(["soon", "later"]);
    expect(r[0].daysLeft).toBe(3);
    expect(r[1].daysLeft).toBe(6);
  });
  it("counts the day in Algiers time, not UTC", () => {
    // 2026-10-18T23:30Z is already 19 Oct 00:30 in Algiers.
    const r = endingSoon([ov({ ends_at: "2026-10-18T23:30:00Z" })], NOW);
    expect(r[0].daysLeft).toBe(1);
  });
});

describe("overviewKpis / statusCounts", () => {
  const list = [
    ov({ id: "a", wilaya_code: "16", ends_at: "2026-10-20T00:00:00Z" }),
    ov({ id: "b", wilaya_code: "16", merchant_id: "m1" }),
    ov({ id: "c", wilaya_code: "31", merchant_id: "m1" }),
    ov({ id: "d", agent_id: "a1" }),
    ov({ id: "e", status: "scheduled", merchant_id: "m2" }),
    ov({ id: "f", status: "ended" }),
    ov({ id: "g", status: "archived" }),
  ];
  it("computes tiles from active overrides", () => {
    expect(overviewKpis(list, NOW)).toEqual({
      active: 4,
      wilayas: 2,
      partnerDeals: 3,
      merchants: 1,
      agents: 1,
      endingSoon: 1,
    });
  });
  it("counts each status and the derived ending-soon", () => {
    expect(statusCounts(list, NOW)).toEqual({ all: 7, active: 4, scheduled: 1, ending_soon: 1, ended: 1, archived: 1 });
    expect(filterByStatus(list, "ending_soon", NOW).map((o) => o.id)).toEqual(["a"]);
    expect(filterByStatus(list, "ended", NOW).map((o) => o.id)).toEqual(["f"]);
    expect(filterByStatus(list, "all", NOW)).toHaveLength(7);
  });
});

describe("calendarLayout", () => {
  it("lays out bars, months and the today line", () => {
    const list = [
      ov({ id: "a", starts_at: "2026-10-01T00:00:00+01:00", ends_at: "2026-12-31T00:00:00+01:00" }),
      ov({ id: "open", status: "scheduled", starts_at: "2026-11-15T00:00:00+01:00" }),
      ov({ id: "noStart", status: "ended", ends_at: "2026-10-05T00:00:00+01:00" }),
    ];
    const l = calendarLayout(list, NOW);
    expect(l.months[0].key).toBe("2026-10");
    expect(l.months.at(-1)!.key).toBe("2026-12");
    expect(l.months.reduce((s, m) => s + m.widthPct, 0)).toBeCloseTo(100, 5);
    expect(l.todayPct).toBeGreaterThan(0);
    expect(l.todayPct).toBeLessThan(100);
    const a = l.bars.find((b) => b.override.id === "a")!;
    expect(a.tone).toBe("active");
    expect(a.openEnd).toBe(false);
    expect(a.leftPct).toBeCloseTo(0, 5);
    const open = l.bars.find((b) => b.override.id === "open")!;
    expect(open.openEnd).toBe(true);
    expect(open.tone).toBe("scheduled");
    expect(open.leftPct + open.widthPct).toBeCloseTo(100, 5);
    const ns = l.bars.find((b) => b.override.id === "noStart")!;
    expect(ns.openStart).toBe(true);
    expect(ns.tone).toBe("ended");
  });
  it("falls back to today - 1 month .. today + 3 months with no dates", () => {
    const l = calendarLayout([ov({})], NOW);
    expect(l.months[0].key).toBe("2026-09");
    expect(l.months.at(-1)!.key).toBe("2027-01");
    expect(l.bars[0].openStart && l.bars[0].openEnd).toBe(true);
  });
});

describe("summaryParts", () => {
  const base = {
    fee: { key: "merchant_commission_rate" as const },
    before: "5%",
    after: "3%",
    now: NOW,
  };
  it("builds a partner window with revert and notification", () => {
    const p = summaryParts({
      ...base,
      scope: { partnerKind: "merchant", partnerName: "Chez Ali" },
      window: { starts_at: "2026-11-01T00:00:00+01:00", ends_at: "2026-12-31T00:00:00+01:00" },
    });
    expect(p.window).toBe("both");
    expect(p.reverts).toBe(true);
    expect(p.notify).toBe(true);
    expect(p.who.partner).toEqual({ kind: "merchant", name: "Chez Ali" });
  });
  it("treats a past start as none and non-partner scopes as silent", () => {
    const p = summaryParts({
      ...base,
      scope: { wilaya_code: "16" },
      window: { starts_at: "2026-10-01T00:00:00+01:00", ends_at: null },
    });
    expect(p.window).toBe("none");
    expect(p.from).toBeNull();
    expect(p.reverts).toBe(false);
    expect(p.notify).toBe(false);
    expect(p.who.wilaya).toBe("16");
  });
  it("supports from-only and until-only", () => {
    expect(
      summaryParts({ ...base, scope: {}, window: { starts_at: "2026-11-01T00:00:00+01:00", ends_at: null } }).window,
    ).toBe("from");
    expect(summaryParts({ ...base, scope: {}, window: { starts_at: null, ends_at: "2026-11-01T00:00:00+01:00" } }).window).toBe(
      "until",
    );
  });
});
