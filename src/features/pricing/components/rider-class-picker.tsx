"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, fInput } from "@/components/ui";
import { setRiderVehicleClass } from "@/app/d/pricing/action";
import type { BaseVehicle, VehicleClass } from "../types";
import { classNameOrNull, classesForRider, isAppPendingClass } from "../vehicle-classes";

/**
 * A rider's vehicle class (rider detail screen). Offers only live classes whose base vehicle equals
 * the rider's `vehicle_type`; "default" clears the assignment. Read-only text without `canEdit`.
 */
export function RiderClassPicker({
  userId,
  vehicleType,
  classes,
  current,
  canEdit,
}: {
  userId: string;
  vehicleType: BaseVehicle | null;
  classes: VehicleClass[];
  /** The assigned class code, or null for the default of the base vehicle. */
  current: string | null;
  canEdit: boolean;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const name = (code: string) => classNameOrNull(classes, code, locale) ?? code;
  const options = classesForRider(classes, vehicleType);
  const defaultName = vehicleType ? name(vehicleType) : "—";
  const shown = value || vehicleType || "";
  const shownClass = classes.find((c) => c.code === shown);

  if (!vehicleType) return <span className="text-subtext">{t("rider_class.no_vehicle")}</span>;

  const save = (next: string) => {
    const prev = value;
    setValue(next);
    setMessage(null);
    start(async () => {
      const res = await setRiderVehicleClass(userId, next || null);
      if (!res.ok) {
        setValue(prev);
        return setMessage(res.error);
      }
      router.refresh();
    });
  };

  if (!canEdit) {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
        {name(shown)}
        {!value && <Badge>{t("rider_class.default")}</Badge>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 min-w-0">
      <select
        className={`${fInput} !w-auto max-w-full`}
        value={value}
        disabled={pending}
        onChange={(e) => save(e.target.value)}
        aria-label={t("rider_class.label")}
      >
        <option value="">{t("rider_class.default_option", { name: defaultName })}</option>
        {/* An assigned class that is no longer offered (archived) stays visible until changed. */}
        {value && !options.some((c) => c.code === value) && <option value={value}>{name(value)}</option>}
        {options
          // The default class is the "default" option; only list extra classes.
          .filter((c) => c.code !== vehicleType)
          .map((c) => (
            <option key={c.code} value={c.code}>
              {name(c.code)}
              {c.enabled ? "" : ` (${t("vehicles.off")})`}
            </option>
          ))}
      </select>
      {shownClass && isAppPendingClass(shownClass) && <span className="text-[11.5px] font-normal text-warning">{t("rider_class.pending_note")}</span>}
      {message && <span role="alert" className="text-[11.5px] font-normal text-danger">{message}</span>}
    </div>
  );
}
