import type { AttentionKey } from "@/lib/nav/modules";

export type Block<T> = { data: T } | { error: string };

export interface OrdersKpi { count: number; value: number }
export interface RidersKpi { available: number; total: number }
export interface CashKpi { total: number; count: number }
export interface DayPoint { day: string; delivered: number; failed: number }
export interface Pipeline { searching: number; heading_to_store: number; preparation: number; pickup: number; on_the_way: number; deliveredToday: number }
export interface AttentionRow { key: AttentionKey; href: string; count: number }
export interface ActivityItem { kind: "order" | "transaction"; id: string; title: string; status: string; amount: number; at: string }

/** Every block is optional: absent = the role can't access it (omitted, not shown empty). */
export interface OverviewData {
  ordersToday?: Block<OrdersKpi>;
  riders?: Block<RidersKpi>;
  cash?: Block<CashKpi>;
  waiting?: Block<number>;
  chart?: Block<DayPoint[]>;
  pipeline?: Block<Pipeline>;
  attention?: Block<AttentionRow[]>;
  activity?: Block<ActivityItem[]>;
}
