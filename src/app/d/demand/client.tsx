"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, LivePill, Segmented } from "@/components/ui";
import {
  DemandStats,
  DemandSupplyChart,
  ServiceMixChart,
  DemandHeatmap,
  TopZones,
  DemandMap,
} from "@/features/demand";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function DemandClient() {
  const t = useTranslations("demand");
  useDocumentTitle(t("title"), 342); // live orders
  const [view, setView] = useState<"analytics" | "map">("analytics");
  const [zone, setZone] = useState("Bab Ezzouar");

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Segmented
              options={[
                ["analytics", t("analytics")],
                ["map", t("map.title")],
              ]}
              value={view}
              onChange={setView}
            />
            <LivePill>{t("live_ago", { sec: 12 })}</LivePill>
          </>
        }
      />

      <DemandStats t={t} />

      {view === "map" ? (
        <DemandMap selected={zone} onSelect={setZone} t={t} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mb-5">
            <DemandSupplyChart t={t} />
            <ServiceMixChart t={t} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DemandHeatmap t={t} />
            <TopZones t={t} />
          </div>
        </>
      )}
    </div>
  );
}
