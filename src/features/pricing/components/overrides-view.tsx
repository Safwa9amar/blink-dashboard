"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, EmptyState, FilterPills, Modal, Segmented, fInput, type Column } from "@/components/ui";
import { archiveOverride } from "@/app/d/pricing/action";
import { STATUS_FILTERS, filterByStatus, statusCounts, type StatusFilter } from "../cockpit";
import { formatValueInline, formatValueShort } from "../format";
import { PRICING_KEYS, type Fee, type Override, type OverrideStatus, type TFn, type Tier, type Zone } from "../types";
import { WILAYA_OPTIONS } from "../wilayas";
import { liveTiers, liveZones, tierName } from "../zones";
import { ExtendMenu } from "./extend-menu";
import { OverrideCalendar } from "./override-calendar";
import { useClassName } from "./vehicle-classes-context";
import { OverrideWizard } from "./override-wizard";
import { ScopeChips } from "./scope-chips";

export const STATUS_VARIANT: Record<OverrideStatus, "success" | "info" | "default" | "danger"> = {
  active: "success",
  scheduled: "info",
  ended: "default",
  archived: "danger",
};

export function formatWindow(o: Pick<Override, "starts_at" | "ends_at">, locale: string, t: TFn): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ar" ? "ar-DZ-u-nu-latn" : locale, {
      timeZone: "Africa/Algiers",
      dateStyle: "medium",
      timeStyle: "short",
    });
  if (!o.starts_at && !o.ends_at) return t("overrides.always");
  if (o.starts_at && !o.ends_at) return t("overrides.from", { date: fmt(o.starts_at) });
  if (!o.starts_at && o.ends_at) return t("overrides.until", { date: fmt(o.ends_at) });
  return `${fmt(o.starts_at!)} → ${fmt(o.ends_at!)}`;
}

export function OverridesView({
  overrides,
  fees,
  canEdit,
  error,
  highlight,
  nowIso,
  zones = [],
  tiers = [],
}: {
  overrides: Override[];
  fees: Fee[];
  canEdit: boolean;
  error?: string;
  highlight?: string;
  nowIso: string;
  zones?: Zone[];
  tiers?: Tier[];
}) {
  const t = useTranslations("pricing");
  const className = useClassName();
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [editing, setEditing] = useState<Override | null>(null);
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState<Override | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const rawStatus = params.get("status") as StatusFilter | null;
  const status: StatusFilter = rawStatus && STATUS_FILTERS.includes(rawStatus) ? rawStatus : "all";
  const view = params.get("view") === "calendar" ? "calendar" : "table";

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("highlight");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };

  const counts = useMemo(() => statusCounts(overrides, now), [overrides, now]);
  const visible = useMemo(() => filterByStatus(overrides, status, now), [overrides, status, now]);
  const rows = highlight ? [...visible].sort((a, b) => Number(b.id === highlight) - Number(a.id === highlight)) : visible;

  const partnerFilter = params.get("merchant_id") || params.get("agent_id");
  const partnerName = overrides.find((o) => o.merchant_id === partnerFilter || o.agent_id === partnerFilter)?.partner_name;

  const zoneLabel = (id: string | null | undefined) => (id ? (zones.find((z) => z.id === id)?.name ?? t("scope.zone_generic")) : null);
  const tierLabel = (code: string | null | undefined) => (code ? tierName(tiers, code, locale) : null);

  const columns: Column<Override>[] = [
    {
      key: "key",
      label: t("overrides.col.fee"),
      render: (o) => <span className="font-semibold text-text">{t(`fees.${o.key}.name`)}</span>,
    },
    {
      key: "scope",
      label: t("overrides.col.scope"),
      sortable: false,
      render: (o) => (
        <ScopeChips
          service={o.service}
          wilaya_code={o.wilaya_code}
          zone={zoneLabel(o.zone_id)}
          tier={tierLabel(o.tier)}
          partner={o.merchant_id || o.agent_id ? (o.partner_name ?? o.merchant_id ?? o.agent_id) : null}
        />
      ),
    },
    {
      key: "value",
      label: t("overrides.col.value"),
      sortable: false,
      render: (o) => (
        <span className="text-sm text-text" title={formatValueInline(o.key, o.value, tf, className)}>
          {formatValueShort(o.key, o.value, tf, className)}
        </span>
      ),
    },
    {
      key: "window",
      label: t("overrides.col.window"),
      sortable: false,
      render: (o) => <span className="text-xs text-subtext">{formatWindow(o, locale, tf)}</span>,
    },
    {
      key: "status",
      label: t("overrides.col.status"),
      render: (o) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={STATUS_VARIANT[o.status]}>{t(`status.${o.status}`)}</Badge>
          {o.status === "active" && filterByStatus([o], "ending_soon", now).length > 0 && (
            <Badge variant="warning">{t(`status.ending_soon`)}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "note",
      label: t("overrides.col.note"),
      sortable: false,
      render: (o) => <span className="text-xs text-subtext line-clamp-2 max-w-[220px]">{o.note || "—"}</span>,
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            label: "",
            sortable: false,
            render: (o: Override) =>
              o.status === "active" || o.status === "scheduled" ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <Button variant="secondary" size="xs" icon="pencil" onClick={() => setEditing(o)}>
                    {t("actions.edit")}
                  </Button>
                  <ExtendMenu override={o} />
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setArchiveError(null);
                      setArchiving(o);
                    }}
                    className="hover:!text-danger"
                  >
                    {t("actions.archive")}
                  </Button>
                </div>
              ) : null,
          } as Column<Override>,
        ]
      : []),
  ];

  const sel = (name: string, value: string | null, options: { value: string; label: string }[], all: string) => (
    <select className={`${fInput} !w-auto min-w-[150px]`} value={value ?? ""} onChange={(e) => setParam(name, e.target.value)}>
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <FilterPills
        options={STATUS_FILTERS.map((s) => [s, `${t(`status.${s}`)} ${counts[s]}`] as [StatusFilter, string])}
        value={status}
        onChange={(v) => setParam("status", v === "all" ? "" : v)}
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {sel("key", params.get("key"), PRICING_KEYS.map((k) => ({ value: k, label: t(`fees.${k}.name`) })), t("overrides.filter.all_fees"))}
        {sel(
          "wilaya_code",
          params.get("wilaya_code"),
          WILAYA_OPTIONS.map((w) => ({ value: w.code, label: `${w.code} · ${locale === "ar" ? w.name_ar : w.name}` })),
          t("overrides.filter.all_wilayas"),
        )}
        {sel(
          "zone_id",
          params.get("zone_id"),
          liveZones(zones).map((z) => ({ value: z.id, label: z.name })),
          t("overrides.filter.all_zones"),
        )}
        {sel(
          "tier",
          params.get("tier"),
          liveTiers(tiers).map((x) => ({ value: x.code, label: tierName(tiers, x.code, locale) })),
          t("overrides.filter.all_tiers"),
        )}
        {partnerFilter && (
          <button
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              next.delete("merchant_id");
              next.delete("agent_id");
              router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
            }}
            className="cursor-pointer"
          >
            <Badge variant="warning">{partnerName ?? t("overrides.filter.partner")} ✕</Badge>
          </button>
        )}
        <div className="flex-1" />
        <Segmented
          options={[
            ["table", t("overrides.view.table")],
            ["calendar", t("overrides.view.calendar")],
          ]}
          value={view}
          onChange={(v) => setParam("view", v === "table" ? "" : v)}
        />
        {canEdit && (
          <Button size="sm" icon="plus" onClick={() => setCreating(true)}>
            {t("overrides.new")}
          </Button>
        )}
      </div>

      {highlight && rows[0]?.id === highlight && <p className="text-xs text-primary mb-2">{t("overrides.highlighted")}</p>}

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title={t("overrides.empty")}
          description={t("overrides.empty_hint")}
          actionLabel={canEdit ? t("overrides.new") : undefined}
          onAction={canEdit ? () => setCreating(true) : undefined}
        />
      ) : view === "calendar" ? (
        <OverrideCalendar overrides={rows} nowIso={nowIso} onSelect={canEdit ? setEditing : undefined} />
      ) : (
        <DataTable columns={columns} data={rows} emptyMessage={t("overrides.empty")} />
      )}

      {canEdit && (
        <>
          <OverrideWizard
            open={creating}
            onClose={() => setCreating(false)}
            fees={fees}
            zones={zones}
            tiers={tiers}
            initialKey={(params.get("key") as Override["key"]) || undefined}
            onSaved={() => router.refresh()}
          />
          <OverrideWizard
            open={!!editing}
            onClose={() => setEditing(null)}
            fees={fees}
            zones={zones}
            tiers={tiers}
            override={editing}
            onSaved={() => router.refresh()}
          />
          <Modal open={!!archiving} onClose={() => setArchiving(null)} title={t("archive.title")}>
            <p className="text-sm text-subtext mb-4">
              {t("archive.body", { fee: archiving ? t(`fees.${archiving.key}.name`) : "" })}
            </p>
            {archiveError && <p className="text-sm text-danger mb-3">{archiveError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setArchiving(null)} disabled={pending}>
                {t("actions.cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const res = await archiveOverride(archiving!.id);
                    if (!res.ok) return setArchiveError(res.error);
                    setArchiving(null);
                    router.refresh();
                  })
                }
              >
                {t("actions.archive")}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
