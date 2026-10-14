"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, FilterPills, SearchBox, StatCard, type Column } from "@/components/ui";
import {
  deletePromotion,
  duplicatePromotion,
  setPromotionActive,
  setPromotionArchived,
} from "@/app/d/promotions/action";
import { promotionAvailability, type Availability } from "../availability";
import { CATEGORIES } from "../form";
import { categoryLabel, fmtNum, formatDay, pct, progress } from "../format";
import { EMPTY_STATS, type PromotionListItem, type PromotionStats } from "../types";
import { AVAILABILITIES, AVAIL_VARIANT } from "../variants";
import { KpiGrid } from "./kpi-grid";

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
const TABS: Tab[] = ["promo", "deal", "archived"];

/** Compact accessible "⋯" dropdown. Fixed-positioned so the table's scroll container never clips it. */
function RowMenu({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; end: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!menu.current?.contains(n) && !btn.current?.contains(n)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const rtl = document.documentElement.dir === "rtl";
      // Anchor the menu's inline-end edge to the button's inline-end edge (logical `end`).
      setPos({ top: r.bottom + 4, end: rtl ? r.left : window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
        className="inline-flex h-6 w-7 items-center justify-center rounded-md text-subtext hover:bg-muted hover:text-text"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && pos && (
        <div
          ref={menu}
          role="menu"
          className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg"
          style={{ top: pos.top, insetInlineEnd: pos.end }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}

function MenuItem({
  onClick,
  disabled,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-start text-[13px] hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${danger ? "text-danger" : "text-text"}`}
    >
      {children}
    </button>
  );
}

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
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>(() => {
    const k = params.get("kind");
    return TABS.includes(k as Tab) ? (k as Tab) : "promo";
  });
  const [avail, setAvail] = useState<Availability | "all">(() => {
    const s = params.get("status");
    return AVAILABILITIES.includes(s as Availability) ? (s as Availability) : "all";
  });
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [now] = useState(() => new Date());

  const rows: ListRow[] = useMemo(
    () =>
      items.map(({ row, stats }) => {
        const s = stats ?? EMPTY_STATS(row.id);
        const discount =
          row.discount_type !== "free_delivery" && !row.discount_value
            ? "—"
            : row.discount_type === "percent"
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

  // Category filter options: the categories present in the current tab (deals use free-text chips).
  const tabCategories = useMemo(() => {
    const inTab = rows.filter((r) => (tab === "archived" ? r.archived : !r.archived && r.kind === tab));
    const present = new Set(inTab.map((r) => r.category).filter(Boolean));
    const codes = (CATEGORIES as readonly string[]).filter((c) => present.has(c));
    const rest = [...present].filter((c) => !codes.includes(c)).sort((a, b) => a.localeCompare(b));
    return [...codes, ...rest];
  }, [rows, tab]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "archived" ? !r.archived : r.archived || r.kind !== tab) return false;
      if (tab !== "archived" && avail !== "all" && r.availability !== avail) return false;
      if (cat !== "all" && r.category !== cat) return false;
      return !needle || r.search.includes(needle);
    });
  }, [rows, tab, avail, cat, q]);

  // Keep the tab + status chip in the URL (shallow: the list is filtered client-side).
  const syncUrl = (nextTab: Tab, nextAvail: Availability | "all") => {
    const sp = new URLSearchParams(params.toString());
    if (nextTab === "promo") sp.delete("kind");
    else sp.set("kind", nextTab);
    if (nextTab === "archived" || nextAvail === "all") sp.delete("status");
    else sp.set("status", nextAvail);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const onTab = (v: Tab) => {
    setTab(v);
    setCat("all");
    syncUrl(v, avail);
  };
  const onAvail = (v: Availability | "all") => {
    setAvail(v);
    syncUrl(tab, v);
  };

  const run = (fn: () => Promise<{ error: string | null } | { error: string }>) => {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.error) setMsg(t.has(`errors.${res.error}` as never) ? t(`errors.${res.error}` as never) : res.error);
      else router.refresh();
    });
  };

  const da = (n: number) => `${fmtNum(n, locale)} ${tc("da")}`;
  const dateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return t("dates.always_on");
    if (!end) return t("dates.from", { date: formatDay(start, locale) });
    if (!start) return t("dates.until", { date: formatDay(end, locale) });
    return (
      <>
        {formatDay(start, locale)} <span className="inline-block rtl:-scale-x-100">→</span> {formatDay(end, locale)}
      </>
    );
  };

  const columns: Column<ListRow>[] = [
    {
      key: "title",
      label: t("cols.promotion"), header: <span className="whitespace-nowrap">{t("cols.promotion")}</span>,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="w-12 h-9 rounded-md bg-muted bg-cover bg-center shrink-0 border border-border"
            style={r.image_url ? { backgroundImage: `url(${r.image_url})` } : undefined}
          />
          <div className="min-w-0">
            <Link href={`/promotions/${r.id}`} dir="auto" className="block font-semibold text-text truncate max-w-[220px] hover:underline">
              {r.title}
            </Link>
            {r.code && (
              <span className="font-mono text-[11px] text-subtext" dir="auto">
                {r.code}
              </span>
            )}
          </div>
        </div>
      ),
    },
    { key: "category", label: t("cols.category"), header: <span className="whitespace-nowrap">{t("cols.category")}</span>, render: (r) => <span dir="auto">{categoryLabel(r.category, t)}</span> },
    { key: "discount", label: t("cols.discount"), header: <span className="whitespace-nowrap">{t("cols.discount")}</span>, sortable: false, render: (r) => <span className="whitespace-nowrap">{r.discount}</span> },
    {
      key: "availability",
      label: t("cols.status"), header: <span className="whitespace-nowrap">{t("cols.status")}</span>,
      render: (r) => <Badge variant={AVAIL_VARIANT[r.availability]}>{t(`avail.${r.availability}` as never)}</Badge>,
    },
    {
      key: "starts_at",
      label: t("cols.dates"), header: <span className="whitespace-nowrap">{t("cols.dates")}</span>,
      render: (r) => (
        <span className="text-subtext whitespace-nowrap text-xs">
          {dateRange(r.starts_at, r.ends_at)}
        </span>
      ),
    },
    { key: "views", label: t("cols.views"), header: <span className="whitespace-nowrap">{t("cols.views")}</span>, render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtNum(r.views, locale)}</span> },
    { key: "ctr", label: t("cols.ctr"), header: <span className="whitespace-nowrap">{t("cols.ctr")}</span>, render: (r) => <span className="tabular-nums whitespace-nowrap">{pct(r.taps, r.views)}</span> },
    {
      key: "issued",
      label: t("cols.issued"), header: <span className="whitespace-nowrap">{t("cols.issued")}</span>,
      render: (r) => (
        <span className="tabular-nums whitespace-nowrap">
          {fmtNum(r.issued, locale)}
          {r.max_coupons != null && <span className="text-subtext"> / {fmtNum(r.max_coupons, locale)}</span>}
        </span>
      ),
    },
    { key: "used", label: t("cols.used"), header: <span className="whitespace-nowrap">{t("cols.used")}</span>, render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtNum(r.used, locale)}</span> },
    {
      key: "conversion",
      label: t("cols.conversion"), header: <span className="whitespace-nowrap">{t("cols.conversion")}</span>,
      render: (r) => <span className="tabular-nums whitespace-nowrap">{pct(r.used, r.issued)}</span>,
    },
    {
      key: "discount_given",
      label: t("cols.discount_given"), header: <span className="whitespace-nowrap">{t("cols.discount_given")}</span>,
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
    { key: "revenue", label: t("cols.revenue"), header: <span className="whitespace-nowrap">{t("cols.revenue")}</span>, render: (r) => <span className="tabular-nums whitespace-nowrap">{da(r.revenue)}</span> },
    {
      key: "actions",
      label: tc("actions"), header: <span className="whitespace-nowrap">{tc("actions")}</span>,
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1 whitespace-nowrap" data-row-ignore>
          <Link href={`/promotions/${r.id}`} className="inline-flex">
            <Button size="xs" variant="secondary" icon="pencil" type="button">
              {t("actions.edit")}
            </Button>
          </Link>
          <RowMenu label={t("actions.more")}>
            {(close) => (
              <>
                {!r.archived && (
                  <MenuItem
                    disabled={pending}
                    onClick={() => {
                      close();
                      run(() => setPromotionActive(r.id, !r.is_active));
                    }}
                  >
                    {r.is_active ? t("actions.pause") : t("actions.resume")}
                  </MenuItem>
                )}
                <MenuItem
                  disabled={pending}
                  onClick={() => {
                    close();
                    run(() => duplicatePromotion(r.id, t("copy_suffix")));
                  }}
                >
                  {t("actions.duplicate")}
                </MenuItem>
                <MenuItem
                  disabled={pending}
                  onClick={() => {
                    close();
                    run(() => setPromotionArchived(r.id, !r.archived));
                  }}
                >
                  {r.archived ? t("actions.unarchive") : t("actions.archive")}
                </MenuItem>
                <MenuItem
                  danger
                  disabled={pending || r.issued > 0}
                  title={r.issued > 0 ? t("actions.delete_blocked") : undefined}
                  onClick={() => {
                    close();
                    if (window.confirm(t("actions.confirm_delete", { title: r.title }))) run(() => deletePromotion(r.id));
                  }}
                >
                  {t("actions.delete")}
                </MenuItem>
              </>
            )}
          </RowMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <KpiGrid>
        <StatCard label={t("kpi.live")} value={kpi.live} variant="success" icon="gift" change={t("kpi.live_chg", { n: rows.length })} />
        <StatCard label={t("kpi.issued")} value={kpi.issued} variant="primary" icon="ticket" change={t("kpi.last30")} />
        <StatCard label={t("kpi.used")} value={kpi.used} variant="info" icon="trending" change={t("kpi.last30")} />
        <StatCard label={t("kpi.discount")} value={da(kpi.given)} variant="warning" icon="dollar" change={t("kpi.last30")} />
        <StatCard label={t("kpi.ctr")} value={kpi.ctr} variant="default" icon="activity" change={t("kpi.last30")} />
      </KpiGrid>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
        <select
          className="bg-card border border-border rounded-lg px-3 h-[34px] text-[13px] text-text"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label={t("cols.category")}
        >
          <option value="all">{t("filters.all_categories")}</option>
          {tabCategories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c, t)}
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
        onChange={onTab}
      />
      {tab !== "archived" && (
        <FilterPills<Availability | "all">
          options={[["all", t("filters.all_status")], ...AVAILABILITIES.map((a) => [a, t(`avail.${a}` as never)] as [Availability, string])]}
          value={avail}
          onChange={onAvail}
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
