"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { DashIcon } from "@/components/ui";

type Pos = { top?: number; bottom?: number; left: number; width: number };

const PANEL_W = 336;

/**
 * Click / focus (and optionally hover) popover anchored to a trigger. The panel is `fixed`, so it is
 * not clipped by scrolling tables or modals; Escape closes it (and does not close a modal behind it),
 * and focus goes back to the trigger.
 */
export function Popover({
  label,
  trigger,
  children,
  triggerClassName = "",
  hover = false,
}: {
  /** Accessible name of both the trigger and the panel. */
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  hover?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const place = useCallback(() => {
    const el = btn.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(PANEL_W, window.innerWidth - 16);
    const rtl = getComputedStyle(el).direction === "rtl";
    const left = Math.max(8, Math.min(rtl ? r.right - width : r.left, window.innerWidth - width - 8));
    // Open upwards when the trigger sits in the lower part of the screen.
    if (r.bottom > window.innerHeight * 0.6) setPos({ bottom: window.innerHeight - r.top + 6, left, width });
    else setPos({ top: r.bottom + 6, left, width });
  }, []);

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    place();
    setOpen(true);
  }, [place]);
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }, []);
  const hideSoon = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!btn.current?.contains(n) && !panel.current?.contains(n)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", hide);
    };
  }, [open, hide]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <span
      className="relative inline-flex align-baseline"
      onMouseEnter={hover ? show : undefined}
      onMouseLeave={hover ? hideSoon : undefined}
    >
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => (hover || !open ? show() : hide())}
        onFocus={hover ? show : undefined}
        className={`cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${triggerClassName}`}
      >
        {trigger}
      </button>
      {open && pos && (
        <span
          ref={panel}
          id={id}
          role="dialog"
          aria-label={label}
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
          className="fixed z-[70] block max-h-[min(70vh,30rem)] overflow-y-auto rounded-xl border border-border bg-card p-3.5 text-start text-[12.5px] font-normal normal-case leading-snug tracking-normal text-text shadow-2xl"
          onMouseEnter={hover ? show : undefined}
          onMouseLeave={hover ? hideSoon : undefined}
        >
          {children}
        </span>
      )}
    </span>
  );
}

/** The small "?" button that opens a popover next to a heading or a label. */
export function InfoPopover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover
      label={label}
      triggerClassName="inline-flex h-5 w-5 items-center justify-center text-subtext hover:text-primary"
      trigger={<DashIcon name="support" className="h-4 w-4" />}
    >
      {children}
    </Popover>
  );
}
