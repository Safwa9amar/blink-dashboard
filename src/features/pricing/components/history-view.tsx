"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, fInput } from "@/components/ui";
import { formatValueInline } from "../format";
import { fmtTime, intlLocale } from "../labels";
import { useClassName } from "./vehicle-classes-context";
import { PRICING_KEYS, type Change, type ChangeAction, type EntitySnapshot, type FeeValue, type PricingKey, type TFn } from "../types";

export const HISTORY_STEPS = [50, 100, 200] as const;

const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 10);
const ACTION_VARIANT: Record<ChangeAction, "info" | "success" | "warning" | "danger"> = {
  update_default: "info",
  create_override: "success",
  update_override: "warning",
  archive_override: "danger",
  create_zone: "success",
  update_zone: "warning",
  archive_zone: "danger",
  create_tier: "success",
  update_tier: "warning",
  archive_tier: "danger",
  create_vehicle_class: "success",
  update_vehicle_class: "warning",
  archive_vehicle_class: "danger",
};

type EntityKey = "pricing_zone" | "pricing_tier" | "vehicle_class";
const isEntityKey = (k: Change["key"]): k is EntityKey => k === "pricing_zone" || k === "pricing_tier" || k === "vehicle_class";

/** "Downtown Oran · Urban" / "Rural (#D97706)" — a zone or tier row snapshot on one line. */
function snapshotLine(key: EntityKey, snap: EntitySnapshot | FeeValue | null): string {
  if (!snap) return "—";
  const row = snap as EntitySnapshot;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  if (key === "pricing_zone") return [str(row.name), str(row.tier)].filter(Boolean).join(" · ") || "—";
  if (key === "vehicle_class") {
    const n = row.names as { en?: string } | undefined;
    const state = typeof row.enabled === "boolean" ? (row.enabled ? "on" : "off") : null;
    return [str(n?.en) ?? str(row.code), str(row.base_vehicle), state].filter(Boolean).join(" · ") || "—";
  }
  const names = row.names as { en?: string } | undefined;
  return [str(names?.en) ?? str(row.code), str(row.color)].filter(Boolean).join(" · ") || "—";
}

export function HistoryView({ changes, error, limit }: { changes: Change[]; error?: string; limit: number }) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const className = useClassName();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const actor = params.get("actor") ?? "";

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };

  const actors = useMemo(() => [...new Set(changes.map((c) => c.actor_name).filter(Boolean) as string[])].sort(), [changes]);
  const shown = actor ? changes.filter((c) => c.actor_name === actor) : changes;
  const days = useMemo(() => {
    const map = new Map<string, Change[]>();
    for (const c of shown) map.set(dayKey(c.created_at), [...(map.get(dayKey(c.created_at)) ?? []), c]);
    return [...map.entries()];
  }, [shown]);

  const nextLimit = HISTORY_STEPS.find((s) => s > limit);
  const canMore = !!nextLimit && changes.length >= limit;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select className={`${fInput} !w-auto min-w-[200px]`} value={params.get("key") ?? ""} onChange={(e) => setParam("key", e.target.value)}>
          <option value="">{t("overrides.filter.all_fees")}</option>
          {PRICING_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(`fees.${k}.name`)}
            </option>
          ))}
        </select>
        <select className={`${fInput} !w-auto min-w-[180px]`} value={actor} onChange={(e) => setParam("actor", e.target.value)}>
          <option value="">{t("history.all_actors")}</option>
          {actors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : shown.length === 0 ? (
        <EmptyState title={t("history.empty")} />
      ) : (
        <div className="space-y-6">
          {days.map(([day, list]) => (
            <section key={day}>
              <h3 className="text-[12px] font-bold text-subtext uppercase tracking-wide mb-2">
                {new Date(`${day}T12:00:00Z`).toLocaleDateString(intlLocale(locale), {
                  timeZone: "UTC",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <ol className="border-s border-border ms-1.5 space-y-3">
                {list.map((c) => (
                  <li key={c.id} className="relative ps-5">
                    <span className="absolute -start-[5px] top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="rounded-xl border border-border bg-card px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[13px] font-semibold text-text">{c.actor_name || "—"}</span>
                        <Badge variant={ACTION_VARIANT[c.action]}>{t(`history.action.${c.action}`)}</Badge>
                        <span className="text-[13px] font-semibold text-text">
                          {isEntityKey(c.key) ? t(`history.entity.${c.key}`) : t(`fees.${c.key}.name`)}
                        </span>
                        <span className="text-xs text-subtext ms-auto">{fmtTime(c.created_at, locale)}</span>
                      </div>
                      <p className="text-sm mt-1.5">
                        <span className="text-subtext">
                          {isEntityKey(c.key)
                            ? snapshotLine(c.key, c.before)
                            : c.before
                              ? formatValueInline(c.key as PricingKey, c.before as FeeValue, tf, className)
                              : "—"}
                        </span>
                        <span className="mx-1.5 text-subtext rtl:inline-block rtl:rotate-180">→</span>
                        <span className="text-text font-semibold">
                          {isEntityKey(c.key)
                            ? snapshotLine(c.key, c.after)
                            : c.after
                              ? formatValueInline(c.key as PricingKey, c.after as FeeValue, tf, className)
                              : "—"}
                        </span>
                      </p>
                      {isEntityKey(c.key) && (
                        <Link
                          href={c.key === "vehicle_class" ? "/pricing/vehicles" : "/pricing/zones"}
                          className="inline-block mt-1.5 text-xs font-semibold text-primary"
                        >
                          {c.key === "vehicle_class" ? t("history.open_vehicles") : t("history.open_zones")}
                        </Link>
                      )}
                      {c.override_id && (
                        <Link
                          href={`/pricing/overrides?key=${c.key}&highlight=${c.override_id}`}
                          className="inline-block mt-1.5 text-xs font-semibold text-primary"
                        >
                          {t("history.open_override")}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {canMore && (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" onClick={() => setParam("limit", String(nextLimit))}>
                {t("history.load_more")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
