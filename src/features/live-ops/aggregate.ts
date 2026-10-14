// Pure live-ops logic: plain rows + `now` in, plain data out (no I/O, no React).
import type {
  AttentionItem,
  ChatRow,
  FeedEvent,
  OrderRow,
  RiderRow,
  Severity,
  StoreRow,
  TxRow,
} from "./types";

export const ACTIVE_STATUSES = [
  "processing",
  "searching",
  "heading_to_store",
  "preparation",
  "pickup",
  "on_the_way",
] as const;

export const THRESHOLDS = {
  searchingWarnMin: 5,
  searchingDangerMin: 15,
  storePendingMin: 10,
  notPickedUpMin: 30,
  onTheWayMin: 60,
  chatWaitingMin: 10,
  scheduledDueMin: 15,
  riderFreshMin: 15,
  feedWindowH: 24,
  feedMax: 40,
} as const;

const MIN = 60_000;

export const isActive = (status: string) => (ACTIVE_STATUSES as readonly string[]).includes(status);

/** Whole minutes between an ISO timestamp and `now` (never negative). */
export function minutesSince(iso: string | null | undefined, now: Date): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now.getTime() - t) / MIN));
}

/** First 8 chars of a uuid, uppercase, prefixed with #. */
export const shortId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

/** An online rider is available and reported a location within the last 15 min. */
export function isRiderOnline(r: RiderRow, now: Date): boolean {
  if (!r.is_available || !r.location_updated_at) return false;
  const age = now.getTime() - new Date(r.location_updated_at).getTime();
  return age >= -MIN && age <= THRESHOLDS.riderFreshMin * MIN;
}

/** Splits online riders into idle / busy (busy = assigned to an active order). */
export function classifyRiders(riders: RiderRow[], orders: OrderRow[], now: Date) {
  const busyIds = new Set(orders.filter((o) => isActive(o.status) && o.rider_id).map((o) => o.rider_id as string));
  const online = riders.filter((r) => isRiderOnline(r, now));
  const busy = online.filter((r) => busyIds.has(r.user_id));
  return { online, busy, busyIds };
}

/** Algiers (UTC+1, no DST) midnight of the day containing `now`, as ISO. */
export function algiersMidnightISO(now: Date): string {
  const DAY = 86_400_000;
  const shifted = now.getTime() + 3_600_000;
  return new Date(Math.floor(shifted / DAY) * DAY - 3_600_000).toISOString();
}

function sevOrder(s: Severity) {
  return s === "danger" ? 0 : 1;
}

/** "Needs attention" rules. Sorted by severity, then oldest first. */
export function buildAttention(orders: OrderRow[], chats: ChatRow[], now: Date): AttentionItem[] {
  const T = THRESHOLDS;
  const out: AttentionItem[] = [];
  const orderHref = "/orders";
  const lbl = (o: OrderRow) => o.store_name ?? "";

  for (const o of orders) {
    if (!isActive(o.status)) continue;
    const base = { id: o.id, label: lbl(o), href: orderHref };

    if (o.status === "searching") {
      const age = minutesSince(o.created_at, now);
      if (age > T.searchingWarnMin) {
        out.push({
          ...base,
          key: `searching:${o.id}`,
          rule: "searching",
          severity: age > T.searchingDangerMin ? "danger" : "warning",
          since: o.created_at,
        });
      }
    }
    if (o.type === "merchant" && (o.status === "processing" || o.merchant_status === "pending")) {
      if (minutesSince(o.created_at, now) > T.storePendingMin) {
        out.push({ ...base, key: `store_pending:${o.id}`, rule: "store_pending", severity: "warning", since: o.created_at });
      }
    }
    if (o.rider_assigned_at && !o.picked_up_at && o.status !== "on_the_way") {
      if (minutesSince(o.rider_assigned_at, now) > T.notPickedUpMin) {
        out.push({ ...base, key: `not_picked_up:${o.id}`, rule: "not_picked_up", severity: "warning", since: o.rider_assigned_at });
      }
    }
    if (o.status === "on_the_way") {
      const since = o.picked_up_at ?? o.created_at;
      if (minutesSince(since, now) > T.onTheWayMin) {
        out.push({ ...base, key: `on_the_way_long:${o.id}`, rule: "on_the_way_long", severity: "danger", since });
      }
    }
    if (o.scheduled_at && !o.rider_id) {
      const dueIn = Math.ceil((new Date(o.scheduled_at).getTime() - now.getTime()) / MIN);
      if (dueIn <= T.scheduledDueMin) {
        out.push({
          ...base,
          key: `scheduled_no_rider:${o.id}`,
          rule: "scheduled_no_rider",
          severity: dueIn <= 0 ? "danger" : "warning",
          since: o.scheduled_at,
          dueInMin: dueIn,
        });
      }
    }
  }

  for (const c of chats) {
    if (c.status === "waiting" && !c.assigned_agent_id) {
      if (minutesSince(c.last_message_at ?? c.created_at, now) > T.chatWaitingMin) {
        out.push({
          key: `chat_waiting:${c.id}`,
          rule: "chat_waiting",
          severity: "warning",
          id: c.id,
          label: c.subject ?? "",
          since: c.last_message_at ?? c.created_at,
          href: "/support/inbox",
        });
      }
    }
  }

  // Older `since` = longer wait. Scheduled items: soonest due first (since is the due time).
  return out.sort((a, b) => sevOrder(a.severity) - sevOrder(b.severity) || new Date(a.since).getTime() - new Date(b.since).getTime());
}

/** Event feed: last 24 h, newest first, max 40, built from row timestamps. */
export function buildFeed(
  orders: OrderRow[],
  txs: TxRow[],
  chats: ChatRow[],
  stores: StoreRow[],
  riders: RiderRow[],
  now: Date,
  names: Map<string, string> = new Map()
): FeedEvent[] {
  const cutoff = now.getTime() - THRESHOLDS.feedWindowH * 3_600_000;
  const inWin = (iso: string | null | undefined): iso is string => !!iso && new Date(iso).getTime() >= cutoff;
  const ev: FeedEvent[] = [];

  for (const o of orders) {
    const sid = shortId(o.id);
    const common = { entity: sid, store: o.store_name, amount: o.total, orderType: o.type };
    if (inWin(o.created_at)) ev.push({ key: `op:${o.id}`, kind: "order_placed", at: o.created_at, ...common });
    if (inWin(o.rider_assigned_at)) ev.push({ key: `ra:${o.id}`, kind: "rider_assigned", at: o.rider_assigned_at, ...common });
    if (inWin(o.picked_up_at)) ev.push({ key: `pu:${o.id}`, kind: "picked_up", at: o.picked_up_at, ...common });
    if (inWin(o.delivered_at)) {
      ev.push({
        key: `dl:${o.id}`,
        kind: "delivered",
        at: o.delivered_at,
        ...common,
        minutes: Math.max(0, Math.round((new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / MIN)),
      });
    }
    if (inWin(o.canceled_at)) {
      ev.push({
        key: `cx:${o.id}`,
        kind: o.status === "merchant_rejected" ? "store_rejected" : "canceled",
        at: o.canceled_at,
        ...common,
        by: o.canceled_by,
        reason: o.cancel_reason,
      });
    }
  }
  for (const t of txs) {
    if (t.status !== "completed" || !inWin(t.created_at)) continue;
    ev.push({
      key: `tx:${t.id}`,
      kind: t.type === "deposit" ? "cash_deposit" : "cash_withdrawal",
      at: t.created_at,
      entity: "",
      amount: t.total,
    });
  }
  for (const c of chats) {
    if (inWin(c.created_at)) ev.push({ key: `ch:${c.id}`, kind: "chat_opened", at: c.created_at, entity: c.subject ?? "" });
  }
  for (const s of stores) {
    if (inWin(s.created_at)) ev.push({ key: `st:${s.id}`, kind: "store_new", at: s.created_at, entity: s.name ?? "", store: s.city });
  }
  for (const r of riders) {
    if (inWin(r.created_at)) {
      ev.push({ key: `rd:${r.user_id}`, kind: "rider_new", at: r.created_at, entity: names.get(r.user_id) ?? shortId(r.user_id), store: r.vehicle_type });
    }
  }

  return ev.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, THRESHOLDS.feedMax);
}

export interface CashSummary {
  count: number;
  amount: number;
}

/** Completed Blink Cash transactions since `sinceISO`. */
export function summarizeCash(txs: TxRow[], sinceISO: string): CashSummary {
  const since = new Date(sinceISO).getTime();
  let count = 0;
  let amount = 0;
  for (const t of txs) {
    if (t.status === "completed" && new Date(t.created_at).getTime() >= since) {
      count += 1;
      amount += Number(t.total ?? 0);
    }
  }
  return { count, amount };
}
