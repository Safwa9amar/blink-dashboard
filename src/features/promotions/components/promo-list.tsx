"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, FilterPills, SearchBox, StatCard, StatGrid, type Column } from "@/components/ui";
import {
  deletePromotion,
  duplicatePromotion,
  setPromotionActive,
  setPromotionArchived,
} from "@/app/d/promotions/action";
import { promotionAvailability, type Availability } from "../availability";
import { CATEGORIES } from "../form";
import { fmtNum, pct, progress } from "../format";
import { EMPTY_STATS, type PromotionListItem, type PromotionStats } from "../types";
import { AVAILABILITIES, AVAIL_VARIANT } from "../variants";

interface ListRow {
  id: string;
  title: string;
  code: string | null;
  image_url: string;
  category: string;
  kind: "promo" | "deal";
  discount: string;
  availability: Availability;
  is_active: boolean;
  archived: boolean;
  starts_at: string | null;
  ends_at: string | null;
  views: number;
  taps: number;
  ctr: number;
  issued: number;
  max_coupons: number | null;
  used: number;
  conversion: number;
  discount_given: number;
  discount_budget: number | null;
  revenue: number;
  search: string;
}

type Tab = "promo" | "deal" | "archived";

export function PromoList({
  items,
  stats30,
  error,
}: {
  items: PromotionListItem[];
  stats30: PromotionStats[];
  error?: string;
}) {
  const t = useTranslations("promotions");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>("promo");
  const [avail, setAvail] = useState<Availability | "all">("all");
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [now] = useState(() => new Date());

  const rows: ListRow[] = useMemo(
    () =>
      items.map(({ row, stats }) => {
        const s = stats ?? EMPTY_STATS(row.id);
        const discount =
          row.discount_type === "percent"
            ? `${fmtNum(row.discount_value, locale)}%`
            : row.discount_type === "fixed"
              ? `${fmtNum(row.discount_value, locale)} ${tc("da")}`
              : t("discount_types.free_delivery");
        return {
          id: row.id,
          title: row.title,
          code: row.code,
          image_url: row.image_url,
          category: row.category,
          kind: row.kind,
          discount,
          availability: promotionAvailability(row, s, now),
          is_active: row.is_active,
          archived: !!row.archived_at,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          views: s.views,
          taps: s.taps,
          ctr: s.views ? s.taps / s.views : 0,
          issued: s.issued,
          max_coupons: row.max_coupons,
          used: s.used,
          conversion: s.issued ? s.used / s.issued : 0,
          discount_given: s.discount_given,
          discount_budget: row.discount_budget,
          revenue: s.revenue,
          search: `${row.title} ${row.code ?? ""}`.toLowerCase(),
        };
      }),
    [items, locale, now, t, tc]
  );

  const kpi = useMemo(() => {
    const live = rows.filter((r) => r.availability === "live").length;
    const issued = stats30.reduce((a, s) => a + s.issued, 0);
    const used = stats30.reduce((a, s) => a + s.used, 0);
    const given = stats30.reduce((a, s) => a + s.discount_given, 0);
    const views = stats30.reduce((a, s) => a + s.views, 0);
    const taps = stats30.reduce((a, s) => a + s.taps, 0);
    return { live, issued, used, given, ctr: pct(taps, views) };
  }, [rows, stats30]);

  const counts = useMemo(
    () => ({
      promo: rows.filter((r) => !r.archived && r.kind === "promo").length,
      deal: rows.filter((r) => !r.archived && r.kind === "deal").length,
      archived: rows.filter((r) => r.archived).length,
    }),
    [rows]
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "archived" ? !r.archived : r.archived || r.kind !== tab) return false;
      if (tab !== "archived" && avail !== "all" && r.availability !== avail) return false;
      if (cat !== "all" && r.category !== cat) return false;
      return !needle || r.search.includes(needle);
    });
  }, [rows, tab, avail, cat, q]);

  const run = (fn: () => Promise<{ error: string | null } | { error: string }>) => {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.error) setMsg(t.has(`errors.${res.error}` as never) ? t(`errors.${res.error}` as never) : res.error);
      else router.refresh();
    });
  };

  const da = (n: number) => `${fmtNum(n, locale)} ${tc("da")}`;
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale) : "—");

  const columns: Column<ListRow>[] = [
    {
      key: "title",
      label: t("cols.promotion"),
      render: (r) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="w-12 h-9 rounded-md bg-muted bg-cover bg-center shrink-0 border border-border"
            style={r.image_url ? { backgroundImage: `url(${r.image_url})` } : undefined}
          />
          <div className="min-w-0">
            <div className="font-semibold text-text truncate max-w-[220px]">{r.title}</div>
            {r.code && <span className="font-mono text-[11px] text-subtext">{r.code}</span>}
          </div>
        </div>
      ),
    },
    { key: "category", label: t("cols.category"), render: (r) => <span>{t(`categories.${r.category}` as never)}</span> },
    { key: "discount", label: t("cols.discount"), sortable: false, render: (r) => <span className="whitespace-nowrap">{r.discount}</span> },
    {
      key: "availability",
      label: t("cols.status"),
      render: (r) => <Badge variant={AVAIL_VARIANT[r.availability]}>{t(`avail.${r.availability}` as never)}</Badge>,
    },
    {
      key: "starts_at",
      label: t("cols.dates"),
      render: (r) => (
        <span className="text-subtext whitespace-nowrap text-xs">
          {date(r.starts_at)} → {date(r.ends_at)}
        </span>
      ),
    },
    { key: "views", label: t("cols.views"), render: (r) => <span className="tabular-nums">{fmtNum(r.views, locale)}</span> },
    { key: "ctr", label: t("cols.ctr"), render: (r) => <span className="tabular-nums">{pct(r.taps, r.views)}</span> },
    {
      key: "issued",
      label: t("cols.issued"),
      render: (r) => (
        <span className="tabular-nums whitespace-nowrap">
          {fmtNum(r.issued, locale)}
          {r.max_coupons != null && <span className="text-subtext"> / {fmtNum(r.max_coupons, locale)}</span>}
        </span>
      ),
    },
    { key: "used", label: t("cols.used"), render: (r) => <span className="tabular-nums">{fmtNum(r.used, locale)}</span> },
    {
      key: "conversion",
      label: t("cols.conversion"),
      render: (r) => <span className="tabular-nums">{pct(r.used, r.issued)}</span>,
    },
    {
      key: "discount_given",
      label: t("cols.discount_given"),
      render: (r) => {
        const p = progress(r.discount_given, r.discount_budget);
        return (
          <div className="min-w-[120px]">
            <div className="tabular-nums whitespace-nowrap">
              {da(r.discount_given)}
              {r.discount_budget != null && <span className="text-subtext"> / {da(r.discount_budget)}</span>}
            </div>
            {p != null && (
              <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${p >= 100 ? "bg-danger" : "bg-primary"}`}
                  style={{ width: `${p}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    { key: "revenue", label: t("cols.revenue"), render: (r) => <span className="tabular-nums whitespace-nowrap">{da(r.revenue)}</span> },
    {
      key: "actions",
      label: tc("actions"),
      sortable: false,
      render: (r) => (
        <div className="flex flex-wrap gap-1 min-w-[170px]" data-row-ignore>
          <Link href={`/promotions/${r.id}`} className="inline-flex">
            <Button size="xs" variant="secondary" icon="pencil" type="button">
              {t("actions.edit")}
            </Button>
          </Link>
          {!r.archived && (
            <Button size="xs" variant="ghost" type="button" disabled={pending} onClick={() => run(() => setPromotionActive(r.id, !r.is_active))}>
              {r.is_active ? t("actions.pause") : t("actions.resume")}
            </Button>
          )}
          <Button size="xs" variant="ghost" type="button" disabled={pending} onClick={() => run(() => duplicatePromotion(r.id, t("copy_suffix")))}>
            {t("actions.duplicate")}
          </Button>
          <Button size="xs" variant="ghost" type="button" disabled={pending} onClick={() => run(() => setPromotionArchived(r.id, !r.archived))}>
            {r.archived ? t("actions.unarchive") : t("actions.archive")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            type="button"
            icon="trash"
            disabled={pending}
            onClick={() => {
              if (window.confirm(t("actions.confirm_delete", { title: r.title }))) run(() => deletePromotion(r.id));
            }}
          >
            {t("actions.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <StatGrid cols={5}>
        <StatCard label={t("kpi.live")} value={kpi.live} variant="success" icon="gift" change={t("kpi.live_chg", { n: rows.length })} />
        <StatCard label={t("kpi.issued")} value={kpi.issued} variant="primary" icon="ticket" change={t("kpi.last30")} />
        <StatCard label={t("kpi.used")} value={kpi.used} variant="info" icon="trending" change={t("kpi.last30")} />
        <StatCard label={t("kpi.discount")} value={da(kpi.given)} variant="warning" icon="dollar" change={t("kpi.last30")} />
        <StatCard label={t("kpi.ctr")} value={kpi.ctr} variant="default" icon="activity" change={t("kpi.last30")} />
      </StatGrid>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
        <select
          className="bg-card border border-border rounded-lg px-3 h-[34px] text-[13px] text-text"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label={t("cols.category")}
        >
          <option value="all">{t("filters.all_categories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}` as never)}
            </option>
          ))}
        </select>
        <Link href="/promotions/new" className="ms-auto">
          <Button icon="plus" type="button">
            {t("new_campaign")}
          </Button>
        </Link>
      </div>

      <FilterPills<Tab>
        options={[
          ["promo", `${t("tabs.promos")} (${counts.promo})`],
          ["deal", `${t("tabs.deals")} (${counts.deal})`],
          ["archived", `${t("tabs.archived")} (${counts.archived})`],
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab !== "archived" && (
        <FilterPills<Availability | "all">
          options={[["all", t("filters.all_status")], ...AVAILABILITIES.map((a) => [a, t(`avail.${a}` as never)] as [Availability, string])]}
          value={avail}
          onChange={setAvail}
        />
      )}

      {msg && <p className="text-danger text-sm mb-3">{msg}</p>}
      <DataTable<ListRow>
        columns={columns}
        data={shown}
        error={error}
        emptyMessage={t("empty")}
        rowHref={(r) => `/promotions/${r.id}`}
      />
    </>
  );
}
