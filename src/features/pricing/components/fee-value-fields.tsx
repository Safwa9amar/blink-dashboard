"use client";

import { Controller, type Control, type RegisterOptions, type UseFormRegisterReturn } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Toggle, fInput } from "@/components/ui";
import { isNumericUnit, type FieldDef } from "../format";
import type { Tier } from "../types";
import { liveTiers, tierName } from "../zones";
import { useClassName, useVehicleClasses } from "./vehicle-classes-context";

// Unit-aware inputs for one fee value. Rates are typed as percent, amounts in DA; the
// parent converts with formToValue(). Fare objects render as one small group per vehicle.
// bool -> toggle (needs `control`), choice -> select, tier -> select of the live tiers.
export function FeeValueFields({
  fields,
  register,
  control,
  tiers = [],
  prefix = "",
  errors,
  disabled,
}: {
  /** Input definitions from the server catalog (see fieldDefs). */
  fields: FieldDef[];
  /** Form `register` (any form shape); field names are `${prefix}${field.name}`. */
  register: (name: never, options?: RegisterOptions<never, never>) => UseFormRegisterReturn;
  /** Form `control` — required to render `bool` fields as a toggle. */
  control?: Control<never>;
  /** Live tiers for `tier` fields (the field's own `options` win when the server sends them). */
  tiers?: Tier[];
  prefix?: string;
  errors?: Record<string, { message?: string } | undefined>;
  disabled?: boolean;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const className = useClassName();
  const classes = useVehicleClasses();
  // Legs are grouped by vehicle class (catalog names); other fields stay in their own groups.
  const groups: { classCode?: string; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    const last = groups[groups.length - 1];
    if (last && last.classCode === f.classCode) last.fields.push(f);
    else groups.push({ classCode: f.classCode, fields: [f] });
  }

  const unitLabel = (f: FieldDef) =>
    f.unit === "pct"
      ? "%"
      : f.unit === "x"
        ? "×"
        : f.unit === "km"
          ? t("units.km")
          : f.unit === "kmh"
            ? t("units.kmh")
            : f.unit === "min"
              ? t("units.min")
              : t("units.da");

  const label = (f: FieldDef) => (
    <span className="block text-[12px] text-subtext mb-1">
      {t(`fields.${f.label}`)}
      {isNumericUnit(f.unit) && (
        <span className="ms-1 opacity-70">
          ({f.min}–{f.max} {unitLabel(f)})
        </span>
      )}
    </span>
  );
  const fieldError = (f: FieldDef) =>
    errors?.[f.name] && <span className="block text-[11.5px] text-danger mt-1">{errors[f.name]?.message as string}</span>;

  const renderField = (f: FieldDef) => {
    const name = `${prefix}${f.name}`;
    if (f.unit === "bool") {
      return (
        <div key={f.name} className="flex items-center justify-between gap-3 sm:col-span-2 rounded-xl border border-border px-3 py-2.5">
          <span className="text-[13px] text-text">{t(`fields.${f.label}`)}</span>
          {control ? (
            <Controller
              control={control as never}
              name={name as never}
              render={({ field }) => (
                <Toggle
                  on={field.value === "true"}
                  onClick={() => field.onChange(field.value === "true" ? "false" : "true")}
                  label={t(`fields.${f.label}`)}
                  disabled={disabled}
                />
              )}
            />
          ) : (
            <select className={`${fInput} !w-auto`} disabled={disabled} {...register(name as never)}>
              <option value="true">{t("fields.on")}</option>
              <option value="false">{t("fields.off")}</option>
            </select>
          )}
        </div>
      );
    }
    if (f.unit === "choice" || f.unit === "tier") {
      const options =
        f.unit === "tier" && !f.options?.length
          ? liveTiers(tiers).map((x) => ({ value: x.code, text: tierName(tiers, x.code, locale) }))
          : (f.options ?? []).map((o) => ({
              value: o,
              text: f.unit === "tier" ? tierName(tiers, o, locale) : t(`choices.${f.label}.${o}`),
            }));
      return (
        <label key={f.name} className="block">
          {label(f)}
          <select
            className={`${fInput} disabled:opacity-60`}
            disabled={disabled}
            {...register(name as never, { required: t("errors.required") } as never)}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.text}
              </option>
            ))}
          </select>
          {fieldError(f)}
        </label>
      );
    }
    const whole = f.unit === "kmh" || f.unit === "min";
    return (
      <label key={f.name} className="block">
        {label(f)}
        <span className="relative block">
          <input
            type="number"
            inputMode={whole ? "numeric" : "decimal"}
            step={whole ? Math.max(1, f.step) : f.step}
            disabled={disabled}
            className={`${fInput} pe-12 disabled:opacity-60`}
            {...register(
              name as never,
              {
                required: t("errors.number"),
                validate: (v: unknown) => {
                  const n = Number(String(v).replace(",", "."));
                  if (!Number.isFinite(n)) return t("errors.number");
                  // km/h and minutes are whole numbers.
                  if (whole && !Number.isInteger(n)) return t("errors.integer");
                  if (n < f.min || n > f.max) return t("errors.range", { min: f.min, max: f.max });
                  return true;
                },
              } as never,
            )}
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-subtext">{unitLabel(f)}</span>
        </span>
        {fieldError(f)}
      </label>
    );
  };

  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi} className={g.classCode ? "rounded-xl border border-border p-3" : ""}>
          {g.classCode && (
            <p className="text-[12px] font-bold text-text mb-2 flex flex-wrap items-center gap-1.5">
              {className(g.classCode)}
              {classes.find((c) => c.code === g.classCode && !c.enabled) && (
                <span className="text-[10.5px] font-semibold rounded-full bg-warning-light text-warning px-2 py-0.5">{t("vehicles.badge_off")}</span>
              )}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{g.fields.map(renderField)}</div>
        </div>
      ))}
    </div>
  );
}
