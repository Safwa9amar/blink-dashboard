"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, fInput } from "@/components/ui";
import { formatValueInline } from "../format";
import { fmtTime, intlLocale } from "../labels";
import { PRICING_KEYS, type Change, type TFn } from "../types";

export const HISTORY_STEPS = [50, 100, 200] as const;

const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 10);
const ACTION_VARIANT = {
  update_default: "info",
  create_override: "success",
  update_override: "warning",
  archive_override: "danger",
} as const;

export function HistoryView({ changes, error, limit }: { changes: Change[]; error?: string; limit: number }) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
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
                        <span className="text-[13px] font-semibold text-text">{t(`fees.${c.key}.name`)}</span>
                        <span className="text-xs text-subtext ms-auto">{fmtTime(c.created_at, locale)}</span>
                      </div>
                      <p className="text-sm mt-1.5">
                        <span className="text-subtext">{c.before ? formatValueInline(c.key, c.before, tf) : "—"}</span>
                        <span className="mx-1.5 text-subtext rtl:inline-block rtl:rotate-180">→</span>
                        <span className="text-text font-semibold">{c.after ? formatValueInline(c.key, c.after, tf) : "—"}</span>
                      </p>
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
