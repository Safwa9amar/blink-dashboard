"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationsRead, refreshInbox } from "@/lib/shell/actions";
import type { InboxItem, InboxSnapshot } from "@/lib/shell/inbox-types";
import { useAttentionRefresh } from "./attention-provider";

interface InboxContextValue {
  items: InboxItem[];
  unread: number;
  /** The last fetch failed (the feed shows what it had). */
  failed: boolean;
  /** Connected to the live staff topic. */
  live: boolean;
  /** Something new just arrived (the bell rings for a few seconds). */
  fresh: boolean;
  /** Increments after every refresh that changed the feed; /inbox refetches on it. */
  version: number;
  refresh: () => Promise<void>;
  markRead: (ids: string[]) => void;
  markAllRead: () => void;
}

const InboxContext = createContext<InboxContextValue | null>(null);

const TOPIC = "staff:notifications";
const EVENT = "staff_notification";
/** Burst window: a bulk import fires many events; one refetch covers them. */
const DEBOUNCE_MS = 800;
/** Fallback polling while the live connection is down. */
const POLL_MS = 60_000;
const FRESH_MS = 4_000;

const head = (s: InboxSnapshot) => (s.items[0] ? `${s.items[0].id}@${s.items[0].at}` : "");

// The staff inbox behind the top-bar bell and /inbox. Seeded by the server layout;
// blink-server triggers announce every new / folded notification on the private
// `staff:notifications` topic and this refetches (role-filtered, server-side). If
// the socket is down it polls every 60s, and it always refreshes when the tab
// becomes visible again. Each live event also refreshes the attention badges.
export function InboxProvider({ initial, children }: { initial: InboxSnapshot; children: React.ReactNode }) {
  const refreshAttention = useAttentionRefresh();
  const [snap, setSnap] = useState<InboxSnapshot>(initial);
  const [failed, setFailed] = useState(!!initial.error);
  const [live, setLive] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [version, setVersion] = useState(0);
  // The latest snapshot for callbacks (kept in step by `commit`, not during render).
  const snapRef = useRef(snap);
  const commit = useCallback((next: InboxSnapshot) => {
    snapRef.current = next;
    setSnap(next);
  }, []);
  const freshTimer = useRef<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    let next: InboxSnapshot;
    try {
      next = await refreshInbox();
    } catch {
      setFailed(true);
      return;
    }
    if (next.error) {
      setFailed(true);
      return;
    }
    setFailed(false);
    const prev = snapRef.current;
    if (head(next) === head(prev) && next.unread === prev.unread && next.items.length === prev.items.length) return;
    if (next.unread > prev.unread && head(next) !== head(prev)) {
      setFresh(true);
      window.clearTimeout(freshTimer.current);
      freshTimer.current = window.setTimeout(() => setFresh(false), FRESH_MS);
    }
    commit(next);
    setVersion((v) => v + 1);
  }, [commit]);

  // Live: one debounced refetch per burst of events.
  const pending = useRef<number | undefined>(undefined);
  const onEvent = useCallback(() => {
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => {
      void refresh();
      void refreshAttention();
    }, DEBOUNCE_MS);
  }, [refresh, refreshAttention]);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let disposed = false;
    // Private channels authorize with the user's JWT (realtime.messages policy:
    // staff only), so the token must be set before joining.
    supabase.realtime
      .setAuth()
      .catch(() => {})
      .then(() => {
        if (disposed) return;
        channel = supabase
          .channel(TOPIC, { config: { private: true } })
          .on("broadcast", { event: EVENT }, onEvent)
          .subscribe((status) => {
            const up = status === "SUBSCRIBED";
            setLive(up);
            // Catch up on anything missed while (re)connecting.
            if (up) void refresh();
          });
      });
    return () => {
      disposed = true;
      window.clearTimeout(pending.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [onEvent, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = live
      ? undefined
      : window.setInterval(() => {
          if (document.visibilityState === "visible") void refresh();
        }, POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (id) window.clearInterval(id);
    };
  }, [live, refresh]);

  useEffect(() => () => window.clearTimeout(freshTimer.current), []);

  // Callers pass UNREAD ids only: ids outside the bell's window (rows further down
  // /inbox) are counted as unread when lowering the total.
  const markRead = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      if (set.size === 0) return;
      const prev = snapRef.current;
      const inBell = prev.items.filter((i) => set.has(i.id));
      const dropped = inBell.filter((i) => i.unread).length + (set.size - inBell.length);
      commit({
        ...prev,
        items: prev.items.map((i) => (set.has(i.id) ? { ...i, unread: false } : i)),
        unread: Math.max(0, prev.unread - dropped),
      });
      void markNotificationsRead([...set]).then((r) => {
        if (!r.ok) void refresh();
      });
    },
    [commit, refresh]
  );

  const markAllRead = useCallback(() => {
    const prev = snapRef.current;
    commit({ ...prev, items: prev.items.map((i) => ({ ...i, unread: false })), unread: 0 });
    void markAllNotificationsRead().then((r) => {
      if (!r.ok) void refresh();
    });
  }, [commit, refresh]);

  const value = useMemo<InboxContextValue>(
    () => ({ items: snap.items, unread: snap.unread, failed, live, fresh, version, refresh, markRead, markAllRead }),
    [snap, failed, live, fresh, version, refresh, markRead, markAllRead]
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxContextValue {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside <InboxProvider>");
  return ctx;
}
