"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DashIcon, DataTable, FilterPills, SearchBox, type Column } from "@/components/ui";
import {
  PACK_STATUS,
  PACK_STATUS_KEYS,
  PackDetailModal,
  PackThumb,
  PacksHeader,
  formatDa,
  formatDate as formatDateIn,
  type Pack,
  type PackCounts,
  type PackStatus,
} from "@/features/packs-management";

type View = "review" | "all";

export default function PacksManagementClient({
  view,
  packs,
  total,
  counts,
  error,
}: {
  /** `review` = packs under review · `all` = every pack, filterable by status. */
  view: View;
  /** The loaded packs — capped server-side (see data.ts). */
  packs: Pack[];
  /** Exact number of packs this tab matches, so a capped list can say so. */
  total: number;
  /** Exact per-status counts: headline stats, tab badges and the "All" pills (the list may be capped). */
  counts: PackCounts;
  error?: string;
}) {
  const t = useTranslations("packs");
  const locale = useLocale();
  const formatDate = (iso: string) => formatDateIn(iso, locale);
  const [q, setQ] = useState("");
  const [sf, setSf] = useState<PackStatus | "all">("all");
  const [viewing, setViewing] = useState<Pack | null>(null);

  const needle = q.trim().toLowerCase();
  const visible = packs
    .filter((p) => (view === "all" && sf !== "all" ? p.status === sf : true))
    .filter((p) =>
      needle
        ? [p.name, p.storeName, p.merchantName].some((s) => s?.toLowerCase().includes(needle))
        : true
    );

  const columns: Column<Pack>[] = [
    {
      key: "name",
      label: t("col.name"),
      render: (r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <PackThumb src={r.image} />
          <div className="min-w-0">
            <p className="font-medium text-text truncate max-w-[220px]">{r.name}</p>
            <p className="text-xs text-subtext truncate max-w-[220px]">{r.storeName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "merchantName",
      label: t("col.merchant"),
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-text">{r.merchantName || "—"}</p>
          {r.merchantPhone && (
            <p className="text-xs text-subtext" dir="ltr">
              {r.merchantPhone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "itemCount",
      label: t("col.items"),
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="tabular-nums">{t("items_count", { n: r.itemCount })}</span>
          {r.freeCount > 0 && <span className="block text-xs text-success">{t("free_units", { n: r.freeCount })}</span>}
          {!r.sellable && (r.status === "active" || r.status === "under_review") && (
            <span className="block text-xs text-danger">{t("unsellable_short")}</span>
          )}
        </div>
      ),
    },
    {
      key: "discountPercent",
      label: t("col.discount"),
      render: (r) =>
        r.discountPercent > 0 ? (
          <Badge variant="info">{t("pct_off", { pct: r.discountPercent })}</Badge>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "freeDelivery",
      label: t("col.delivery"),
      render: (r) =>
        r.freeDelivery ? (
          <Badge variant="success">{t("free_delivery")}</Badge>
        ) : (
          <span className="text-subtext">{t("standard")}</span>
        ),
    },
    {
      key: "price",
      label: t("col.price"),
      render: (r) => (
        <div className="whitespace-nowrap tabular-nums">
          <span className="font-semibold text-text">{formatDa(r.price)}</span>
          {r.savings > 0 && <span className="block text-xs text-subtext line-through">{formatDa(r.originalPrice)}</span>}
        </div>
      ),
    },
    ...(view === "all"
      ? [
          {
            key: "status",
            label: t("col.status"),
            render: (r: Pack) => (
              <div className="flex flex-col items-start gap-1">
                <Badge variant={PACK_STATUS[r.status]}>{t(`status.${r.status}`)}</Badge>
                {r.reviewNote && (
                  <span className="block max-w-[200px] truncate text-xs text-subtext" title={r.reviewNote}>
                    {r.reviewNote}
                  </span>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: "updatedAt",
      label: view === "review" ? t("col.submitted") : t("col.updated"),
      render: (r) => <span className="text-subtext whitespace-nowrap">{formatDate(r.updatedAt)}</span>,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Button size="xs" variant="secondary" icon="eye" onClick={() => setViewing(r)}>
            {r.status === "under_review" ? t("review_btn") : t("view")}
          </Button>
          <Link
            href={`/packs-management/${r.id}`}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-subtext hover:text-text hover:bg-muted transition-colors"
          >
            <DashIcon name="pencil" className="w-3.5 h-3.5" />
            {t("edit")}
          </Link>
        </div>
      ),
    },
  ];

  // Pill counts are exact (from the server), not tallies of the capped list.
  const exactFor = (k: PackStatus | "all") => (k === "all" ? counts.total : counts.byStatus[k]);
  const filterOptions: [PackStatus | "all", string][] = [
    ["all", `${t("all")} (${exactFor("all")})`],
    ...PACK_STATUS_KEYS.map((k) => [k, `${t(`status.${k}`)} (${exactFor(k)})`] as [PackStatus, string]),
  ];
  // How many of the current filter's packs are loaded vs. exist.
  const statusFilter = view === "all" ? sf : "all";
  const loaded = statusFilter === "all" ? packs.length : packs.filter((p) => p.status === statusFilter).length;
  const exact = view === "all" ? exactFor(statusFilter) : total;

  const empty = needle || sf !== "all" ? t("empty.filtered") : view === "review" ? t("empty.review") : t("empty.none");

  return (
    <>
      <PacksHeader counts={counts} />
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
      </div>
      {view === "all" && <FilterPills options={filterOptions} value={sf} onChange={setSf} />}
      {loaded < exact && (
        <p className="text-xs text-subtext mb-3">
          {t(view === "review" ? "showing_oldest" : "showing_latest", { shown: loaded, total: exact })}
        </p>
      )}
      <DataTable columns={columns} data={visible} error={error} emptyMessage={empty} />
      {viewing && <PackDetailModal pack={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
