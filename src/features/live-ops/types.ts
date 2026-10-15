// Domain types for the live-ops feature. Everything in LiveOpsSnapshot is plain JSON
// (ISO strings, no Dates) so it can cross the server -> client boundary.

/** Raw rows as read from the DB (only the columns we use). */
export interface OrderRow {
  id: string;
  type: string;
  status: string;
  merchant_status: string | null;
  created_at: string;
  rider_assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
  cancel_reason: string | null;
  store_name: string | null;
  rider_id: string | null;
  total: number | null;
  scheduled_at: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  pickup_address: string | null;
}

export interface RiderRow {
  user_id: string;
  is_available: boolean | null;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  vehicle_type: string | null;
  created_at: string;
}

export interface ChatRow {
  id: string;
  status: string;
  assigned_agent_id: string | null;
  unread_for_staff: number | null;
  subject: string | null;
  created_at: string;
  last_message_at: string | null;
}

export interface TxRow {
  id: string;
  type: string;
  status: string;
  total: number | null;
  created_at: string;
}

export interface StoreRow {
  id: string;
  name: string | null;
  city: string | null;
  created_at: string;
}

export type Severity = "danger" | "warning";

export type AttentionRule =
  | "searching"
  | "store_pending"
  | "not_picked_up"
  | "on_the_way_long"
  | "chat_waiting"
  | "scheduled_no_rider";

export interface AttentionItem {
  key: string;
  rule: AttentionRule;
  severity: Severity;
  /** Order / chat id (full uuid). */
  id: string;
  /** Store name (orders) or chat subject (chats). */
  label: string;
  /** ISO: when the condition started, age is computed from it on the client. */
  since: string;
  /** For scheduled orders: minutes until due (negative = overdue). */
  dueInMin?: number;
  href: string;
}

export type FeedKind =
  | "order_placed"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "canceled"
  | "store_rejected"
  | "cash_deposit"
  | "cash_withdrawal"
  | "chat_opened"
  | "store_new"
  | "rider_new";

export interface FeedEvent {
  key: string;
  kind: FeedKind;
  at: string;
  /** Entity shown in bold (short order id, store name, chat subject, amount). */
  entity: string;
  /** Meta line pieces. */
  store?: string | null;
  amount?: number | null;
  minutes?: number | null;
  by?: string | null;
  reason?: string | null;
  orderType?: string | null;
}

export interface MapRider {
  id: string;
  name: string;
  vehicle: string | null;
  lastSeen: string;
  busy: boolean;
  lat: number;
  lng: number;
}

export interface MapOrder {
  id: string;
  store: string | null;
  status: string;
  type: string;
  createdAt: string;
  lat: number;
  lng: number;
  dest: [number, number] | null;
}

export interface MapAgent {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Kpis {
  activeOrders: number;
  searching: number;
  oldestSearchingSince: string | null;
  ridersOnline: number;
  ridersBusy: number;
  chatsOpen: number;
  chatsUnread: number;
  cashCount: number;
  cashAmount: number;
}

export interface ApiHealth {
  /** From GET /health: up, slow (> 2 s), no_reply (8 s timeout, usually a sleeping Render instance) or down. */
  state: "up" | "slow" | "no_reply" | "down";
  /** Response time in ms, null when the request failed. */
  ms: number | null;
}

export interface Health {
  primary: ApiHealth;
  spare: ApiHealth;
  dbMs: number | null;
  lastOrderAt: string | null;
}

export interface LiveOpsSnapshot {
  generatedAt: string;
  kpis: Kpis;
  attention: AttentionItem[];
  riders: MapRider[];
  orders: MapOrder[];
  agents: MapAgent[];
  feed: FeedEvent[];
  health: Health;
}
