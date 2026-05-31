"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, DataTable } from "@/components/ui";
import { VehicleStats, FleetTable, DocReviewTable } from "@/features/vehicles";
import { useVehiclesStore, useHydrateVehicles } from "@/features/vehicles/store";
import { buildDocRows } from "@/features/vehicles/data";

interface RidersClientProps {
  riders: Record<string, unknown>[] | null;
  error?: string;
}

export default function RidersClient({ riders, error }: RidersClientProps) {
  const t = useTranslations("riders");
  const tv = useTranslations("vehicles");
  const tc = useTranslations("common");
  useHydrateVehicles();

  const [tab, setTab] = useState("riders");
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const pendingDocs = buildDocRows(vehicles).filter((d) => d.status === "pending").length;

  const columns = [
    {
      key: "rider_id",
      label: t("rider_id"),
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-primary font-medium">{row.rider_id as string}</span>
      ),
    },
    {
      key: "name",
      label: t("name"),
      render: (row: Record<string, unknown>) => {
        const user = row.users as { first_name: string | null; last_name: string | null } | null;
        return (
          <span className="font-medium text-text">
            {user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "—"}
          </span>
        );
      },
    },
    {
      key: "phone",
      label: t("phone"),
      render: (row: Record<string, unknown>) => {
        const user = row.users as { phone_number: string } | null;
        return user?.phone_number ?? "—";
      },
    },
    {
      key: "wilaya",
      label: t("wilaya"),
      render: (row: Record<string, unknown>) => (row.wilaya as string) ?? "—",
    },
    {
      key: "vehicle_type",
      label: t("vehicle"),
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{(row.vehicle_type as string) ?? "—"}</span>
      ),
    },
    {
      key: "created_at",
      label: tc("created"),
      render: (row: Record<string, unknown>) => (
        <span className="text-subtext">
          {new Date(row.created_at as string).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const tabs = [
    { id: "riders", label: t("title"), icon: "users", count: riders ? String(riders.length) : undefined },
    { id: "fleet", label: tv("fleet"), icon: "bike", count: String(vehicles.length) },
    {
      id: "documents",
      label: tv("documents"),
      icon: "shield",
      count: pendingDocs ? String(pendingDocs) : undefined,
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "riders" && (
        <DataTable columns={columns} data={riders} error={error} emptyMessage={t("empty")} />
      )}
      {tab === "fleet" && (
        <>
          <VehicleStats t={tv} />
          <FleetTable t={tv} />
        </>
      )}
      {tab === "documents" && (
        <>
          <VehicleStats t={tv} />
          <DocReviewTable t={tv} />
        </>
      )}
    </div>
  );
}
