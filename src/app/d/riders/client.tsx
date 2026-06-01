"use client";

import { useTranslations } from "next-intl";
import { PageHeader, SubNav, DataTable } from "@/components/ui";
import { buildDocRows } from "@/features/vehicles";
import { useVehiclesStore, useHydrateVehicles } from "@/features/vehicles/store";

interface RidersClientProps {
  riders: Record<string, unknown>[] | null;
  error?: string;
}

export default function RidersClient({ riders, error }: RidersClientProps) {
  const t = useTranslations("riders");
  const tv = useTranslations("vehicles");
  const tc = useTranslations("common");
  useHydrateVehicles();

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

  // Fleet & Documents are owned by the Vehicles route — these sub-nav entries
  // link out to it rather than duplicating the fleet views under /riders.
  const navItems = [
    { href: "/riders", label: t("title"), icon: "users", count: riders ? String(riders.length) : undefined },
    { href: "/vehicles", label: tv("fleet"), icon: "bike", count: String(vehicles.length) },
    {
      href: "/vehicles/documents",
      label: tv("documents"),
      icon: "shield",
      count: pendingDocs ? String(pendingDocs) : undefined,
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={navItems} />
      <DataTable columns={columns} data={riders} error={error} emptyMessage={t("empty")} />
    </div>
  );
}
