"use client";

import { useId } from "react";
import { Controller, type Control, type RegisterOptions, type UseFormRegisterReturn } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Toggle, fInput } from "@/components/ui";
import { isNumericUnit, type FieldDef } from "../format";
import { fieldHelpKey } from "../help";
import type { Tier } from "../types";
import { liveTiers, tierName } from "../zones";
import { Term, type TermKey } from "./term";
import { useClassName, useVehicleClasses } from "./vehicle-classes-context";

// Inputs whose label deserves a glossary tooltip (keyed by help key).
const FIELD_TERM: Record<string, TermKey> = {
  included_km: "includedkm",
  road_factor: "roadfactor",
  multiplier: "multiplier",
  unzoned_tier: "unzoned",
  only_when_tier_changes: "tier",
};

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

  const uid = useId().replace(/:/g, "");
  const idOf = (f: FieldDef) => `${uid}-${prefix}${f.name}`.replace(/\./g, "_");
  const helpKey = (f: FieldDef) => fieldHelpKey(f.path);
  const fieldName = (f: FieldDef) => t(`fields.${f.label}`);

  // Label text, the glossary "?" when the word is jargon, then the allowed range in the field's unit.
  const labelRow = (f: FieldDef, htmlFor?: string) => {
    const term = FIELD_TERM[helpKey(f)];
    return (
      <span className="mb-1 flex flex-wrap items-center text-[12px] text-subtext">
        {htmlFor ? <label htmlFor={htmlFor}>{fieldName(f)}</label> : <span>{fieldName(f)}</span>}
        {term && <Term term={term} icon />}
        {isNumericUnit(f.unit) && (
          <span className="ms-1 opacity-70">
            ({f.min}–{f.max} {unitLabel(f)})
          </span>
        )}
      </span>
    );
  };
  const help = (f: FieldDef) => {
    const k = `fieldHelp.${helpKey(f)}`;
    return t.has(k as never) ? (
      <span id={`${idOf(f)}-help`} className="mt-1 block text-[11.5px] leading-snug text-subtext">
        {t(k as never)}
      </span>
    ) : null;
  };
  const fieldError = (f: FieldDef) =>
    errors?.[f.name] && (
      <span id={`${idOf(f)}-err`} role="alert" className="mt-1 block text-[11.5px] font-medium text-danger">
        {errors[f.name]?.message as string}
      </span>
    );
  const describedBy = (f: FieldDef) => [t.has(`fieldHelp.${helpKey(f)}` as never) && `${idOf(f)}-help`, errors?.[f.name] && `${idOf(f)}-err`].filter(Boolean).join(" ") || undefined;

  const renderField = (f: FieldDef) => {
    const name = `${prefix}${f.name}`;
    const id = idOf(f);
    if (f.unit === "bool") {
      return (
        <div key={f.name} className="sm:col-span-2 rounded-xl border border-border px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center text-[13px] text-text">
              {fieldName(f)}
              {FIELD_TERM[helpKey(f)] && <Term term={FIELD_TERM[helpKey(f)]} icon />}
            </span>
            {control ? (
              <Controller
                control={control as never}
                name={name as never}
                render={({ field }) => (
                  <Toggle
                    on={field.value === "true"}
                    onClick={() => field.onChange(field.value === "true" ? "false" : "true")}
                    label={fieldName(f)}
                    disabled={disabled}
                  />
                )}
              />
            ) : (
              <select className={`${fInput} !w-auto`} disabled={disabled} aria-label={fieldName(f)} {...register(name as never)}>
                <option value="true">{t("fields.on")}</option>
                <option value="false">{t("fields.off")}</option>
              </select>
            )}
          </div>
          {help(f)}
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
      const optionHelp = f.unit === "choice" ? options.filter((o) => t.has(`choices_help.${f.label}.${o.value}` as never)) : [];
      return (
        <div key={f.name} className={optionHelp.length ? "sm:col-span-2" : undefined}>
          {labelRow(f, id)}
          <select
            id={id}
            className={`${fInput} disabled:opacity-60`}
            disabled={disabled}
            aria-describedby={describedBy(f)}
            aria-invalid={errors?.[f.name] ? true : undefined}
            {...register(name as never, { required: t("errors.required_named", { field: fieldName(f) }) } as never)}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.text}
              </option>
            ))}
          </select>
          {help(f)}
          {optionHelp.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {optionHelp.map((o) => (
                <li key={o.value} className="text-[11.5px] leading-snug text-subtext">
                  <strong className="text-text">{o.text}.</strong> {t(`choices_help.${f.label}.${o.value}` as never)}
                </li>
              ))}
            </ul>
          )}
          {fieldError(f)}
        </div>
      );
    }
    const whole = f.unit === "kmh" || f.unit === "min";
    return (
      <div key={f.name}>
        {labelRow(f, id)}
        <span className="relative block">
          <input
            id={id}
            type="number"
            inputMode={whole ? "numeric" : "decimal"}
            step={whole ? Math.max(1, f.step) : f.step}
            disabled={disabled}
            aria-describedby={describedBy(f)}
            aria-invalid={errors?.[f.name] ? true : undefined}
            className={`${fInput} pe-12 disabled:opacity-60`}
            {...register(
              name as never,
              {
                required: t("errors.number_named", { field: fieldName(f) }),
                validate: (v: unknown) => {
                  const n = Number(String(v).replace(",", "."));
                  if (!Number.isFinite(n)) return t("errors.number_named", { field: fieldName(f) });
                  // km/h and minutes are whole numbers.
                  if (whole && !Number.isInteger(n)) return t("errors.integer_named", { field: fieldName(f) });
                  if (n < f.min || n > f.max) return t("errors.range_named", { field: fieldName(f), min: f.min, max: f.max, unit: unitLabel(f) });
                  return true;
                },
              } as never,
            )}
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-subtext">{unitLabel(f)}</span>
        </span>
        {help(f)}
        {fieldError(f)}
      </div>
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
