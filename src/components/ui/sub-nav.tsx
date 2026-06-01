"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashIcon } from "./icons";

export interface SubNavItem {
  /** Absolute route, e.g. "/blink-cash" or "/blink-cash/ledger". */
  href: string;
  label: string;
  /** DashIcon name; ignored when `iconNode` is provided. */
  icon?: string;
  /** Custom icon element (used by the settings rail's inline SVGs). */
  iconNode?: ReactNode;
  count?: string;
  /** Force exact-match active state (auto-inferred for the index item otherwise). */
  exact?: boolean;
  /** Renders the label in the danger color when inactive (settings danger zone). */
  danger?: boolean;
}

/**
 * Link-based sibling of `SubTabs` — the navigation variant. Each item is a real
 * route, so the active tab is derived from the URL (`usePathname`) rather than
 * local state, which makes sub-views deep-linkable with working back/forward.
 *
 * `vertical` renders the settings-style left rail; the default is the horizontal
 * underline strip that mirrors `SubTabs` pixel-for-pixel.
 */
export function SubNav({ items, vertical = false }: { items: SubNavItem[]; vertical?: boolean }) {
  const pathname = usePathname();
  // The index item is the shortest href (the parent route itself, e.g. "/news").
  const indexHref = items.reduce((a, b) => (b.href.length < a.href.length ? b : a)).href;

  const isActive = (it: SubNavItem) => {
    const exact = it.exact ?? it.href === indexHref;
    return exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
  };

  if (vertical) {
    return (
      <nav className="w-56 shrink-0 space-y-1">
        {items.map((it) => {
          const on = isActive(it);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-start ${
                on
                  ? "bg-soft-pink text-primary border border-soft-border"
                  : "text-subtext hover:text-text hover:bg-[var(--muted)] border border-transparent"
              } ${it.danger && !on ? "text-danger hover:text-danger" : ""}`}
            >
              {it.iconNode ?? (it.icon && <DashIcon name={it.icon} className="w-4 h-4" />)}
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex gap-1 mb-[22px] border-b border-border overflow-x-auto">
      {items.map((it) => {
        const on = isActive(it);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`inline-flex items-center gap-2 px-4 py-[11px] text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              on ? "text-primary border-primary" : "text-subtext border-transparent hover:text-text"
            }`}
          >
            {it.iconNode ?? (it.icon && <DashIcon name={it.icon} className="w-4 h-4" />)}
            {it.label}
            {it.count && (
              <span
                className={`text-[11px] font-bold rounded-full px-2 py-px ${
                  on ? "bg-soft-pink text-primary" : "bg-muted text-subtext"
                }`}
              >
                {it.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
