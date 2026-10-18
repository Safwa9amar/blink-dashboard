"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, EmptyState, StatCard, StatGrid } from "@/components/ui";
import { endingSoon, overviewKpis } from "../cockpit";
import { bigValue, formatDa, formatValueShort } from "../format";
import { fmtDay, intlLocale, overrideShort, scopeShort } from "../labels";
import type { Change, Fee, FeeGroup, Override, PricingKey, TFn } from "../types";
import { ExtendMenu } from "./extend-menu";
import { FeeEditModal } from "./fee-edit-modal";
import { FeeExampleLine } from "./fee-example";

const GROUPS: FeeGroup[] = ["customer", "partner", "tax"];
const GRID: Record<FeeGroup, string> = {
  customer: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3",
  partner: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3",
  tax: "grid grid-cols-1 md:grid-cols-3 gap-3",
};

function relative(iso: string, nowMs: number, locale: string): string {
  const diff = new Date(iso).getTime() - nowMs;
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 48) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

export function OverviewView({
  fees,
  overrides,
  lastChange,
  canEdit,
  error,
  nowIso,
}: {
  fees: Fee[];
  overrides: Override[];
  lastChange: Change | null;
  canEdit: boolean;
  error?: string;
  nowIso: string;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [editingKey, setEditingKey] = useState<PricingKey | null>(null);

  const kpis = useMemo(() => overviewKpis(overrides, now), [overrides, now]);
  const soon = useMemo(() => endingSoon(overrides, now), [overrides, now]);
  const feeOf = (key: string) => fees.find((f) => f.key === key);
  // Derived from the current `fees` prop so a refresh after a stale save hands the modal the fresh `updated_at`.
  const editing = editingKey ? (feeOf(editingKey) ?? null) : null;

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!fees.length) return <EmptyState title={t("overview.empty")} />;

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatCard
          label={t("overview.kpi.active")}
          value={kpis.active}
          icon="tag"
          change={kpis.wilayas ? t("overview.kpi.active_sub", { count: kpis.wilayas }) : undefined}
        />
        <StatCard
          label={t("overview.kpi.partners")}
          value={kpis.partnerDeals}
          variant="info"
          icon="users"
          change={t("overview.kpi.partners_sub", { merchants: kpis.merchants, agents: kpis.agents })}
        />
        <StatCard label={t("overview.kpi.ending")} value={kpis.endingSoon} variant="warning" icon="clock" />
        <StatCard
          label={t("overview.kpi.last")}
          value={lastChange ? t(`fees.${lastChange.key}.name`) : "—"}
          variant="default"
          icon="activity"
          change={
            lastChange
              ? `${lastChange.actor_name ?? "—"} · ${relative(lastChange.created_at, now.getTime(), locale)}`
              : t("overview.kpi.none")
          }
        />
      </StatGrid>

      {soon.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning-light px-4 py-3">
          <p className="text-[13px] font-bold text-warning mb-2">{t("overview.ending.title")}</p>
          <ul className="space-y-2">
            {soon.map(({ override: o, daysLeft }) => {
              const fee = feeOf(o.key);
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] text-text">
                    {t("overview.ending.line", {
                      fee: t(`fees.${o.key}.name`),
                      value: formatValueShort(o.key, o.value, tf),
                      scope: scopeShort(o, locale, tf),
                      days: daysLeft,
                      date: fmtDay(o.ends_at!, locale),
                      back: fee ? formatValueShort(o.key, fee.value, tf) : "—",
                    })}
                  </p>
                  {canEdit && <ExtendMenu override={o} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {GROUPS.map((g) => {
        const list = fees.filter((f) => f.group === g);
        if (!list.length) return null;
        return (
          <section key={g}>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-text">{t(`groups.${g}`)}</h2>
              <p className="text-[12.5px] text-subtext">{t(`groups.${g}_desc`)}</p>
            </div>
            <div className={GRID[g]}>
              {list.map((fee) => (
                <FeeCard
                  key={fee.key}
                  fee={fee}
                  compact={g === "tax"}
                  overrides={overrides.filter((o) => o.key === fee.key && o.status === "active")}
                  canEdit={canEdit}
                  onEdit={() => setEditingKey(fee.key)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {canEdit && <FeeEditModal fee={editing} onClose={() => setEditingKey(null)} />}
    </div>
  );
}

function FeeCard({
  fee,
  overrides,
  canEdit,
  compact,
  onEdit,
}: {
  fee: Fee;
  overrides: Override[];
  canEdit: boolean;
  compact?: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const href = `/pricing/overrides?key=${fee.key}&status=active`;
  const v = fee.value as unknown as Record<string, { base: number; included_km: number; per_km: number } & number>;

  const tariff =
    fee.key === "courier_fare" && v.motorcycle && v.bicycle
      ? [
          [t("tariff.moto_first", { km: v.motorcycle.included_km }), formatDa(v.motorcycle.base, tf)],
          [t("tariff.per_km"), formatDa(v.motorcycle.per_km, tf)],
          [t("tariff.bike_first", { km: v.bicycle.included_km }), formatDa(v.bicycle.base, tf)],
          [t("tariff.extra_stop"), formatDa(v.extra_stop_fee, tf)],
        ]
      : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-subtext">{t(`fees.${fee.key}.name`)}</p>
        {canEdit && (
          <Button variant="ghost" size="xs" icon="pencil" onClick={onEdit} aria-label={t("actions.edit")} title={t("actions.edit")} />
        )}
      </div>
      {tariff ? (
        <dl className="space-y-1">
          {tariff.map(([k, val]) => (
            <div key={k} className="flex items-baseline justify-between gap-2 text-[13px]">
              <dt className="text-subtext">{k}</dt>
              <dd className="font-bold text-text tabular-nums">{val}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={`${compact ? "text-lg" : "text-2xl"} font-bold leading-none tabular-nums text-text`}>
          {bigValue(fee.key, fee.value, tf)}
        </p>
      )}
      {fee.key === "ride_fare" && v.motorcycle && (
        <p className="text-[12px] text-subtext">
          {t("tariff.ride_sub", { perKm: formatDa(v.motorcycle.per_km, tf), included: v.motorcycle.included_km })}
        </p>
      )}
      <FeeExampleLine feeKey={fee.key} example={fee.example} />
      <div className="mt-auto pt-1">
        <Link href={href} className="inline-block max-w-full">
          {overrides.length === 0 ? (
            <span className="text-[12px] text-subtext">{t("defaults.no_overrides")}</span>
          ) : (
            <Badge variant="primary" className="max-w-full truncate normal-case">
              {overrides.length === 1
                ? overrideShort(overrides[0], locale, tf)
                : t("defaults.active_overrides", { count: overrides.length })}
            </Badge>
          )}
        </Link>
      </div>
    </div>
  );
}
