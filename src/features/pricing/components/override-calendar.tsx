"use client";

import { useLocale, useTranslations } from "next-intl";
import { calendarLayout, type CalendarBar, type CalendarTone } from "../cockpit";
import { formatValueShort } from "../format";
import { intlLocale, scopeShort } from "../labels";
import type { Override, TFn } from "../types";
import { useMemo } from "react";

const TONE: Record<CalendarTone, { solid: string; fade: string }> = {
  active: { solid: "bg-primary text-white", fade: "bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary/10 text-white" },
  scheduled: { solid: "bg-info text-white", fade: "bg-linear-to-r rtl:bg-linear-to-l from-info to-info/10 text-white" },
  ended: { solid: "bg-muted text-subtext", fade: "bg-linear-to-r rtl:bg-linear-to-l from-muted to-transparent text-subtext" },
};

// Gantt-style lanes: one per override, months on top, dashed "Today" line. Layout is pure (calendarLayout).
export function OverrideCalendar({
  overrides,
  nowIso,
  onSelect,
}: {
  overrides: Override[];
  nowIso: string;
  onSelect?: (o: Override) => void;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const layout = useMemo(() => calendarLayout(overrides, now), [overrides, now]);
  const monthLabel = (year: number, month: number) =>
    new Date(Date.UTC(year, month, 15)).toLocaleDateString(intlLocale(locale), { month: "short", year: "2-digit", timeZone: "UTC" });
  const barStyle = (b: CalendarBar) => ({ insetInlineStart: `${b.leftPct}%`, width: `${b.widthPct}%` });

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <div className="min-w-[640px] p-3">
        <div className="flex">
          <div className="w-40 sm:w-52 shrink-0" />
          <div className="relative flex-1 h-6">
            {layout.months.map((m) => (
              <span
                key={m.key}
                className="absolute top-0 text-[11px] font-semibold text-subtext border-s border-border ps-1.5 truncate"
                style={{ insetInlineStart: `${m.leftPct}%`, width: `${m.widthPct}%` }}
              >
                {monthLabel(m.year, m.month)}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          {layout.bars.map((b) => {
            const o = b.override;
            const tone = TONE[b.tone];
            const clickable = !!onSelect && (o.status === "active" || o.status === "scheduled");
            return (
              <div key={o.id} className="flex items-center border-t border-border">
                <div className="w-40 sm:w-52 shrink-0 pe-3 py-2 min-w-0">
                  <p className="text-[12.5px] font-semibold text-text truncate">{t(`fees.${o.key}.name`)}</p>
                  <p className="text-[11.5px] text-subtext truncate">{scopeShort(o, locale, tf)}</p>
                </div>
                <div className="relative flex-1 h-9">
                  <button
                    type="button"
                    onClick={() => onSelect?.(o)}
                    disabled={!clickable}
                    title={`${formatValueShort(o.key, o.value, tf)} · ${t(`status.${o.status}`)}`}
                    style={barStyle(b)}
                    className={`absolute top-1.5 h-6 px-2 flex items-center text-[11px] font-semibold overflow-hidden whitespace-nowrap ${
                      b.openEnd ? tone.fade : tone.solid
                    } ${b.openStart ? "rounded-e-md" : b.openEnd ? "rounded-s-md" : "rounded-md"} ${clickable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {formatValueShort(o.key, o.value, tf)}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="absolute inset-y-0 start-40 sm:start-52 end-0 pointer-events-none">
            <div
              className="absolute inset-y-0 border-s border-dashed border-primary"
              style={{ insetInlineStart: `${layout.todayPct}%` }}
            >
              <span className="absolute -top-5 -translate-x-1/2 rtl:translate-x-1/2 rounded bg-primary px-1.5 text-[10px] font-bold text-white">
                {t("overrides.today")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-[11.5px] text-subtext">
          {(["active", "scheduled", "ended"] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${TONE[k].solid.split(" ")[0]}`} />
              {t(`status.${k}`)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
