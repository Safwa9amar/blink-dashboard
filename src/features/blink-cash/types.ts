// Domain types for the blink-cash feature.

// A row of the real Supabase `transactions` table (deposits & withdrawals).
// Mirrors blink-server migration 00001 — the authoritative finance ledger.
export interface BlinkTransaction {
  id: string;
  type: "deposit" | "withdrawal";
  user_id: string;
  agent_id: string | null;
  rider_id: string | null;
  amount: number;
  fees: number;
  total: number;
  status: "completed" | "cancelled" | "pending";
  method: "electronic" | "agent" | null;
  offer_title: string | null;
  offer_detail: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
}

// Dues / agent-float are UI aggregates (no DB table) — the mobile app computes
// them client-side from the ledger. Kept here as presentational mock shapes.
export interface DueRow {
  who: string;
  role: string;
  dues: number;
  fees: number;
  due: string;
  status: string;
}

export type TFn = (k: string, v?: Record<string, string | number>) => string;
