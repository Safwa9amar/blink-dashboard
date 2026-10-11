"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, FilterPills, SearchBox, type Column } from "@/components/ui";
import {
  DeviationBadge,
  ProductCellView,
  ProductReviewModal,
  SuggestionReviewModal,
  REVIEW_STATUS,
  SUGGESTION_STATUS,
  formatDa,
  formatDate as formatDateIn,
  type CatalogProduct,
} from "@/features/merchant-pricing";

type View = "prices" | "products" | "history";
type HistoryFilter = "all" | "prices" | "products";

const isPriceDecision = (p: CatalogProduct) =>
  p.suggestionStatus === "accepted" || p.suggestionStatus === "rejected";
const isProductDecision = (p: CatalogProduct) => p.reviewStatus === "rejected";

export default function MerchantPricingClient({
  view,
  rows,
  total,
  error,
}: {
  /** `prices` = pending price suggestions · `products` = new products to approve · `history` = decided items. */
  view: View;
  /** The loaded rows — capped server-side (see data.ts). */
  rows: CatalogProduct[];
  /** Exact number of matching rows, so a capped list can say so. */
  total: number;
  error?: string;
}) {
  const t = useTranslations("merchant_pricing");
  const locale = useLocale();
  const formatDate = (iso: string) => formatDateIn(iso, locale);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [open, setOpen] = useState<{ kind: "price" | "product"; product: CatalogProduct } | null>(null);

  const needle = q.trim().toLowerCase();
  const visible = rows
    .filter((p) =>
      view !== "history" || filter === "all"
        ? true
        : filter === "prices"
          ? isPriceDecision(p)
          : isProductDecision(p)
    )
    .filter((p) =>
      needle
        ? [p.title, p.storeName, p.merchantName, p.barcode, p.brand, p.category].some((s) =>
            s?.toLowerCase().includes(needle)
          )
        : true
    );

  const productColumn: Column<CatalogProduct> = {
    key: "title",
    label: t("col.product"),
    render: (p) => (
      <ProductCellView
        src={p.photos[0]}
        title={p.title}
        sub={[p.brand, p.category].filter(Boolean).join(" · ") || undefined}
      />
    ),
  };
  const storeColumn: Column<CatalogProduct> = {
    key: "storeName",
    label: t("col.store"),
    render: (p) => (
      <div className="min-w-0">
        <p className="text-sm text-text">{p.storeName}</p>
        <p className="text-xs text-subtext">
          {p.merchantName || "—"}
          {p.merchantPhone && (
            <span dir="ltr" className="ms-1.5">
              {p.merchantPhone}
            </span>
          )}
        </p>
      </div>
    ),
  };
  const money = (key: keyof CatalogProduct, label: string, strong = false): Column<CatalogProduct> => ({
    key,
    label,
    render: (p) => {
      const v = p[key] as number | null;
      return v === null || (key === "blinkPrice" && v === 0) ? (
        <span className="text-subtext">—</span>
      ) : (
        <span className={`tabular-nums whitespace-nowrap ${strong ? "font-semibold text-primary" : ""}`}>
          {formatDa(v)}
        </span>
      );
    },
  });
  const reviewColumn = (kind: "price" | "product", label: string): Column<CatalogProduct> => ({
    key: "actions",
    label: t("col.actions"),
    sortable: false,
    render: (p) => (
      <Button size="xs" variant="secondary" icon="eye" onClick={() => setOpen({ kind, product: p })}>
        {label}
      </Button>
    ),
  });

  const columns: Column<CatalogProduct>[] =
    view === "prices"
      ? [
          productColumn,
          storeColumn,
          money("blinkPrice", t("col.blink_price")),
          money("price", t("col.current")),
          money("suggestedPrice", t("col.suggested"), true),
          { key: "deviation", label: t("col.deviation"), render: (p) => <DeviationBadge deviation={p.deviation} /> },
          {
            key: "updatedAt",
            label: t("col.submitted"),
            render: (p) => <span className="text-subtext whitespace-nowrap">{formatDate(p.updatedAt)}</span>,
          },
          reviewColumn("price", t("review_btn")),
        ]
      : view === "products"
        ? [
            productColumn,
            {
              key: "barcode",
              label: t("col.barcode"),
              render: (p) => <span className="font-mono text-xs">{p.barcode || "—"}</span>,
            },
            { key: "unit", label: t("col.unit"), render: (p) => p.unit || <span className="text-subtext">—</span> },
            money("price", t("col.price"), true),
            {
              key: "photos",
              label: t("col.photos"),
              sortable: false,
              render: (p) => <span className="tabular-nums text-subtext">{p.photos.length}</span>,
            },
            storeColumn,
            {
              key: "createdAt",
              label: t("col.submitted"),
              render: (p) => <span className="text-subtext whitespace-nowrap">{formatDate(p.createdAt)}</span>,
            },
            reviewColumn("product", t("review_btn")),
          ]
        : [
            productColumn,
            storeColumn,
            {
              key: "decision",
              label: t("col.decision"),
              sortable: false,
              render: (p) => (
                <div className="flex flex-col items-start gap-1">
                  {isPriceDecision(p) && p.suggestionStatus && (
                    <Badge variant={SUGGESTION_STATUS[p.suggestionStatus]}>
                      {t(`history.price_${p.suggestionStatus}`)}
                    </Badge>
                  )}
                  {isProductDecision(p) && (
                    <Badge variant={REVIEW_STATUS.rejected}>{t("history.product_rejected")}</Badge>
                  )}
                </div>
              ),
            },
            {
              key: "price",
              label: t("col.price"),
              render: (p) => (
                <span className="tabular-nums whitespace-nowrap">
                  {formatDa(p.price)}
                  {isPriceDecision(p) && p.suggestedPrice !== null && p.suggestedPrice !== p.price && (
                    <span className="block text-xs text-subtext">
                      {t("history.suggested", { price: formatDa(p.suggestedPrice) })}
                    </span>
                  )}
                </span>
              ),
            },
            {
              key: "reviewNote",
              label: t("col.note"),
              sortable: false,
              render: (p) => (
                <span className="block max-w-[260px] truncate text-subtext" title={p.reviewNote ?? undefined}>
                  {p.reviewNote || "—"}
                </span>
              ),
            },
            {
              key: "updatedAt",
              label: t("col.updated"),
              render: (p) => <span className="text-subtext whitespace-nowrap">{formatDate(p.updatedAt)}</span>,
            },
            {
              key: "actions",
              label: "",
              sortable: false,
              render: (p) => (
                <Button
                  size="xs"
                  variant="ghost"
                  icon="eye"
                  aria-label={t("view")}
                  onClick={() => setOpen({ kind: isPriceDecision(p) ? "price" : "product", product: p })}
                />
              ),
            },
          ];

  const empty = needle || filter !== "all" ? t("empty.filtered") : t(`empty.${view}`);

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
      </div>

      {rows.length < total && (
        <p className="text-xs text-subtext mb-3">
          {t(view === "history" ? "showing_latest" : "showing_oldest", { shown: rows.length, total })}
        </p>
      )}

      {view === "history" && (
        <>
          <FilterPills<HistoryFilter>
            options={[
              ["all", t("all")],
              ["prices", t("history.filter_prices"), "tag"],
              ["products", t("history.filter_products"), "package"],
            ]}
            value={filter}
            onChange={setFilter}
          />
          {/* `accepted` is also set by blink-server itself for changes within ±20%. */}
          <p className="text-xs text-subtext mb-3">{t("history.applied_hint")}</p>
        </>
      )}

      <DataTable columns={columns} data={visible} error={error} emptyMessage={empty} />

      {open?.kind === "price" && <SuggestionReviewModal product={open.product} onClose={() => setOpen(null)} />}
      {open?.kind === "product" && <ProductReviewModal product={open.product} onClose={() => setOpen(null)} />}
    </>
  );
}
