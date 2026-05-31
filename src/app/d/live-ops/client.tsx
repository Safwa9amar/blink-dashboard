"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, Card, LivePill } from "@/components/ui";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  EVENTS,
  EventFeed,
  type FeedItem,
  CountersPanel,
  type Kpi,
  SystemHealth,
} from "@/features/live-ops";

export default function LiveOpsClient() {
  const t = useTranslations("live_ops");
  const [feed, setFeed] = useState<FeedItem[]>(() => EVENTS.map((e, i) => ({ ...e, key: i, t: 2 + i * 3 })));
  const [kpi, setKpi] = useState<Kpi>({ active: 128, enroute: 86, online: 214, agents: 47 });
  const tick = useRef(0);
  const seq = useRef(1000);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      setFeed((f) => {
        const aged = f.map((e) => ({ ...e, t: e.t + 4 }));
        if (tick.current % 2 === 0) {
          const src = EVENTS[seq.current % EVENTS.length];
          seq.current += 1;
          return [{ ...src, key: seq.current, t: 1 }, ...aged].slice(0, 9);
        }
        return aged;
      });
      setKpi((k) => ({
        active: Math.max(90, k.active + ((tick.current * 7) % 14) - 7),
        enroute: Math.max(60, k.enroute + ((tick.current * 5) % 10) - 5),
        online: Math.max(180, k.online + ((tick.current * 3) % 8) - 4),
        agents: k.agents,
      }));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // live online-rider count reflected in the browser tab title
  useDocumentTitle(t("title"), kpi.online);

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} actions={<LivePill>{t("live")}</LivePill>} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card title={t("feed_title")} description={t("feed_desc")}>
          <EventFeed feed={feed} />
        </Card>

        <div className="space-y-4">
          <CountersPanel kpi={kpi} />
          <SystemHealth />
        </div>
      </div>
    </div>
  );
}
