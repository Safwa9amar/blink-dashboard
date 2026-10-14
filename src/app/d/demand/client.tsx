"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, LivePill, Segmented } from "@/components/ui";
import {
  DEMAND_RANGES,
  DemandStats,
  DemandHoursChart,
  ServiceMixChart,
  DemandHeatmap,
  TopAreas,
  TopStores,
  DemandMap,
  type DemandRange,
  type DemandSnapshot,
} from "@/features/demand";
import { useDocumentTitle } from "@/lib/use-document-title";
import { refreshDemand } from "./action";

const POLL_MS = 60_000;

export default function DemandClient({ initial }: { initial: DemandSnapshot }) {
  const t = useTranslations("demand");
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<"analytics" | "map">("analytics");
  const [pending, startTransition] = useTransition();
  // A polled snapshot only counts while it belongs to the server snapshot being shown
  // (a range change brings a new `initial`, which supersedes it).
  const [fresh, setFresh] = useState<{ base: DemandSnapshot; snap: DemandSnapshot } | null>(null);
  const snap = fresh && fresh.base === initial ? fresh.snap : initial;
  const [ago, setAgo] = useState<number | null>(null);

  useDocumentTitle(t("title"), snap.kpis.orders);

  useEffect(() => {
    const tick = () => setAgo(Math.max(0, Math.round((Date.now() - new Date(snap.generatedAt).getTime()) / 1000)));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [snap.generatedAt]);

  useEffect(() => {
    let alive = true;
    const id = setInterval(async () => {
      if (document.hidden) return;
      const next = await refreshDemand(initial.range).catch(() => null);
      if (alive && next && !next.error) setFresh({ base: initial, snap: next });
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [initial]);

  const setRange = (r: DemandRange) => {
    startTransition(() => router.replace(`${pathname}?range=${r}`, { scroll: false }));
  };

  return (
    <div className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<DemandRange>
              options={DEMAND_RANGES.map((r) => [r, t(`ranges.${r}`)] as [DemandRange, string])}
              value={snap.range}
              onChange={setRange}
            />
            <Segmented
              options={[
                ["analytics", t("analytics")],
                ["map", t("map.title")],
              ]}
              value={view}
              onChange={setView}
            />
            <LivePill>{ago == null ? t("live") : t("updated_ago", { sec: ago })}</LivePill>
          </div>
        }
      />

      {snap.error && <p className="text-danger text-sm mb-3">{t("error", { message: snap.error })}</p>}
      {snap.truncated && <p className="text-warning text-xs mb-3">{t("truncated")}</p>}

      <DemandStats kpis={snap.kpis} />

      {view === "map" ? (
        <DemandMap snap={snap} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mb-5">
            <DemandHoursChart hours={snap.hours} total={snap.kpis.orders} />
            <ServiceMixChart mix={snap.mix} total={snap.kpis.orders} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <DemandHeatmap heat={snap.heat} total={snap.kpis.orders} />
            <TopStores stores={snap.stores} />
          </div>
          <TopAreas areas={snap.areas} />
        </>
      )}
    </div>
  );
}
