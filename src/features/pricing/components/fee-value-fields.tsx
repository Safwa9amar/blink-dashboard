"use client";

import type { RegisterOptions, UseFormRegisterReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { fInput } from "@/components/ui";
import type { FieldDef } from "../format";

// Unit-aware inputs for one fee value. Rates are typed as percent, amounts in DA; the
// parent converts with formToValue(). Fare objects render as one small group per vehicle.
export function FeeValueFields({
  fields,
  register,
  prefix = "",
  errors,
  disabled,
}: {
  /** Input definitions from the server catalog (see fieldDefs). */
  fields: FieldDef[];
  /** Form `register` (any form shape); field names are `${prefix}${field.name}`. */
  register: (name: never, options?: RegisterOptions<never, never>) => UseFormRegisterReturn;
  prefix?: string;
  errors?: Record<string, { message?: string } | undefined>;
  disabled?: boolean;
}) {
  const t = useTranslations("pricing");
  const groups: { vehicle?: "bicycle" | "motorcycle"; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    const last = groups[groups.length - 1];
    if (last && last.vehicle === f.vehicle) last.fields.push(f);
    else groups.push({ vehicle: f.vehicle, fields: [f] });
  }

  const unitLabel = (f: FieldDef) =>
    f.unit === "pct" ? "%" : f.unit === "x" ? "×" : f.unit === "km" ? t("units.km") : t("units.da");

  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi} className={g.vehicle ? "rounded-xl border border-border p-3" : ""}>
          {g.vehicle && <p className="text-[12px] font-bold text-text mb-2">{t(`vehicle.${g.vehicle}`)}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {g.fields.map((f) => (
              <label key={f.name} className="block">
                <span className="block text-[12px] text-subtext mb-1">
                  {t(`fields.${f.label}`)}
                  <span className="ms-1 opacity-70">
                    ({f.min}–{f.max} {unitLabel(f)})
                  </span>
                </span>
                <span className="relative block">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={f.step}
                    disabled={disabled}
                    className={`${fInput} pe-12 disabled:opacity-60`}
                    {...register(
                      `${prefix}${f.name}` as never,
                      {
                        required: t("errors.number"),
                        validate: (v: unknown) => {
                          const n = Number(String(v).replace(",", "."));
                          if (!Number.isFinite(n)) return t("errors.number");
                          if (n < f.min || n > f.max)
                            return t("errors.range", {
                              min: f.min,
                              max: f.max,
                            });
                          return true;
                        },
                      } as never,
                    )}
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-subtext">
                    {unitLabel(f)}
                  </span>
                </span>
                {errors?.[f.name] && (
                  <span className="block text-[11.5px] text-danger mt-1">{errors[f.name]?.message as string}</span>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
