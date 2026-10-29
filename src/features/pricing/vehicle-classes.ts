import type { BaseVehicle, ClassService, FareTier, Fee, VehicleClass } from "./types";

// Pure helpers for vehicle classes (spec Addendum 2): which classes serve a service, how a fare
// value splits into per-class legs, and which classes a rider may be given. No UI here.

/** Fields of one fare leg. A path `<class>.<one of these>` is a class field even without `field.class`. */
export const LEG_FIELDS = ["base", "included_km", "per_km", "per_minute", "max_km"] as const;
const LEG_SET: ReadonlySet<string> = new Set(LEG_FIELDS);

/** Classes the app has always had; the fallback when a server sends no `vehicle_classes`. */
export const LEGACY_CLASS_CODES = ["bicycle", "motorcycle"] as const;

/** Legacy services when the catalog has no classes: ride is motorcycle-only, courier has both. */
const LEGACY_SERVICE_CLASSES: Record<ClassService, readonly string[]> = {
  ride: ["motorcycle"],
  courier: ["motorcycle", "bicycle"],
  store: ["motorcycle", "bicycle"],
};

export const CLASS_CODE_RE = /^[a-z][a-z0-9_]{1,23}$/;
export const isClassCode = (v: string) => CLASS_CODE_RE.test(v);

export const liveClasses = (classes: VehicleClass[]) =>
  classes.filter((c) => !c.archived_at).sort((a, b) => a.sort_order - b.sort_order);

/** Live classes that serve `service` (ride / courier / store), in sort order. */
export const classesForService = (classes: VehicleClass[], service: ClassService) =>
  liveClasses(classes).filter((c) => c.services.includes(service));

/** Codes to offer for a service: live classes, or the legacy bicycle / motorcycle on an old server. */
export function classCodesForService(classes: VehicleClass[], service: ClassService): string[] {
  if (!classes.length) return [...LEGACY_SERVICE_CLASSES[service]];
  return classesForService(classes, service).map((c) => c.code);
}

/** Class name in `locale` (en / fr / ar); null when the class is unknown or has no name. */
export function classNameOrNull(classes: VehicleClass[], code: string, locale: string): string | null {
  const c = classes.find((x) => x.code === code);
  if (!c) return null;
  const lang = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  return c.names[lang] || c.names.en || null;
}

export const nextClassOrder = (classes: VehicleClass[]) => classes.reduce((m, c) => Math.max(m, c.sort_order), 0) + 10;

/** Which class a fee field belongs to: the server's `class`, else a `<code>.<leg field>` path. */
export function fieldClass(path: string[], serverClass?: string): string | undefined {
  if (serverClass) return serverClass;
  if (path.length === 2 && LEG_SET.has(path[1])) return path[0];
  return undefined;
}

/** `[code, leg]` for every per-class leg of a fare value (objects with a numeric `base`), in key order. */
export function legsOf(value: unknown): [string, FareTier][] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).filter(
    (e): e is [string, FareTier] => !!e[1] && typeof e[1] === "object" && typeof (e[1] as { base?: unknown }).base === "number",
  );
}

/** Merge a stored override value over the default so a leg the override lacks keeps the default's. */
export function mergeLegs<T>(base: T, over: T): T {
  if (!over || typeof over !== "object" || !base || typeof base !== "object") return (over ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = out[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" ? { ...(b as object), ...(v as object) } : v;
  }
  return out as T;
}

/** The class a rider has when none is assigned: their base vehicle's own class. */
export const defaultClassFor = (vehicleType: BaseVehicle | null): string | null => vehicleType;

/** Classes to offer for a rider: live ones whose base vehicle matches the rider's `vehicle_type`. */
export const classesForRider = (classes: VehicleClass[], vehicleType: BaseVehicle | null) =>
  vehicleType ? liveClasses(classes).filter((c) => c.base_vehicle === vehicleType) : [];

/** Class codes that carry a leg in a fee's catalog fields, grouped in field order. */
export function feeClassCodes(fee: Pick<Fee, "fields"> | null | undefined): string[] {
  const seen: string[] = [];
  for (const f of fee?.fields ?? []) {
    const code = fieldClass(f.path.split("."), f.class);
    if (code && !seen.includes(code)) seen.push(code);
  }
  return seen;
}

/** Comfort-style classes are off until the app can show them; flag the seeded one. */
export const COMFORT_CODE = "motorcycle_comfort";
export const isAppPendingClass = (c: Pick<VehicleClass, "code" | "enabled">) => c.code === COMFORT_CODE && !c.enabled;

/** The class to use for a picker: `value` when offered, else the first offered one ("" when none). */
export const pickVehicle = (codes: string[], value: string | null | undefined): string =>
  value && codes.includes(value) ? value : (codes[0] ?? "");
