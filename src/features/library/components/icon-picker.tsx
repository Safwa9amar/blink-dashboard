"use client";

import { useEffect, useRef, useState } from "react";
import { DashIcon, CAT_ICONS, CAT_ICON_LABELS, fInput } from "@/components/ui";

// Marketplace category icons, keyed by SF-Symbol name so the same value renders in
// the dashboard (custom SVG) and the Blink app (Material Icons / native SF Symbol).
const ALL_ICONS = Object.keys(CAT_ICONS);
const DEFAULT_ICON = "square.grid.2x2.fill";
const labelOf = (name: string) => CAT_ICON_LABELS[name] || name;

export function IconPicker({
  value,
  onChange,
  searchPlaceholder,
}: {
  value: string;
  onChange: (name: string) => void;
  searchPlaceholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ql = q.trim().toLowerCase();
  // Match the SF name (e.g. "tshirt.fill") OR the friendly label ("Fashion").
  const list = ql
    ? ALL_ICONS.filter((n) => n.toLowerCase().includes(ql) || labelOf(n).toLowerCase().includes(ql))
    : ALL_ICONS;

  const pick = (name: string) => {
    onChange(name);
    setQ("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${fInput} flex items-center gap-2.5 text-start cursor-pointer`}
      >
        <span className="w-7 h-7 rounded-lg bg-soft-pink text-primary inline-flex items-center justify-center shrink-0">
          <DashIcon name={value || DEFAULT_ICON} className="w-4 h-4" />
        </span>
        <span className="flex-1 truncate">{labelOf(value || DEFAULT_ICON)}</span>
        <DashIcon name="chevron-down" className="w-4 h-4 text-subtext shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-border bg-card shadow-xl p-2">
          <input
            autoFocus
            className={`${fInput} mb-2`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
          />
          <div className="grid grid-cols-6 gap-1 max-h-52 overflow-y-auto">
            {list.map((name) => {
              const on = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => pick(name)}
                  title={labelOf(name)}
                  aria-label={labelOf(name)}
                  className={`aspect-square rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                    on ? "bg-primary text-white" : "text-subtext hover:bg-card-hover hover:text-text"
                  }`}
                >
                  <DashIcon name={name} className="w-[18px] h-[18px]" />
                </button>
              );
            })}
            {list.length === 0 && (
              <div className="col-span-6 py-5 text-center text-xs text-subtext">—</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
