"use client";

import { useState } from "react";
import {
  Badge,
  SearchBox,
  FilterPills,
  DataTable,
  DashIcon,
  type Column,
} from "@/components/ui";
import {
  SEED_PACKS,
  PACK_STATUS,
  PACK_STATUS_KEYS,
  packFinalPrice,
  type Pack,
  type PackStatus,
  type TFn,
} from "../data";
import { PackDetailModal } from "./pack-detail-modal";

export function PacksTable({ t }: { t: TFn }) {
  const [packs, setPacks] = useState(SEED_PACKS);
  const [q, setQ] = useState("");
  const [sf, setSf] = useState<PackStatus | "all">("all");
  const [viewing, setViewing] = useState<Pack | null>(null);

  function handleStatusChange(id: string, status: Pack["status"]) {
    setPacks((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  const columns: Column<Pack>[] = [
    {
      key: "name",
      label: t("col.name"),
      render: (r) => (
        <div>
          <p className="font-medium text-text">{r.name}</p>
          <p className="text-xs text-subtext">{r.storeName}</p>
        </div>
      ),
    },
    {
      key: "items",
      label: t("col.items"),
      render: (r) => <span className="tabular-nums">{r.items.length} {t("items_label")}</span>,
    },
    {
      key: "discountPercent",
      label: t("col.discount"),
      render: (r) => r.discountPercent > 0 ? <Badge variant="info">{r.discountPercent}%</Badge> : <span className="text-subtext">—</span>,
    },
    {
      key: "freeDelivery",
      label: t("col.delivery"),
      render: (r) => r.freeDelivery ? <Badge variant="success">{t("free")}</Badge> : <span className="text-subtext">{t("standard")}</span>,
    },
    {
      key: "price",
      label: t("col.price"),
      render: (r) => <span className="tabular-nums font-medium">{packFinalPrice(r)} Da</span>,
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={PACK_STATUS[r.status]}>{t("status." + r.status)}</Badge>,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <button
          type="button"
          onClick={() => setViewing(r)}
          aria-label={t("view")}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:bg-card-hover transition-colors cursor-pointer"
        >
          <DashIcon name="eye" className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const rows = packs
    .filter((p) => (sf === "all" ? true : p.status === sf))
    .filter((p) =>
      q ? p.name.toLowerCase().includes(q.toLowerCase()) || p.storeName.toLowerCase().includes(q.toLowerCase()) : true
    );

  const filterOptions: [PackStatus | "all", string][] = [
    ["all", t("all")],
    ...PACK_STATUS_KEYS.map((k) => [k, t("status." + k)] as [PackStatus, string]),
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
      </div>
      <FilterPills options={filterOptions} value={sf} onChange={setSf} />
      <DataTable columns={columns} data={rows} empty={t(q || sf !== "all" ? "empty.filtered" : "empty.none")} />
      <PackDetailModal
        t={t}
        pack={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
