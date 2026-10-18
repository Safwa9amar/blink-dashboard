"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, fInput } from "@/components/ui";
import { updateOverride } from "@/app/d/pricing/action";
import { addDays, endOfDayIso } from "../cockpit";
import type { Override } from "../types";

const PANEL_H = 230;

// Extend = PATCH the override with only `ends_at`. +7 / +30 days from the current end, or a picked date.
export function ExtendMenu({
  override,
  size = "xs",
  onDone,
}: {
  override: Override;
  size?: "xs" | "sm";
  onDone?: () => void;
}) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  // The panel is portaled to <body> (the table's overflow-x-auto would clip it), so position it
  // from the trigger: flip up near the viewport bottom, align to the trigger's end edge (RTL-aware).
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === "rtl";
    const flip = window.innerHeight - r.bottom < PANEL_H && r.top > window.innerHeight - r.bottom;
    setPos({
      ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      ...(rtl ? { left: Math.max(8, r.left) } : { right: Math.max(8, window.innerWidth - r.right) }),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!triggerRef.current?.contains(n) && !panelRef.current?.contains(n)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!override.ends_at) return null;

  const apply = (endsAt: string) => {
    setError(null);
    start(async () => {
      const res = await updateOverride(override.id, { ends_at: endsAt });
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
      onDone?.();
    });
  };

  // Compare instants, not ISO strings (offsets / fractional seconds differ).
  const pickedIso = date ? endOfDayIso(date) : null;
  const pickLater = !!pickedIso && Date.parse(pickedIso) > Date.parse(override.ends_at);
  const pick = pickLater ? pickedIso : null;

  return (
    <div className="inline-block" ref={triggerRef}>
      <Button type="button" variant="secondary" size={size} loading={pending} icon="clock" onClick={() => setOpen((v) => !v)}>
        {t("extend.label")}
      </Button>
      {open &&
        pos &&
        createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", ...pos }}
          className="z-[1000] w-56 rounded-xl border border-border bg-card shadow-lg p-1.5"
        >
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              disabled={pending}
              onClick={() => apply(addDays(override.ends_at!, d))}
              className="w-full text-start px-3 py-2 rounded-lg text-[13px] text-text hover:bg-card-hover cursor-pointer"
            >
              {t("extend.days", { count: d })}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-border mt-1">
            <p className="text-[12px] text-subtext mb-1">{t("extend.pick")}</p>
            <input type="date" className={fInput} value={date} onChange={(e) => setDate(e.target.value)} />
            {date && !pickLater && <p className="mt-1 text-[12px] text-danger">{t("extend.later")}</p>}
            <Button type="button" size="xs" className="mt-2 w-full" disabled={!pick} loading={pending} onClick={() => pick && apply(pick)}>
              {t("extend.apply")}
            </Button>
          </div>
          {error && <p className="px-3 pb-2 text-[12px] text-danger">{error}</p>}
        </div>,
        document.body,
      )}
    </div>
  );
}
