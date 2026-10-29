"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { termTags } from "./term";

const STORAGE_KEY = "blink.pricing.guide.open";

// Per-viewer "is the guide open" in localStorage, read through useSyncExternalStore so the server
// render and the first client render agree. Every access is wrapped: storage can be blocked.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
let fallback = true; // the choice for this page view when storage is unavailable
const readOpen = (): boolean => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? fallback : v !== "0";
  } catch {
    return fallback;
  }
};
const writeOpen = (open: boolean) => {
  fallback = open;
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    /* private window or blocked storage: the choice only lasts until the page reloads */
  }
  listeners.forEach((l) => l());
};

// Layer scores, most specific last. Widths are proportional to the score.
const LAYERS = [
  { key: "default", score: 0 },
  { key: "service", score: 1 },
  { key: "wilaya", score: 2 },
  { key: "tier", score: 4 },
  { key: "zone", score: 8 },
  { key: "partner", score: 16 },
] as const;

const GO = [
  { key: "zones", href: "/pricing/zones", icon: "map" },
  { key: "tiers", href: "/pricing/tiers", icon: "dollar" },
  { key: "overrides", href: "/pricing/overrides", icon: "grid" },
  { key: "simulator", href: "/pricing/simulator", icon: "search" },
] as const;

/** Collapsible "How pricing works" explainer; open/closed is remembered per viewer. */
export function HowPricingWorks() {
  const t = useTranslations("pricing");
  const open = useSyncExternalStore(subscribe, readOpen, () => true);
  const toggle = () => writeOpen(!open);

  return (
    <section aria-labelledby="pricing-guide-title" className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="pricing-guide-body"
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-5 py-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-soft-pink text-primary">
            <DashIcon name="support" className="h-5 w-5" />
          </span>
          <span>
            <span id="pricing-guide-title" className="block text-sm font-semibold text-text">
              {t("guide.title")}
            </span>
            <span className="block text-[12.5px] text-subtext">{t("guide.subtitle")}</span>
          </span>
        </span>
        <span className="shrink-0 text-[12px] font-semibold text-primary">{open ? t("guide.hide") : t("guide.show")}</span>
      </button>

      {open && (
        <div id="pricing-guide-body" className="space-y-6 border-t border-border px-5 py-5">
          {/* 1. layers */}
          <div>
            <h3 className="text-[13px] font-bold text-text">{t("guide.layers.title")}</h3>
            <p className="mt-0.5 text-[12.5px] text-subtext max-w-3xl">{t("guide.layers.intro")}</p>
            <ol className="mt-3 space-y-1.5" aria-label={t("guide.wins.order")}>
              {LAYERS.map((l) => (
                <li key={l.key} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr_6rem]">
                  <span className="text-[13px] font-semibold text-text">
                    {t(`guide.layers.${l.key}`)}
                    {l.score > 0 && <span className="ms-1.5 text-[11.5px] font-bold tabular-nums text-primary sm:hidden">({t("guide.layers.points", { n: l.score })})</span>}
                  </span>
                  <span className="min-w-0">
                    <span
                      aria-hidden
                      className={`block h-2 rounded-full ${l.score === 0 ? "bg-border" : "bg-primary"}`}
                      style={{ width: `${Math.max(4, (l.score / 16) * 100)}%`, opacity: l.score === 0 ? 1 : 0.35 + (l.score / 16) * 0.65 }}
                    />
                    <span className="mt-0.5 block text-[11.5px] text-subtext">{t(`guide.layers.${l.key}_desc`)}</span>
                  </span>
                  <span className="hidden text-end text-[12px] font-bold tabular-nums text-primary sm:block">
                    {l.score === 0 ? t("guide.layers.base") : t("guide.layers.points", { n: l.score })}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-3 rounded-lg bg-muted px-3.5 py-2.5">
              <p className="text-[12px] font-bold text-text">{t("guide.layers.extras_title")}</p>
              <ul className="mt-1 list-disc ps-5 text-[12.5px] text-subtext space-y-0.5">
                <li>{t("guide.layers.extra_class")}</li>
                <li>{t("guide.layers.extra_dates")}</li>
              </ul>
            </div>
          </div>

          {/* 2. which wins */}
          <div>
            <h3 className="text-[13px] font-bold text-text">{t("guide.wins.title")}</h3>
            <p className="mt-0.5 text-[12.5px] text-subtext max-w-3xl">{t.rich("guide.wins.body", termTags)}</p>
            <p className="mt-2 inline-block rounded-lg bg-soft-pink px-3 py-1.5 text-[12.5px] font-semibold text-primary">{t("guide.wins.order")}</p>
          </div>

          {/* 3. worked example */}
          <div>
            <h3 className="text-[13px] font-bold text-text">{t("guide.example.title")}</h3>
            <p className="mt-0.5 text-[12.5px] text-text">{t("guide.example.intro")}</p>
            <ol className="mt-2 space-y-1.5">
              {(["s1", "s2", "s3", "s4"] as const).map((k, i) => (
                <li key={k} className="flex gap-2.5 text-[12.5px] text-subtext">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>
                  <span>{t(`guide.example.${k}`)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 4. formula */}
          <div>
            <h3 className="text-[13px] font-bold text-text">{t("guide.formula.title")}</h3>
            <p className="mt-0.5 text-[12.5px] text-subtext">{t("guide.formula.intro")}</p>
            <ol className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((k, i) => (
                <li key={k} className="flex gap-2.5 rounded-lg border border-border px-3 py-2 text-[12.5px] text-subtext">
                  <span className="font-bold tabular-nums text-primary">{i + 1}</span>
                  <span>{t(`guide.formula.${k}`)}</span>
                </li>
              ))}
            </ol>
            <Link href="/pricing/formula" className="mt-2 inline-block text-[12.5px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded">
              {t("guide.formula.link")}
            </Link>
          </div>

          {/* 5. where to go */}
          <div>
            <h3 className="text-[13px] font-bold text-text">{t("guide.go.title")}</h3>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {GO.map((g) => (
                <li key={g.key}>
                  <Link
                    href={g.href}
                    className="flex h-full flex-col gap-1 rounded-xl border border-border px-3.5 py-3 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-text">
                      <DashIcon name={g.icon} className="h-4 w-4 text-primary" />
                      {t(`guide.go.${g.key}.task`)}
                    </span>
                    <span className="text-[12px] text-subtext">{t(`guide.go.${g.key}.desc`)}</span>
                    <span className="mt-auto pt-1 text-[12px] font-bold text-primary">{t(`guide.go.${g.key}.where`)} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
