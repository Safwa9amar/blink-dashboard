import type { Stop } from "../detail";

/**
 * One stop of a route list. The dot matches the route map's marker colours (pickup =
 * primary, drop-off = warning). Copy comes in pre-translated so it works for orders and trips.
 */
export function StopItem({ kind, title, stop, doneText }: { kind: "pickup" | "dropoff"; title: string; stop: Stop; doneText?: string | null }) {
  const showAddress = stop.address && stop.address !== stop.label;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span aria-hidden className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-card ${kind === "pickup" ? "bg-primary" : "bg-warning"}`} />
      <div className="min-w-0 text-[13px]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtext">{title}</p>
        <p className="font-medium text-text break-words">{stop.label || stop.address || "—"}</p>
        {showAddress && <p className="text-subtext break-words">{stop.address}</p>}
        {(stop.contactName || stop.contactPhone) && (
          <p className="text-subtext">
            {stop.contactName}
            {stop.contactName && stop.contactPhone && " · "}
            {stop.contactPhone && (
              <a href={`tel:${stop.contactPhone}`} dir="ltr" className="hover:text-text">
                {stop.contactPhone}
              </a>
            )}
          </p>
        )}
        {stop.note && <p className="text-subtext italic break-words">“{stop.note}”</p>}
        {doneText && <p className="text-xs text-success">{doneText}</p>}
      </div>
    </li>
  );
}
