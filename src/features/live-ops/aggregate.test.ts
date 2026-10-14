import { describe, expect, it } from "vitest";
import {
  algiersMidnightISO,
  buildAttention,
  buildFeed,
  classifyRiders,
  isRiderOnline,
  minutesSince,
  shortId,
  summarizeCash,
} from "./aggregate";
import type { ChatRow, OrderRow, RiderRow, TxRow } from "./types";

const now = new Date("2026-10-14T12:00:00Z");
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();

const order = (o: Partial<OrderRow>): OrderRow => ({
  id: "aaaaaaaa-0000-0000-0000-000000000000",
  type: "shopper",
  status: "searching",
  merchant_status: null,
  created_at: ago(1),
  rider_assigned_at: null,
  picked_up_at: null,
  delivered_at: null,
  canceled_at: null,
  canceled_by: null,
  cancel_reason: null,
  store_name: "S",
  rider_id: null,
  total: 1000,
  scheduled_at: null,
  pickup_lat: null,
  pickup_lng: null,
  destination_lat: null,
  destination_lng: null,
  pickup_address: null,
  ...o,
});

const rider = (r: Partial<RiderRow>): RiderRow => ({
  user_id: "r1",
  is_available: true,
  latitude: 36,
  longitude: 3,
  location_updated_at: ago(2),
  vehicle_type: "motorcycle",
  created_at: ago(9999),
  ...r,
});

describe("helpers", () => {
  it("minutesSince / shortId", () => {
    expect(minutesSince(ago(7), now)).toBe(7);
    expect(minutesSince(null, now)).toBe(0);
    expect(shortId("abcdef12-3456")).toBe("#ABCDEF12");
  });
  it("algiers midnight", () => {
    // 12:00Z = 13:00 Algiers -> midnight Algiers = 23:00Z previous day
    expect(algiersMidnightISO(now)).toBe("2026-10-13T23:00:00.000Z");
    expect(algiersMidnightISO(new Date("2026-10-14T23:30:00Z"))).toBe("2026-10-14T23:00:00.000Z");
  });
});

describe("riders", () => {
  it("online needs availability and a fresh location", () => {
    expect(isRiderOnline(rider({}), now)).toBe(true);
    expect(isRiderOnline(rider({ is_available: false }), now)).toBe(false);
    expect(isRiderOnline(rider({ location_updated_at: ago(16) }), now)).toBe(false);
    expect(isRiderOnline(rider({ location_updated_at: null }), now)).toBe(false);
  });
  it("busy = online rider on an active order", () => {
    const r = [rider({ user_id: "a" }), rider({ user_id: "b" }), rider({ user_id: "c", is_available: false })];
    const o = [order({ status: "on_the_way", rider_id: "a" }), order({ status: "delivered", rider_id: "b" }), order({ status: "pickup", rider_id: "c" })];
    const { online, busy } = classifyRiders(r, o, now);
    expect(online.map((x) => x.user_id)).toEqual(["a", "b"]);
    expect(busy.map((x) => x.user_id)).toEqual(["a"]);
  });
});

describe("attention", () => {
  it("searching thresholds", () => {
    const items = buildAttention(
      [order({ id: "1", created_at: ago(4) }), order({ id: "2", created_at: ago(6) }), order({ id: "3", created_at: ago(16) })],
      [],
      now
    );
    expect(items.map((i) => [i.id, i.severity])).toEqual([
      ["3", "danger"],
      ["2", "warning"],
    ]);
  });
  it("store pending, not picked up, on the way", () => {
    const items = buildAttention(
      [
        order({ id: "m", type: "merchant", status: "processing", created_at: ago(11) }),
        order({ id: "p", status: "heading_to_store", rider_id: "r", rider_assigned_at: ago(31), created_at: ago(40) }),
        order({ id: "w", status: "on_the_way", picked_up_at: ago(61), rider_id: "r", rider_assigned_at: ago(70) }),
        order({ id: "ok", status: "on_the_way", picked_up_at: ago(20), rider_id: "r", rider_assigned_at: ago(30) }),
      ],
      [],
      now
    );
    expect(items.map((i) => i.rule).sort()).toEqual(["not_picked_up", "on_the_way_long", "store_pending"]);
    expect(items[0].rule).toBe("on_the_way_long"); // danger first
  });
  it("ignores finished orders", () => {
    expect(buildAttention([order({ status: "delivered", created_at: ago(90) })], [], now)).toEqual([]);
  });
  it("chat waiting without agent", () => {
    const c = (p: Partial<ChatRow>): ChatRow => ({
      id: "c",
      status: "waiting",
      assigned_agent_id: null,
      unread_for_staff: 1,
      subject: "Help",
      created_at: ago(30),
      last_message_at: ago(12),
      ...p,
    });
    expect(buildAttention([], [c({})], now)).toHaveLength(1);
    expect(buildAttention([], [c({ last_message_at: ago(5) })], now)).toHaveLength(0);
    expect(buildAttention([], [c({ assigned_agent_id: "x" })], now)).toHaveLength(0);
  });
  it("scheduled order due soon without rider", () => {
    const items = buildAttention(
      [
        order({ id: "s1", status: "processing", scheduled_at: new Date(now.getTime() + 10 * 60_000).toISOString(), created_at: ago(120) }),
        order({ id: "s2", status: "processing", scheduled_at: new Date(now.getTime() + 60 * 60_000).toISOString(), created_at: ago(120) }),
      ],
      [],
      now
    );
    expect(items.filter((i) => i.rule === "scheduled_no_rider").map((i) => i.id)).toEqual(["s1"]);
  });
});

describe("feed", () => {
  it("is newest first, windowed to 24h and capped", () => {
    const orders = [
      order({ id: "a", created_at: ago(30), rider_assigned_at: ago(20), delivered_at: ago(5), status: "delivered" }),
      order({ id: "old", created_at: ago(60 * 30), status: "delivered" }),
      order({ id: "r", status: "merchant_rejected", created_at: ago(50), canceled_at: ago(49) }),
    ];
    const txs: TxRow[] = [
      { id: "t1", type: "deposit", status: "completed", total: 500, created_at: ago(2) },
      { id: "t2", type: "deposit", status: "pending", total: 500, created_at: ago(1) },
    ];
    const feed = buildFeed(orders, txs, [], [], [], now);
    expect(feed.map((e) => e.key)).toEqual(["tx:t1", "dl:a", "ra:a", "op:a", "cx:r", "op:r"].sort((x, y) => feed.findIndex((e) => e.key === x) - feed.findIndex((e) => e.key === y)));
    expect(feed[0].kind).toBe("cash_deposit");
    expect(feed.find((e) => e.key === "dl:a")?.minutes).toBe(25);
    expect(feed.find((e) => e.key === "cx:r")?.kind).toBe("store_rejected");
    expect(feed.some((e) => e.key.endsWith(":old"))).toBe(false);
    const many = Array.from({ length: 60 }, (_, i) => order({ id: `x${i}`, created_at: ago(i + 1) }));
    expect(buildFeed(many, [], [], [], [], now)).toHaveLength(40);
  });
});

describe("cash", () => {
  it("sums completed since midnight", () => {
    const txs: TxRow[] = [
      { id: "1", type: "deposit", status: "completed", total: 100, created_at: ago(5) },
      { id: "2", type: "withdrawal", status: "completed", total: 50, created_at: ago(5) },
      { id: "3", type: "deposit", status: "cancelled", total: 999, created_at: ago(5) },
      { id: "4", type: "deposit", status: "completed", total: 999, created_at: ago(60 * 20) },
    ];
    expect(summarizeCash(txs, algiersMidnightISO(now))).toEqual({ count: 2, amount: 150 });
  });
});
