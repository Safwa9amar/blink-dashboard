"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, LivePill } from "@/components/ui";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  AttentionList,
  EventFeed,
  LiveKpis,
  LiveMap,
  SystemHealth,
  agoLabel,
  type LiveOpsSnapshot,
} from "@/features/live-ops";
import { refreshLiveOps } from "./action";

const POLL_MS = 15_000;

export default function LiveOpsClient({ initial }: { initial: LiveOpsSnapshot }) {
  const t = useTranslations("live_ops");
  const [snap, setSnap] = useState(initial);
  const [failed, setFailed] = useState(false);
  // null until mounted: relative times are only rendered client-side (no hydration mismatch).
  const [now, setNow] = useState<number | null>(null);
  const busy = useRef(false);
  // The map only re-fits on first load, so polling never moves the view.
  const fitKey = "initial";

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await refreshLiveOps();
      if ("snapshot" in r) {
        setSnap(r.snapshot);
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useDocumentTitle(t("title"), snap.kpis.activeOrders);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<LivePill>{`${t("live")} · ${t("updated", { ago: agoLabel(t, snap.generatedAt, now) })}`}</LivePill>}
      />
      {failed && (
        <p role="alert" className="mb-3 text-[12.5px] text-danger">
          {t("refresh_failed")}
        </p>
      )}
      <LiveKpis kpis={snap.kpis} now={now} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <div className="space-y-5 min-w-0">
          <LiveMap snapshot={snap} now={now} fitKey={fitKey} />
          <EventFeed feed={snap.feed} now={now} />
        </div>
        <div className="space-y-5 min-w-0">
          <AttentionList items={snap.attention} now={now} />
          <SystemHealth health={snap.health} now={now} />
        </div>
      </div>
    </div>
  );
}
