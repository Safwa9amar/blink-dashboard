// Client-safe types shared by the inbox provider, the bell, the /inbox page and the
// server actions.
import type { InboxCategory } from "./inbox-kinds";

export type InboxSeverity = "info" | "warning" | "critical";

/** One row of the staff feed (a single event, or several folded into one). */
export interface InboxItem {
  id: string;
  kind: string;
  severity: InboxSeverity;
  entityId: string | null;
  /** Display params for the kind's copy (names, counts). Strings and numbers only. */
  params: Record<string, string | number>;
  /** English fallback line for a kind the dashboard doesn't know. */
  summary: string;
  /** Events folded into this row. */
  count: number;
  /** ISO time of the latest folded event. */
  at: string;
  unread: boolean;
}

/** The bell's view: the latest rows + the unread total. `error` when the feed failed. */
export interface InboxSnapshot {
  items: InboxItem[];
  unread: number;
  error?: string;
}

export interface InboxQuery {
  category?: InboxCategory;
  unreadOnly?: boolean;
  limit?: number;
  /** Keyset cursor: the last row already shown. */
  before?: { at: string; id: string };
}

export interface InboxPage {
  items: InboxItem[];
  /** True when more rows may follow (a full page came back). */
  more: boolean;
  error?: string;
}
