"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  SearchBox,
  FilterPills,
  DataTable,
  DashIcon,
  type Column,
} from "@/components/ui";
import { STORE_STATUS, STORE_STATUS_KEYS, type Store, type StoreStatus, type TFn } from "../data";
import { useMarketplaceStore } from "../store";
import { StoreCell } from "./store-cell";
import { StoreForm } from "./store-form";

export function StoresTable({ t }: { t: TFn }) {
  const stores = useMarketplaceStore((s) => s.stores);
  const categories = useMarketplaceStore((s) => s.categories);
  const deleteStore = useMarketplaceStore((s) => s.deleteStore);

  const [q, setQ] = useState("");
  const [sf, setSf] = useState<StoreStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const columns: Column<Store>[] = [
    {
      key: "name",
      label: t("col.store"),
      render: (r) => <StoreCell name={r.name} sub={r.location} />,
    },
    {
      key: "categoryId",
      label: t("col.category"),
      render: (r) => <Badge>{categories.find((c) => c.id === r.categoryId)?.name ?? t("uncategorized")}</Badge>,
    },
    { key: "wilaya", label: t("col.wilaya") },
    {
      key: "rating",
      label: t("col.rating"),
      render: (r) => (
        <span>
          ★ {r.rating} <span className="text-subtext">({r.reviewCount})</span>
        </span>
      ),
    },
    { key: "productCount", label: t("col.products"), tdClass: "tabular-nums" },
    {
      key: "deliveryFee",
      label: t("col.delivery_fee"),
      render: (r) => (r.deliveryFee ? `${r.deliveryFee} Da` : t("free")),
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={STORE_STATUS[r.status]}>{t("store_status." + r.status)}</Badge>,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(r);
              setOpen(true);
            }}
            aria-label={t("edit")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="pencil" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(t("confirm.delete_store"))) deleteStore(r.id);
            }}
            aria-label={t("delete")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="trash" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const rows = stores
    .filter((s) => (sf === "all" ? true : s.status === sf))
    .filter((s) => (q ? s.name.toLowerCase().includes(q.toLowerCase()) : true));

  const filterOptions: [StoreStatus | "all", string][] = [
    ["all", t("all")],
    ...STORE_STATUS_KEYS.map((k) => [k, t("store_status." + k)] as [StoreStatus, string]),
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search_stores")} value={q} onChange={setQ} />
        <Button
          icon="plus"
          className="ms-auto"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          {t("new_store")}
        </Button>
      </div>
      <FilterPills options={filterOptions} value={sf} onChange={setSf} />
      <DataTable
        columns={columns}
        data={rows}
        empty={t(q || sf !== "all" ? "empty.stores_filtered" : "empty.stores")}
      />
      <StoreForm t={t} open={open} store={editing} onClose={() => setOpen(false)} />
    </>
  );
}
