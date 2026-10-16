// Transaction lifecycle rules for the staff UI. Pure — the server stays the authority;
// this only decides which buttons to offer and how to lay out the timeline.

export type TxStatus = "pending" | "review" | "completed" | "cancelled" | "reversed";
export type TxAction = "cancel" | "approve" | "reject" | "reverse";

/** pending → cancel; review → approve / reject; completed → reverse; others none. */
export function txActions(status: string): TxAction[] {
  switch (status) {
    case "pending":
      return ["cancel"];
    case "review":
      return ["approve", "reject"];
    case "completed":
      return ["reverse"];
    default:
      return [];
  }
}

/** Actions that need a written reason (approve takes a reference instead). */
export const needsReason = (a: TxAction) => a !== "approve";

export interface TimelineSource {
  status: string;
  created_at: string;
  expires_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancel_reason?: string | null;
  reversed_at?: string | null;
  reversed_by?: string | null;
  reversal_reason?: string | null;
  reference?: string | null;
}
export interface TimelineEvent {
  key: "created" | "expires" | "reviewed" | "completed" | "cancelled" | "reversed";
  at: string;
  actorId?: string | null;
  note?: string | null;
}

/** Events in time order. `expires` shows only while a pending request still has a deadline. */
export function buildTimeline(tx: TimelineSource): TimelineEvent[] {
  const ev: TimelineEvent[] = [{ key: "created", at: tx.created_at }];
  if (tx.expires_at && tx.status === "pending") ev.push({ key: "expires", at: tx.expires_at });
  if (tx.reviewed_at) ev.push({ key: "reviewed", at: tx.reviewed_at, actorId: tx.reviewed_by, note: tx.reference });
  if (tx.completed_at) ev.push({ key: "completed", at: tx.completed_at });
  if (tx.cancelled_at)
    ev.push({ key: "cancelled", at: tx.cancelled_at, actorId: tx.cancelled_by, note: tx.cancel_reason });
  if (tx.reversed_at)
    ev.push({ key: "reversed", at: tx.reversed_at, actorId: tx.reversed_by, note: tx.reversal_reason });
  return ev.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
