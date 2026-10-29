"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Segmented } from "@/components/ui";
import type { ClassService } from "../types";
import { classCodesForService } from "../vehicle-classes";
import { useClassName, useVehicleClasses } from "./vehicle-classes-context";

/** Class codes offered for a service (live classes, or the legacy pair on a server without classes). */
export function useServiceClassCodes(service: ClassService): string[] {
  const classes = useVehicleClasses();
  return useMemo(() => classCodesForService(classes, service), [classes, service]);
}

/** Segmented picker of the vehicle classes serving `service`; disabled classes carry an "off" tag. */
export function VehiclePicker({
  service,
  value,
  onChange,
  className,
}: {
  service: ClassService;
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  const t = useTranslations("pricing");
  const classes = useVehicleClasses();
  const name = useClassName();
  const codes = useServiceClassCodes(service);
  return (
    <Segmented
      className={`flex-wrap ${className ?? ""}`}
      options={codes.map((c) => [c, classes.find((x) => x.code === c && !x.enabled) ? `${name(c)} (${t("vehicles.off")})` : name(c)] as [string, string])}
      value={value}
      onChange={onChange}
    />
  );
}
