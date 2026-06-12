"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Badge,
  Button,
  SearchBox,
  DataTable,
  FilterPills,
  DashIcon,
  fInput,
  btnPrimary,
  type Column,
} from "@/components/ui";
import {
  LIBRARY_STATUS,
  LIBRARY_STATUS_KEYS,
  pickLang,
  type LibraryCategory,
  type LibraryProduct,
  type LibraryStatus,
  type TFn,
} from "../data";
import { deleteLibraryProduct, deleteLibraryProducts } from "@/app/d/library/action";
import { ProductCell } from "./product-cell";
import { ImportMenu } from "./import-menu";

const checkboxClass = "w-4 h-4 rounded border-border accent-primary cursor-pointer align-middle";

export function ProductsTable({
  t,
  products,
  categories,
}: {
  t: TFn;
  products: LibraryProduct[];
  categories: LibraryCategory[];
}) {
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [sf, setSf] = useState<LibraryStatus | "all">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Products reference a category by its English name (name.en); resolve that key
  // to the active locale for display.
  const categoryLabel = (key: string) => {
    const c = categories.find((cat) => cat.name.en === key);
    return c ? pickLang(c.name, locale) : key;
  };

  const remove = (id: string) => {
    if (confirm(t("confirm.delete_product"))) startTransition(() => void deleteLibraryProduct(id));
  };

  const toggleOne = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const bulkDelete = () => {
    const ids = [...selected];
    if (!ids.length || !confirm(t("confirm.delete_products", { count: ids.length }))) return;
    startTransition(() => {
      void deleteLibraryProducts(ids).then((res) => {
        if (!res.error) setSelected(new Set());
      });
    });
  };

  const filterOptions: [string, string][] = [
    ["all", t("all")],
    ...LIBRARY_STATUS_KEYS.map((k) => [k, t("status." + k)] as [string, string]),
  ];

  const ql = q.toLowerCase();
  const rows = products
    .filter((p) => (sf === "all" ? true : p.status === sf))
    .filter((p) => (catFilter === "all" ? true : p.category === catFilter))
    .filter((p) =>
      q
        ? Object.values(p.name).some((v) => v.toLowerCase().includes(ql)) ||
          p.brand.toLowerCase().includes(ql) ||
          p.barcode.includes(q)
        : true
    );

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id));
  const toggleAll = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
      return next;
    });

  const columns: Column<LibraryProduct>[] = [
    {
      key: "select",
      label: "",
      sortable: false,
      className: "w-[1%]",
      header: (
        <input
          type="checkbox"
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          checked={allSelected}
          onChange={(e) => toggleAll(e.target.checked)}
          aria-label={t("select_all")}
          className={checkboxClass}
        />
      ),
      render: (r) => (
        <input
          type="checkbox"
          checked={selected.has(r.id)}
          onChange={(e) => toggleOne(r.id, e.target.checked)}
          aria-label={t("select_row")}
          className={checkboxClass}
        />
      ),
    },
    {
      key: "name",
      label: t("col.product"),
      render: (r) => <ProductCell name={pickLang(r.name, locale)} sub={r.brand} image={r.photos[0]} />,
    },
    {
      key: "category",
      label: t("col.category"),
      render: (r) => <Badge variant="primary">{categoryLabel(r.category) || "—"}</Badge>,
    },
    { key: "unit", label: t("col.unit") },
    {
      key: "barcode",
      label: t("col.barcode"),
      render: (r) => <span className="font-mono text-xs text-subtext">{r.barcode || "—"}</span>,
    },
    {
      key: "storeCount",
      label: t("col.stores"),
      render: (r) => r.storeCount.toLocaleString(),
      tdClass: "tabular-nums",
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={LIBRARY_STATUS[r.status]}>{t("status." + r.status)}</Badge>,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/library/products/${r.id}`}
            aria-label={t("edit")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="pencil" className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => remove(r.id)}
            aria-label={t("delete")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
          >
            <DashIcon name="trash" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filtered = sf !== "all" || catFilter !== "all" || q !== "";

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search_products")} value={q} onChange={setQ} />
        <select
          className={fInput + " max-w-48"}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">{t("all_categories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name.en}>
              {pickLang(c.name, locale)}
            </option>
          ))}
        </select>
        <ImportMenu t={t} kind="products" className="ms-auto" />
        <Link href="/library/products/new" className={btnPrimary}>
          <DashIcon name="plus" className="w-4 h-4" />
          {t("new_product")}
        </Link>
      </div>
      <FilterPills options={filterOptions} value={sf} onChange={(v) => setSf(v as LibraryStatus | "all")} />

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 rounded-xl border border-border bg-card px-4 py-2.5">
          <span className="text-sm font-semibold text-text">
            {t("selected_count", { count: selected.size })}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-[13px] text-subtext hover:text-text transition-colors cursor-pointer"
          >
            {t("clear_selection")}
          </button>
          <Button type="button" variant="danger" size="sm" icon="trash" className="ms-auto" onClick={bulkDelete}>
            {t("delete_selected")}
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        empty={t(filtered ? "empty.products_filtered" : "empty.products")}
      />
    </>
  );
}
