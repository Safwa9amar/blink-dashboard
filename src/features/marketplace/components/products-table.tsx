"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  SearchBox,
  DataTable,
  FilterPills,
  DashIcon,
  fInput,
  type Column,
} from "@/components/ui";
import { PRODUCT_STATUS, PRODUCT_STATUS_KEYS, type Product, type ProductStatus, type TFn } from "../data";
import { useMarketplaceStore } from "../store";
import { StoreCell } from "./store-cell";
import { ProductForm } from "./product-form";

export function ProductsTable({ t }: { t: TFn }) {
  const products = useMarketplaceStore((s) => s.products);
  const stores = useMarketplaceStore((s) => s.stores);
  const deleteProduct = useMarketplaceStore((s) => s.deleteProduct);

  const [q, setQ] = useState("");
  const [sf, setSf] = useState<ProductStatus | "all">("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const newProduct = () => {
    setEditing(null);
    setOpen(true);
  };
  const editProduct = (p: Product) => {
    setEditing(p);
    setOpen(true);
  };

  const filterOptions: [string, string][] = [
    ["all", t("all")],
    ...PRODUCT_STATUS_KEYS.map((k) => [k, t("product_status." + k)] as [string, string]),
  ];

  const columns: Column<Product>[] = [
    {
      key: "title",
      label: t("col.product"),
      render: (r) => <StoreCell name={r.title} sub={r.unit} />,
    },
    {
      key: "storeId",
      label: t("col.store"),
      render: (r) => <Badge>{stores.find((s) => s.id === r.storeId)?.name ?? "—"}</Badge>,
    },
    { key: "menuCategory", label: t("col.section") },
    {
      key: "price",
      label: t("col.price"),
      render: (r) => `${r.price} Da`,
      tdClass: "tabular-nums",
    },
    {
      key: "rating",
      label: t("col.rating"),
      render: (r) => (r.rating ? `★ ${r.rating}` : "—"),
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={PRODUCT_STATUS[r.status]}>{t("product_status." + r.status)}</Badge>,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => editProduct(r)}
            aria-label={t("edit")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="pencil" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(t("confirm.delete_product"))) deleteProduct(r.id);
            }}
            aria-label={t("delete")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
          >
            <DashIcon name="trash" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const rows = products
    .filter((p) => (sf === "all" ? true : p.status === sf))
    .filter((p) => (storeFilter === "all" ? true : p.storeId === storeFilter))
    .filter((p) => (q ? p.title.toLowerCase().includes(q.toLowerCase()) : true));

  const filtered = sf !== "all" || storeFilter !== "all" || q !== "";

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search_products")} value={q} onChange={setQ} />
        <select
          className={fInput + " max-w-48"}
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
        >
          <option value="all">{t("all_stores")}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button icon="plus" className="ms-auto" onClick={newProduct}>
          {t("new_product")}
        </Button>
      </div>
      <FilterPills options={filterOptions} value={sf} onChange={(v) => setSf(v as ProductStatus | "all")} />
      <DataTable
        columns={columns}
        data={rows}
        empty={t(filtered ? "empty.products_filtered" : "empty.products")}
      />
      <ProductForm t={t} open={open} product={editing} onClose={() => setOpen(false)} />
    </>
  );
}
