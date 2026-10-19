"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AttentionCounts } from "@/lib/nav/modules";
import { refreshAttention } from "@/lib/shell/actions";

const AttentionContext = createContext<AttentionCounts>({});
const AttentionRefreshContext = createContext<() => Promise<void>>(async () => {});

const REFRESH_MS = 60_000;

// Holds the "needs attention" counts. Seeded by the server layout, then refreshed every
// 60s through the `refreshAttention` server action while the tab is visible, and on
// demand (the inbox calls `useAttentionRefresh()` when a live event arrives). A failed
// refresh keeps the previous counts.
export function AttentionProvider({ initial, children }: { initial: AttentionCounts; children: React.ReactNode }) {
  const [counts, setCounts] = useState<AttentionCounts>(initial);

  const refresh = useCallback(async () => {
    try {
      setCounts(await refreshAttention());
    } catch {
      /* keep the last known counts */
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const id = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  return (
    <AttentionRefreshContext.Provider value={refresh}>
      <AttentionContext.Provider value={counts}>{children}</AttentionContext.Provider>
    </AttentionRefreshContext.Provider>
  );
}

export function useAttention(): AttentionCounts {
  return useContext(AttentionContext);
}

/** Re-fetches the attention counts now (e.g. when a live inbox event arrives). */
export function useAttentionRefresh(): () => Promise<void> {
  return useContext(AttentionRefreshContext);
}
