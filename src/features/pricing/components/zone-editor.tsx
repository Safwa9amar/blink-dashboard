"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, FormRow, fInput } from "@/components/ui";
import { createZone, updateZone } from "@/app/d/pricing/action";
import { formatValueShort } from "../format";
import type { Fee, Override, TFn, Tier, Zone, ZoneGeometry } from "../types";
import { canPriceZone, liveTiers, formatArea, tierName, zoneLiveOverrides, zonePriceFees } from "../zones";
import { useClassName } from "./vehicle-classes-context";

interface ZoneForm {
  name: string;
  tier: string;
  priority: string;
  note: string;
}

/**
 * Side panel to create (a freshly drawn polygon) or edit a zone: name, tier, priority, note, plus
 * its read-only area and override count. `geometry` carries unsaved vertex edits / the new polygon.
 */
export function ZoneEditor({
  zone,
  geometry,
  tiers,
  readOnly,
  fees = [],
  overrides = [],
  onSetPrices,
  onEditOverride,
  onClose,
  onSaved,
  onArchive,
}: {
  zone?: Zone;
  geometry?: ZoneGeometry | null;
  tiers: Tier[];
  readOnly?: boolean;
  /** Catalog + overrides of the page: power the "set prices" button and the zone's price list. */
  fees?: Fee[];
  overrides?: Override[];
  onSetPrices?: (zone: Zone) => void;
  onEditOverride?: (override: Override) => void;
  onClose: () => void;
  onSaved: () => void;
  onArchive?: (zone: Zone) => void;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const tf = t as unknown as TFn;
  const className = useClassName();
  const zoneOverrides = useMemo(() => (zone ? zoneLiveOverrides(overrides, zone.id) : []), [overrides, zone]);
  const showPrices = !!zone && canPriceZone(zone) && !readOnly && !!onSetPrices && zonePriceFees(fees).length > 0;
  const choices = liveTiers(tiers);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ZoneForm>({
    defaultValues: {
      name: zone?.name ?? "",
      tier: zone?.tier ?? choices[choices.length - 1]?.code ?? "",
      priority: String(zone?.priority ?? 0),
      note: zone?.note ?? "",
    },
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = handleSubmit((form) => {
    const priority = Math.round(Number(form.priority.replace(",", ".")));
    const note = form.note.trim() || null;
    setMessage(null);
    start(async () => {
      let res;
      if (zone) {
        res = await updateZone(zone.id, {
          ...(form.name.trim() !== zone.name ? { name: form.name.trim() } : {}),
          ...(form.tier !== zone.tier ? { tier: form.tier } : {}),
          ...(priority !== zone.priority ? { priority } : {}),
          ...(note !== zone.note ? { note } : {}),
          ...(geometry ? { geometry } : {}),
          expected_updated_at: zone.updated_at,
        });
      } else {
        if (!geometry) return;
        res = await createZone({ name: form.name.trim(), tier: form.tier, geometry, priority, note });
      }
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      onSaved();
    });
  });

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">{zone ? t("zones.edit_title") : t("zones.new_title")}</h3>
        <Button type="button" variant="ghost" size="xs" onClick={onClose} disabled={pending}>
          {t("actions.close")}
        </Button>
      </div>
      {!zone && <p className="text-[12px] text-subtext">{t("zones.new_hint")}</p>}
      {zone && geometry && <p className="text-[12px] text-warning">{t("zones.shape_changed")}</p>}

      <FormRow label={t("zones.name")}>
        <input
          className={fInput}
          maxLength={80}
          disabled={readOnly || pending}
          {...register("name", { required: t("errors.required"), maxLength: 80, validate: (v) => v.trim().length > 0 || t("errors.required") })}
        />
        {errors.name && <span className="block text-[11.5px] text-danger mt-1">{errors.name.message}</span>}
      </FormRow>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label={t("zones.tier")}>
          <select className={fInput} disabled={readOnly || pending} {...register("tier", { required: true })}>
            {choices.map((x) => (
              <option key={x.code} value={x.code}>
                {tierName(tiers, x.code, locale)}
              </option>
            ))}
            {/* An archived tier a zone still points at stays visible. */}
            {zone && !choices.some((x) => x.code === zone.tier) && <option value={zone.tier}>{tierName(tiers, zone.tier, locale)}</option>}
          </select>
        </FormRow>
        <FormRow label={t("zones.priority")}>
          <input
            type="number"
            step={1}
            className={fInput}
            disabled={readOnly || pending}
            {...register("priority", {
              validate: (v) => Number.isInteger(Number(v)) || t("errors.integer"),
            })}
          />
          {errors.priority && <span className="block text-[11.5px] text-danger mt-1">{errors.priority.message}</span>}
        </FormRow>
      </div>
      <p className="text-[11.5px] text-subtext -mt-1">{t("zones.priority_hint")}</p>
      <FormRow label={t("modal.note")}>
        <textarea className={`${fInput} min-h-[56px]`} maxLength={300} disabled={readOnly || pending} {...register("note")} />
      </FormRow>

      {zone && (
        <dl className="grid grid-cols-2 gap-3 text-[12.5px]">
          <div>
            <dt className="text-subtext">{t("zones.area")}</dt>
            <dd className="font-semibold text-text tabular-nums">{t("zones.area_value", { km2: formatArea(zone.area_km2) })}</dd>
          </div>
          <div>
            <dt className="text-subtext">{t("zones.overrides")}</dt>
            <dd className="font-semibold">
              {zone.override_count > 0 ? (
                <Link href={`/pricing/overrides?zone_id=${zone.id}`} className="text-primary">
                  {zone.override_count}
                </Link>
              ) : (
                <span className="text-text">0</span>
              )}
            </dd>
          </div>
        </dl>
      )}

      {zone && canPriceZone(zone) && (
        <section className="rounded-lg border border-border p-3 space-y-2" aria-label={t("zones.prices.title")}>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[12.5px] font-semibold text-text">{t("zones.prices.title")}</h4>
            {showPrices && (
              <Button type="button" size="xs" icon="plus" onClick={() => onSetPrices(zone)} disabled={pending}>
                {t("zones.prices.set")}
              </Button>
            )}
          </div>
          {zoneOverrides.length === 0 ? (
            <p className="text-[12px] text-subtext">{t("zones.prices.none")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {zoneOverrides.map((o) => (
                <li key={o.id} className="flex items-center gap-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-text truncate">
                      {t(`fees.${o.key}.name`)}
                      {o.service && <span className="ms-1.5 font-normal text-subtext">· {t(`services.${o.service}`)}</span>}
                    </p>
                    <p className="text-[12px] text-subtext truncate">{formatValueShort(o.key, o.value, tf, className)}</p>
                  </div>
                  {o.status === "scheduled" && <Badge variant="info">{t("status.scheduled")}</Badge>}
                  {!readOnly && onEditOverride && (
                    <Button type="button" variant="ghost" size="xs" onClick={() => onEditOverride(o)} disabled={pending}>
                      {t("actions.edit")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {message && <p className="text-sm text-danger">{message}</p>}
      {!readOnly && (
        <div className="flex items-center justify-between gap-2">
          <div>
            {zone && onArchive && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onArchive(zone)} disabled={pending} className="hover:!text-danger">
                {t("actions.archive")}
              </Button>
            )}
          </div>
          <Button type="submit" size="sm" loading={pending}>
            {zone ? t("actions.save") : t("actions.create")}
          </Button>
        </div>
      )}
    </form>
  );
}
