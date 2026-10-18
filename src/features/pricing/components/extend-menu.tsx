"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, fInput } from "@/components/ui";
import { updateOverride } from "@/app/d/pricing/action";
import { addDays, endOfDayIso } from "../cockpit";
import type { Override } from "../types";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
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

  const pick = date && endOfDayIso(date) > override.ends_at ? endOfDayIso(date) : null;

  return (
    <div className="relative inline-block" ref={ref}>
      <Button type="button" variant="secondary" size={size} loading={pending} icon="clock" onClick={() => setOpen((v) => !v)}>
        {t("extend.label")}
      </Button>
      {open && (
        <div className="absolute z-30 mt-1 end-0 w-56 rounded-xl border border-border bg-card shadow-lg p-1.5">
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
            <Button type="button" size="xs" className="mt-2 w-full" disabled={!pick} loading={pending} onClick={() => pick && apply(pick)}>
              {t("extend.apply")}
            </Button>
          </div>
          {error && <p className="px-3 pb-2 text-[12px] text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
