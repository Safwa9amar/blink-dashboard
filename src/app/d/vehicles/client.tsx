"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs } from "@/components/ui";
import { VehicleStats, FleetTable, DocReviewTable } from "@/features/vehicles";
import { useVehiclesStore, useHydrateVehicles } from "@/features/vehicles/store";
import { buildDocRows } from "@/features/vehicles/data";

export default function VehiclesClient() {
  const t = useTranslations("vehicles");
  useHydrateVehicles();

  const [tab, setTab] = useState("fleet");
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const pendingDocs = buildDocRows(vehicles).filter((d) => d.status === "pending").length;

  const tabs = [
    { id: "fleet", label: t("fleet"), icon: "bike", count: String(vehicles.length) },
    {
      id: "documents",
      label: t("documents"),
      icon: "shield",
      count: pendingDocs ? String(pendingDocs) : undefined,
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <VehicleStats t={t} />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "fleet" && <FleetTable t={t} />}
      {tab === "documents" && <DocReviewTable t={t} />}
    </div>
  );
}
