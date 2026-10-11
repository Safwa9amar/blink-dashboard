"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, DashIcon, DataTable, NameCell, PageHeader, SearchBox, type Column } from "@/components/ui";
import { matchesRider, RiderDetail, VERIFICATION_VARIANT, type RiderRow } from "@/features/riders";

export default function RidersClient({ riders, error }: { riders: RiderRow[]; error?: string }) {
  const t = useTranslations("riders");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => riders.filter((r) => matchesRider(r, query)), [riders, query]);
  const selected = riders.find((r) => r.id === selectedId) ?? null;

  const columns: Column<RiderRow>[] = [
    {
      key: "name",
      label: t("rider"),
      render: (r) => (
        <button type="button" onClick={() => setSelectedId(r.id)} className="flex items-center gap-2.5 text-start cursor-pointer">
          <NameCell name={r.name || r.riderId} />
          <span className="font-mono text-xs text-primary">{r.riderId}</span>
        </button>
      ),
    },
    { key: "phone", label: t("phone"), render: (r) => <span dir="ltr">{r.phone ?? "—"}</span> },
    { key: "wilaya", label: t("wilaya"), render: (r) => r.wilaya ?? "—" },
    {
      key: "vehicleType",
      label: t("vehicle"),
      render: (r) =>
        r.vehicleType ? (
          <span className="flex items-center gap-2">
            <Badge variant={r.vehicleType === "motorcycle" ? "info" : "default"}>{t(`types.${r.vehicleType}`)}</Badge>
            <span className="text-subtext">
              {r.vehicle ? [r.vehicle.brand, r.vehicle.model].filter(Boolean).join(" ") || "—" : "—"}
              {" · "}
              {r.vehicleType === "bicycle" ? t("no_plate") : <span dir="ltr">{r.vehicle?.plate || "—"}</span>}
            </span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "verification",
      label: t("verification_status"),
      render: (r) => <Badge variant={VERIFICATION_VARIANT[r.verification]}>{t(`verification.${r.verification}`)}</Badge>,
    },
    {
      key: "available",
      label: t("available"),
      render: (r) => <Badge variant={r.available ? "success" : "default"}>{r.available ? t("yes") : t("no")}</Badge>,
    },
    {
      key: "joinedAt",
      label: t("joined"),
      render: (r) => <span className="text-subtext">{r.joinedAt ? new Date(r.joinedAt).toLocaleDateString(locale) : "—"}</span>,
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedId(r.id)}
          aria-label={t("view")}
          title={t("view")}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
        >
          <DashIcon name="eye" className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href="/riders/verification" className="text-[13px] font-semibold text-primary hover:underline">
            {t("detail.review")}
          </Link>
        }
      />
      <div className="mb-4">
        <SearchBox placeholder={t("search")} value={query} onChange={setQuery} />
      </div>
      <DataTable columns={columns} data={rows} error={error} emptyMessage={t("empty")} />
      <RiderDetail rider={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
