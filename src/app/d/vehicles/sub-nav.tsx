"use client";

import { useTranslations } from "next-intl";
import { SubNav } from "@/components/ui";
import { VehicleStats, buildDocRows } from "@/features/vehicles";
import { useVehiclesStore, useHydrateVehicles } from "@/features/vehicles/store";

export function VehicleSubNav() {
  const t = useTranslations("vehicles");
  useHydrateVehicles();
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const pendingDocs = buildDocRows(vehicles).filter((d) => d.status === "pending").length;

  const items = [
    { href: "/vehicles", label: t("fleet"), icon: "bike", count: String(vehicles.length) },
    {
      href: "/vehicles/documents",
      label: t("documents"),
      icon: "shield",
      count: pendingDocs ? String(pendingDocs) : undefined,
    },
  ];

  return (
    <>
      <VehicleStats t={t} />
      <SubNav items={items} />
    </>
  );
}
