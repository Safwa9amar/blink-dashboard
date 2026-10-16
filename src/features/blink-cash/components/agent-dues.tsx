"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { formatDay } from "@/features/promotions";
import { Badge, Card, DashIcon, DataTable, FilterPills, SearchBox, type Column } from "@/components/ui";
import { OpsMap, type MapCircle } from "@/components/map/ops-map";
import { remindAgentDues } from "@/app/d/blink-cash/action";
import {
  TX_STATUS_VARIANT,
  formatDA as da,
  type AgentDueRow,
  type AgentDuesPayment,
  type AgentDuesSummary,
  type Exposure,
} from "../data";
import type { TFn } from "../types";
import { capacityLevel, capacityPercent, capacityRatio, effectiveLimit } from "../lib/capacity";
import { RemindButton } from "./remind-button";
import { EditLimitButton, PendingPaymentActions, RecordPaymentButton, type PayMethod } from "./payments";
import { MigrationNotice } from "./ops-shared";

type Filter = "all" | "owing" | "credit" | "high";

const EXPOSURE_VARIANT = { high: "danger", medium: "warning", low: "info", none: "default" } as const;
// Map circle colour per exposure (MarkerKind → theme colour in the shared map).
const EXPOSURE_KIND = { high: "alert", medium: "dropoff", low: "pickup", none: "rider" } as const;
const EXPOSURE_COLOR: Record<Exposure, string> = {
  high: "var(--danger)",
  medium: "var(--warning)",
  low: "var(--primary)",
  none: "var(--success)",
};
const EXPOSURE_INTENSITY: Record<Exposure, number> = { high: 1, medium: 0.7, low: 0.45, none: 0.25 };

/** "3 h ago" — only call after mount (`now` is null on the server and first paint). */
function ago(iso: string | null, now: number | null, locale: string): string {
  if (!iso || now == null) return "—";
  const s = Math.round((Date.parse(iso) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86_400), "day");
}

function ErrorCard({ t, error }: { t: TFn; error?: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-danger-light text-danger inline-flex items-center justify-center shrink-0">
          <DashIcon name="warn" className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text">{t("agents.load_error")}</p>
          <p className="text-sm text-subtext mt-1">{t("agents.load_error_desc")}</p>
          {error && <p className="text-xs text-danger font-mono mt-2 break-all">{error}</p>}
        </div>
      </div>
    </Card>
  );
}

function Kpi({ label, value, change, color }: { label: string; value: string | number; change: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-subtext">{label}</p>
      <p className="text-xl sm:text-2xl font-bold leading-none tabular-nums text-text mt-2.5 break-words">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className={`text-xs font-medium mt-2 ${color}`}>{change}</p>
    </div>
  );
}

/** Agent cash dues — what each agent owes Blink, from blink-server. */
export function AgentDues({
  t,
  summary,
  error,
  defaultLimit = null,
  methods = [],
  migrationPending = false,
}: {
  t: TFn;
  summary: AgentDuesSummary | null;
  error?: string;
  /** blink_cash_settings.agent_credit_limit — used when an agent has no limit of its own. */
  defaultLimit?: number | null;
  methods?: PayMethod[];
  migrationPending?: boolean;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState<number | null>(null);
  const locale = useLocale();
  // Relative times need the browser clock; set after mount so server and first paint agree.
  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = useMemo(() => {
    if (!summary) return [];
    const needle = q.trim().toLowerCase();
    return summary.agents.filter((a) => {
      if (filter === "owing" && a.owed <= 0) return false;
      if (filter === "credit" && a.credit <= 0) return false;
      if (filter === "high" && a.exposure !== "high") return false;
      return !needle || [a.name, a.phone, a.shopName, a.shopAddress].some((s) => s?.toLowerCase().includes(needle));
    });
  }, [summary, q, filter]);

  // Popups show relative time, so only recompute once a minute.
  const nowMin = now == null ? null : Math.floor(now / 60000) * 60000;
  const located = useMemo(() => rows.filter((a) => a.lat != null && a.lng != null), [rows]);
  const circles = useMemo<MapCircle[]>(() => {
    const max = Math.max(1, ...located.map((a) => a.owed));
    return located.map((a) => ({
      id: a.id,
      lat: a.lat as number,
      lng: a.lng as number,
      radius: 7 + 23 * Math.sqrt(a.owed / max),
      intensity: EXPOSURE_INTENSITY[a.exposure],
      kind: EXPOSURE_KIND[a.exposure],
      label: a.name,
      detail: t("agents.popup", { owed: da(a.owed), ago: ago(a.lastOperationAt, nowMin, locale) }),
    }));
  }, [located, nowMin, locale, t]);

  if (!summary) return <ErrorCard t={t} error={error} />;

  const columns: Column<AgentDueRow>[] = [
    {
      key: "name",
      label: t("agents.col.agent"),
      render: (r) => (
        <div className="min-w-[140px]">
          <p className="font-semibold text-text" dir="auto">
            {r.name}
          </p>
          {r.phone && (
            <p className="text-xs text-subtext" dir="ltr">
              {r.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "shopName",
      label: t("agents.col.shop"),
      render: (r) => (
        <div className="min-w-[140px]">
          <p className="text-text" dir="auto">
            {r.shopName ?? "—"}
          </p>
          {r.shopAddress && (
            <p className="text-xs text-subtext" dir="auto">
              {r.shopAddress}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "shopsOpen",
      label: t("agents.col.shops"),
      render: (r) => (
        <span className="text-subtext whitespace-nowrap">
          {t("agents.shops_open", { open: r.shopsOpen, total: r.shopsTotal })}
        </span>
      ),
    },
    {
      key: "depAmount",
      label: t("agents.col.deposits"),
      render: (r) => (
        <div className="whitespace-nowrap">
          <p className="font-mono text-text">{da(r.depAmount)}</p>
          <p className="text-xs text-subtext">{t("agents.ops", { n: r.depCount })}</p>
        </div>
      ),
    },
    {
      key: "wdAmount",
      label: t("agents.col.withdrawals"),
      render: (r) => (
        <div className="whitespace-nowrap">
          <p className="font-mono text-text">{da(r.wdAmount)}</p>
          <p className="text-xs text-subtext">{t("agents.ops", { n: r.wdCount })}</p>
        </div>
      ),
    },
    {
      key: "feeNet",
      label: t("agents.col.fees"),
      render: (r) => <span className="font-mono text-subtext whitespace-nowrap">{da(r.feeNet)}</span>,
    },
    {
      key: "owed",
      label: t("agents.col.owed"),
      render: (r) =>
        r.owed > 0 ? (
          <span className="font-mono font-semibold text-primary whitespace-nowrap">{da(r.owed)}</span>
        ) : r.credit > 0 ? (
          <span className="font-mono text-success whitespace-nowrap">{t("agents.credit", { amount: da(r.credit) })}</span>
        ) : (
          <span className="text-subtext">{t("agents.settled")}</span>
        ),
    },
    {
      key: "creditLimit",
      label: t("agents.col.limit"),
      render: (r) => {
        const limit = effectiveLimit(r.creditLimit, defaultLimit);
        return (
          <div className="whitespace-nowrap">
            <p className="font-mono text-text">{limit === null ? "—" : da(limit)}</p>
            <p className="text-xs text-subtext">
              {r.creditLimit == null ? t("agents.limit_default") : t("agents.limit_custom")} ·{" "}
              <EditLimitButton t={t} agentId={r.id} name={r.name} current={r.creditLimit ?? null} fallback={defaultLimit} />
            </p>
          </div>
        );
      },
    },
    {
      key: "capacity",
      label: t("agents.col.capacity"),
      render: (r) => {
        const ratio = capacityRatio(r.owed, effectiveLimit(r.creditLimit, defaultLimit));
        const level = capacityLevel(ratio);
        const color = level === "full" ? "bg-danger" : level === "warn" ? "bg-warning" : "bg-success";
        const pct = capacityPercent(ratio);
        return ratio === null ? (
          <span className="text-subtext">—</span>
        ) : (
          <div className="min-w-[110px]" title={t(`agents.capacity_${level}`)}>
            <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, pct ?? 0)} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct ?? 0)}%` }} />
            </div>
            <p className={`text-xs mt-1 tabular-nums ${level === "ok" ? "text-subtext" : level === "warn" ? "text-warning" : "text-danger"}`}>
              {pct}%
            </p>
          </div>
        );
      },
    },
    {
      key: "exposureRank",
      label: t("agents.col.exposure"),
      render: (r) => <Badge variant={EXPOSURE_VARIANT[r.exposure]}>{t(`agents.exposure.${r.exposure}`)}</Badge>,
    },
    {
      key: "lastOperationAt",
      label: t("agents.col.last_op"),
      render: (r) => (
        <span className="text-subtext whitespace-nowrap">
          {r.lastOperationAt ? ago(r.lastOperationAt, now, locale) : t("agents.never")}
        </span>
      ),
    },
    {
      key: "rating",
      label: t("agents.col.rating"),
      render: (r) =>
        r.rating != null ? (
          <span className="whitespace-nowrap tabular-nums" title={String(r.ratingsCount)}>
            ★ {r.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-subtext">{t("agents.no_rating")}</span>
        ),
    },
    {
      key: "act",
      label: "",
      sortable: false,
      render: (r) => (
        <div className="flex flex-col items-start gap-1.5">
          <RecordPaymentButton t={t} kind="agent" partyId={r.id} partyName={r.name} methods={methods} suggested={r.owed} />
          {r.owed > 0 ? <RemindButton t={t} id={r.id} remind={remindAgentDues} /> : null}
        </div>
      ),
    },
  ];

  const paymentColumns: Column<AgentDuesPayment>[] = [
    {
      key: "createdAt",
      label: t("col.when"),
      render: (r) => <span className="text-subtext whitespace-nowrap">{formatDay(r.createdAt, locale)}</span>,
    },
    {
      key: "agentName",
      label: t("agents.col.agent"),
      render: (r) => (
        <span className="text-text" dir="auto">
          {r.agentName || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      label: t("col.amount"),
      render: (r) => <span className="font-mono font-semibold whitespace-nowrap">{da(r.amount)}</span>,
    },
    {
      key: "fees",
      label: t("col.fees"),
      render: (r) => <span className="font-mono text-subtext whitespace-nowrap">{r.fees ? da(r.fees) : "—"}</span>,
    },
    { key: "method", label: t("col.method"), render: (r) => <span className="capitalize text-subtext">{r.method}</span> },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={TX_STATUS_VARIANT[r.status] ?? "default"}>{t(`tx_status.${r.status}`)}</Badge>,
    },
    {
      key: "act",
      label: "",
      sortable: false,
      render: (r) => (r.status === "pending" ? <PendingPaymentActions t={t} kind="agent" id={r.id} /> : null),
    },
  ];

  return (
    <>
      {migrationPending && <MigrationNotice t={t} />}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <Kpi label={t("agents.kpi_agents")} value={summary.agents.length} change={t("agents.kpi_agents_chg")} color="text-primary" />
        <Kpi label={t("agents.kpi_owing")} value={summary.agentsOwing} change={t("agents.kpi_owing_chg")} color="text-warning" />
        <Kpi label={t("agents.kpi_owed")} value={da(summary.totalOwed)} change={t("agents.kpi_owed_chg")} color="text-danger" />
        <Kpi label={t("agents.kpi_credit")} value={da(summary.totalCredit)} change={t("agents.kpi_credit_chg")} color="text-success" />
        <Kpi label={t("agents.kpi_ops")} value={summary.operations30} change={t("agents.kpi_ops_chg")} color="text-info" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <SearchBox placeholder={t("agents.search")} value={q} onChange={setQ} />
      </div>
      <FilterPills<Filter>
        options={[
          ["all", t("agents.filter_all")],
          ["owing", t("agents.filter_owing")],
          ["credit", t("agents.filter_credit")],
          ["high", t("agents.filter_high"), "warn"],
        ]}
        value={filter}
        onChange={setFilter}
      />
      <div className="mb-7">
        <DataTable
          columns={columns}
          data={rows}
          keyField="id"
          emptyMessage={q || filter !== "all" ? t("agents.empty_filtered") : t("agents.empty")}
        />
      </div>

      <div className="mb-7">
        <Card title={t("agents.map_title")} description={t("agents.map_desc")}>
          {circles.length === 0 ? (
            <p className="text-sm text-subtext py-8 text-center">{t("agents.map_none")}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3.5 mb-3">
                {(["high", "medium", "low", "none"] as const).map((e) => (
                  <span key={e} className="flex items-center gap-1.5 text-xs text-subtext">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: EXPOSURE_COLOR[e] }} />
                    {t(`agents.exposure.${e}`)}
                  </span>
                ))}
              </div>
              <OpsMap circles={circles} height={380} fitKey={`${filter}|${q}`} className="rounded-xl overflow-hidden" />
            </>
          )}
        </Card>
      </div>

      <Card title={t("agents.payments_title")} description={t("agents.payments_desc")}>
        <DataTable columns={paymentColumns} data={summary.payments} emptyMessage={t("agents.payments_empty")} />
      </Card>
    </>
  );
}
