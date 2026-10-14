"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Compact accessible "⋯" dropdown. Fixed-positioned so the table's scroll container never clips it. */
export function RowMenu({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; end: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!menu.current?.contains(n) && !btn.current?.contains(n)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const rtl = document.documentElement.dir === "rtl";
      // Anchor the menu's inline-end edge to the button's inline-end edge (logical `end`).
      setPos({ top: r.bottom + 4, end: rtl ? r.left : window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
        className="inline-flex h-7 w-8 items-center justify-center rounded-md text-subtext hover:bg-muted hover:text-text cursor-pointer"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && pos && (
        <div
          ref={menu}
          role="menu"
          className="fixed z-50 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
          style={{ top: pos.top, insetInlineEnd: pos.end }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}

export function MenuItem({
  onClick,
  disabled,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-start text-[13px] hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${danger ? "text-danger" : "text-text"}`}
    >
      {children}
    </button>
  );
}
