"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ClassNamer } from "../format";
import type { TFn, VehicleClass } from "../types";
import { classNameOrNull } from "../vehicle-classes";

// The catalog's vehicle classes, provided once by the /pricing layout so every editor, matrix and
// simulator can name a class and list the classes of a service. Outside the provider (an old
// server, a page that did not load them) the list is empty and the legacy bicycle / motorcycle apply.
const Ctx = createContext<VehicleClass[]>([]);

export function VehicleClassesProvider({ classes, children }: { classes: VehicleClass[]; children: ReactNode }) {
  return <Ctx.Provider value={classes}>{children}</Ctx.Provider>;
}

export const useVehicleClasses = () => useContext(Ctx);

/** code -> display name in the active language; the two legacy classes are translated, unknown codes show as-is. */
export function useClassName(): ClassNamer {
  const classes = useVehicleClasses();
  const locale = useLocale();
  const t = useTranslations("pricing") as unknown as TFn;
  return useCallback(
    (code: string) => classNameOrNull(classes, code, locale) ?? (code === "bicycle" || code === "motorcycle" ? t(`vehicle.${code}`) : code),
    [classes, locale, t],
  );
}
