"use client";

import { useEffect, useRef, useState } from "react";
import { DashIcon, btnSecondary } from "@/components/ui";
import type { TFn } from "../data";
import { downloadTemplate } from "../import";
import { ImportModal } from "./import-modal";

const item =
  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text hover:bg-card-hover transition-colors cursor-pointer text-start";

// Toolbar dropdown: "Import ▾" → import-from-file (opens the modal) + one-click
// template downloads (CSV / Excel / JSON). Used on the products and categories lists.
export function ImportMenu({
  t,
  kind,
  className = "",
}: {
  t: TFn;
  kind: "products" | "categories";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);

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

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={btnSecondary}
      >
        <DashIcon name="download" className="w-4 h-4" />
        {t("import.button")}
        <DashIcon name="chevron-down" className="w-4 h-4 -me-1 opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 mt-1.5 end-0 w-60 rounded-xl border border-border bg-card shadow-xl p-1.5"
        >
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              setModal(true);
            }}
          >
            <DashIcon name="download" className="w-4 h-4 text-subtext shrink-0" />
            {t("import.from_file")}
          </button>

          <div className="my-1 border-t border-border" />
          <div className="px-2.5 py-1 text-[11px] font-semibold text-subtext uppercase tracking-wide">
            {t("import.templates")}
          </div>
          {(["csv", "xlsx", "json"] as const).map((fmt) => (
            <button
              key={fmt}
              role="menuitem"
              type="button"
              className={item}
              onClick={() => {
                downloadTemplate(kind, fmt);
                setOpen(false);
              }}
            >
              <DashIcon name="doc" className="w-4 h-4 text-subtext shrink-0" />
              {fmt === "xlsx" ? "Excel" : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <ImportModal t={t} kind={kind} open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
