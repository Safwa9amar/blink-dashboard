import type { HoursGroup, TFn } from "../types";

// A store's weekly hours, one line per run of days with the same shifts
// ("Sat – Thu  08:00–22:00", "Fri  Closed").
export function OpeningHours({ t, hours }: { t: TFn; hours: HoursGroup[] | null }) {
  if (!hours) return <span className="text-subtext">{t("hours.not_set")}</span>;
  return (
    <ul className="space-y-0.5">
      {hours.map((g) => (
        <li key={g.from} className="flex flex-wrap gap-x-2">
          <span className="text-subtext min-w-[7rem]">
            {g.from === g.to
              ? t(`days.${g.from}`)
              : t("hours.range", { from: t(`days.${g.from}`), to: t(`days.${g.to}`) })}
          </span>
          {g.shifts.length > 0 ? (
            <span className="tabular-nums" dir="ltr">
              {g.shifts.join(", ")}
            </span>
          ) : (
            <span className="text-subtext">{t("hours.closed")}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
