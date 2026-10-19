"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button, DataTable, fInput, type Column } from "@/components/ui";
import {
  PRICE_SOURCES,
  PriceMove,
  SourceBadge,
  blinkMoved,
  formatDa,
  formatDateTime,
  type PriceChange,
  type PriceChangeFilters,
  type PriceChangePage,
} from "@/features/merchant-pricing";

export default function PriceChangesClient({
  data,
  error,
  filters,
  stores,
}: {
  data: PriceChangePage | null;
  error?: string;
  filters: PriceChangeFilters;
  stores: { id: string; name: string }[];
}) {
  const t = useTranslations("merchant_pricing");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Filters live in the URL (the server pages the log); changing one resets to page 1.
  const go = (next: Partial<Record<"store" | "source" | "from" | "to" | "page", string>>) => {
    const q = new URLSearchParams();
    const merged = {
      store: filters.storeId,
      source: filters.source,
      from: filters.from,
      to: filters.to,
      ...(next.page === undefined ? { page: undefined } : {}),
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const qs = q.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };
  const filtered = !!(filters.storeId || filters.source || filters.from || filters.to);

  const columns: Column<PriceChange>[] = [
    {
      key: "changedAt",
      label: t("changes.col.date"),
      sortable: false,
      render: (c) => <span className="text-subtext whitespace-nowrap">{formatDateTime(c.changedAt, locale)}</span>,
    },
    {
      key: "productTitle",
      label: t("col.product"),
      sortable: false,
      render: (c) => <span className="text-sm text-text">{c.productTitle}</span>,
    },
    {
      key: "storeName",
      label: t("col.store"),
      sortable: false,
      render: (c) => <span className="text-sm text-text">{c.storeName}</span>,
    },
    {
      key: "newPrice",
      label: t("changes.col.price"),
      sortable: false,
      render: (c) => <PriceMove oldPrice={c.oldPrice} newPrice={c.newPrice} />,
    },
    {
      key: "newBlinkPrice",
      label: t("col.blink_price"),
      sortable: false,
      render: (c) =>
        c.newBlinkPrice > 0 ? (
          <span className="tabular-nums whitespace-nowrap">
            {blinkMoved(c) && <span className="text-subtext">{formatDa(c.oldBlinkPrice ?? 0)} → </span>}
            {formatDa(c.newBlinkPrice)}
          </span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "source",
      label: t("changes.col.source"),
      sortable: false,
      render: (c) => <SourceBadge source={c.source} />,
    },
    {
      key: "changedBy",
      label: t("changes.col.by"),
      sortable: false,
      render: (c) =>
        c.changedBy ? (
          <span className="text-sm">{c.changedBy.name ?? "—"}</span>
        ) : (
          <span className="text-subtext">{t("changes.by_none")}</span>
        ),
    },
  ];

  const page = data?.page ?? filters.page;
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-[18px]">
        <label className="flex flex-col gap-1 text-xs text-subtext">
          {t("col.store")}
          <select
            className={`${fInput} min-w-44`}
            value={filters.storeId ?? ""}
            onChange={(e) => go({ store: e.target.value })}
          >
            <option value="">{t("all")}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-subtext">
          {t("changes.col.source")}
          <select
            className={`${fInput} min-w-36`}
            value={filters.source ?? ""}
            onChange={(e) => go({ source: e.target.value })}
          >
            <option value="">{t("all")}</option>
            {PRICE_SOURCES.map((s) => (
              <option key={s} value={s}>
                {t(`changes.source.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-subtext">
          {t("changes.from")}
          <input
            type="date"
            dir="ltr"
            className={fInput}
            value={filters.from ?? ""}
            max={filters.to}
            onChange={(e) => go({ from: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-subtext">
          {t("changes.to")}
          <input
            type="date"
            dir="ltr"
            className={fInput}
            value={filters.to ?? ""}
            min={filters.from}
            onChange={(e) => go({ to: e.target.value })}
          />
        </label>
        {filtered && (
          <Button size="xs" variant="ghost" icon="x" onClick={() => go({ store: "", source: "", from: "", to: "" })}>
            {t("changes.clear")}
          </Button>
        )}
      </div>

      <p className="text-xs text-subtext mb-3">{t("changes.baseline_hint")}</p>

      <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <DataTable
          columns={columns}
          data={data?.changes ?? null}
          error={error}
          emptyMessage={filtered ? t("empty.filtered") : t("empty.changes")}
          enablePagination={false}
          enableSorting={false}
        />
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between gap-3 mt-4">
          <span className="text-xs text-subtext">{t("changes.total", { total: data.total })}</span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="secondary"
              icon="chevron-left"
              disabled={page <= 1 || pending}
              aria-label={t("changes.prev")}
              onClick={() => go({ page: String(page - 1) })}
            />
            <span className="text-xs text-subtext tabular-nums">
              {t("changes.page_of", { page, pages: totalPages })}
            </span>
            <Button
              size="xs"
              variant="secondary"
              icon="chevron-right"
              disabled={page >= totalPages || pending}
              aria-label={t("changes.next")}
              onClick={() => go({ page: String(page + 1) })}
            />
          </div>
        </div>
      )}
    </>
  );
}
