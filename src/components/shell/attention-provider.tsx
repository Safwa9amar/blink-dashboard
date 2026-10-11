"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AttentionCounts } from "@/lib/nav/modules";
import { refreshAttention } from "@/lib/shell/actions";

const AttentionContext = createContext<AttentionCounts>({});

const REFRESH_MS = 60_000;

// Holds the "needs attention" counts. Seeded by the server layout, then refreshed every
// 60s through the `refreshAttention` server action while the tab is visible. A failed
// refresh keeps the previous counts.
export function AttentionProvider({ initial, children }: { initial: AttentionCounts; children: React.ReactNode }) {
  const [counts, setCounts] = useState<AttentionCounts>(initial);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await refreshAttention();
        if (!cancelled) setCounts(next);
      } catch {
        /* keep the last known counts */
      }
    };
    const id = window.setInterval(refresh, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <AttentionContext.Provider value={counts}>{children}</AttentionContext.Provider>;
}

export function useAttention(): AttentionCounts {
  return useContext(AttentionContext);
}
