"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { canAccessPath, type StaffRole } from "@/lib/auth/access";
import { CREATE_ACTIONS, visibleModules } from "@/lib/nav/modules";
import { searchRecords } from "@/lib/shell/actions";
import type { RecordKind, SearchGroup } from "@/lib/shell/search-types";
import en from "@/i18n/messages/en.json";
import { RecordPeek } from "./record-peek";
import { enumLabel } from "./search-format";

const RECENT_KEY = "blink.cmdk.recent";
const RECENT_MAX = 5;

type EnShell = { modules: Record<string, { name: string }>; create: Record<string, string> };
const EN_SIDEBAR = en.sidebar as Record<string, string>;
const EN_SHELL = en.shell as unknown as EnShell;

const KIND_ICON: Record<RecordKind, string> = { order: "package", transaction: "wallet", person: "users", store: "store" };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface Item {
  id: string;
  group: "recent" | "pages" | "actions" | "order" | "transaction" | "person" | "store";
  icon: string;
  title: string;
  subtitle?: string;
  /** Navigate here when chosen. */
  href?: string;
  /** Open the record peek when chosen. */
  record?: { kind: RecordKind; id: string };
}

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}
function writeRecent(href: string) {
  try {
    const next = [href, ...readRecent().filter((h) => h !== href)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

// Mounted only while open, so every opening starts from fresh state.
function PaletteDialog({
  staffRole,
  close,
  onPeek,
}: {
  staffRole: StaffRole;
  close: () => void;
  onPeek: (r: { kind: RecordKind; id: string }) => void;
}) {
  const t = useTranslations("search");
  const tNav = useTranslations("sidebar");
  const tShell = useTranslations("shell");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent] = useState<string[]>(readRecent);
  const [results, setResults] = useState<{ q: string; groups: SearchGroup[] } | null>(null);

  // Static, role-filtered index of pages and create actions (labels in both locales).
  const staticItems = useMemo(() => {
    const pages: (Item & { haystack: string })[] = [];
    for (const m of visibleModules(staffRole)) {
      const modName = tShell(`modules.${m.key}.name`);
      const modEn = EN_SHELL.modules[m.key]?.name ?? "";
      if (m.key !== "home") {
        pages.push({ id: `m:${m.key}`, group: "pages", icon: m.icon, title: modName, href: m.pages[0].href, haystack: norm(`${modName} ${modEn}`) });
      }
      for (const p of m.pages) {
        const label = tNav(p.key);
        pages.push({ id: `p:${p.href}`, group: "pages", icon: p.icon, title: label, subtitle: modName, href: p.href, haystack: norm(`${label} ${EN_SIDEBAR[p.key] ?? ""} ${modEn}`) });
      }
    }
    const actions: (Item & { haystack: string })[] = CREATE_ACTIONS.filter((a) => canAccessPath(staffRole, a.href)).map((a) => {
      const label = tShell(`create.${a.key}`);
      return { id: `a:${a.key}`, group: "actions" as const, icon: a.icon, title: label, subtitle: tShell("create.button"), href: a.href, haystack: norm(`${label} ${EN_SHELL.create[a.key] ?? ""}`) };
    });
    return { pages, actions };
  }, [staffRole, tNav, tShell]);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  // Debounced record search; a stale response (older query) is dropped.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      searchRecords(q)
        .then((groups) => live && setResults({ q, groups }))
        .catch(() => live && setResults({ q, groups: [] }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  const q = norm(query.trim());
  const items = useMemo<Item[]>(() => {
    if (!q) {
      const byHref = new Map(staticItems.pages.filter((p) => p.id.startsWith("p:")).map((p) => [p.href, p]));
      return recent.flatMap((h) => {
        const p = byHref.get(h);
        return p ? [{ ...p, group: "recent" as const }] : [];
      });
    }
    const pages = staticItems.pages.filter((p) => p.haystack.includes(q)).slice(0, 6);
    const actions = staticItems.actions.filter((a) => a.haystack.includes(q)).slice(0, 4);
    const records: Item[] =
      results && results.q === query.trim()
        ? results.groups.flatMap((g) =>
            g.hits.map((h) => ({
              id: `${h.kind}:${h.id}`,
              group: g.kind,
              icon: KIND_ICON[g.kind],
              title: h.kind === "transaction" && h.raw?.type ? enumLabel(t, "type", h.raw.type) : h.title,
              subtitle: h.raw
                ? [
                    h.ref ? `#${h.ref}` : null,
                    h.raw.role ? enumLabel(t, "role", h.raw.role) : null,
                    h.raw.status ? enumLabel(t, "status", h.raw.status) : null,
                    h.detail,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : [h.ref ? `#${h.ref}` : null, h.subtitle].filter(Boolean).join(" · "),
              record: { kind: h.kind, id: h.id },
            }))
          )
        : [];
    return [...pages, ...actions, ...records];
  }, [q, query, staticItems, recent, results, t]);

  const searching = query.trim().length >= 2 && results?.q !== query.trim();

  const choose = useCallback(
    (item: Item) => {
      if (item.record) {
        onPeek(item.record);
        close();
        return;
      }
      if (item.href) {
        if (item.group === "pages" || item.group === "recent") writeRecent(item.href);
        close();
        router.push(item.href);
      }
    },
    [close, onPeek, router]
  );

  const activeIdx = Math.min(active, Math.max(0, items.length - 1));

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(items.length ? (activeIdx + 1) % items.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(items.length ? (activeIdx - 1 + items.length) % items.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[activeIdx]) choose(items[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      e.preventDefault(); // focus trap: the input is the only tab stop
    }
  };

  return (
    <>
      {(
        <div className="fixed inset-0 z-50 flex items-start justify-center lg:pt-[12vh] lg:px-4" onKeyDown={onKeyDown}>
          <div className="absolute inset-0 bg-slate-900/50" onClick={close} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("placeholder")}
            className="relative z-10 flex flex-col w-full h-full lg:h-auto lg:max-h-[70vh] lg:max-w-xl bg-card lg:border lg:border-border lg:rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <DashIcon name="search" className="w-4 h-4 text-subtext shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                role="combobox"
                aria-expanded="true"
                aria-controls="cmdk-list"
                aria-activedescendant={items[activeIdx] ? `cmdk-item-${activeIdx}` : undefined}
                autoComplete="off"
                className="flex-1 h-12 bg-transparent text-text text-sm outline-none placeholder:text-subtext"
              />
              <button
                type="button"
                onClick={close}
                className="text-[11px] font-semibold text-subtext border border-border rounded-md px-1.5 py-0.5 cursor-pointer hover:text-text"
              >
                {t("esc")}
              </button>
            </div>

            <ul id="cmdk-list" ref={listRef} role="listbox" className="flex-1 overflow-y-auto p-2">
              {items.map((item, idx) => {
                const header = idx === 0 || items[idx - 1].group !== item.group;
                return (
                  <li key={item.id} role="presentation">
                    {header && (
                      <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-subtext">
                        {t(`groups.${item.group}`)}
                      </p>
                    )}
                    <div
                      id={`cmdk-item-${idx}`}
                      role="option"
                      aria-selected={idx === activeIdx}
                      data-idx={idx}
                      onMouseMove={() => setActive(idx)}
                      onClick={() => choose(item)}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer ${idx === activeIdx ? "bg-muted" : ""}`}
                    >
                      <span className="w-7 h-7 rounded-md bg-soft-pink text-primary inline-flex items-center justify-center shrink-0">
                        <DashIcon name={item.icon} className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-text truncate">{item.title}</span>
                        {item.subtitle && <span className="block text-xs text-subtext truncate">{item.subtitle}</span>}
                      </span>
                    </div>
                  </li>
                );
              })}
              {items.length === 0 && (
                <li role="presentation" className="px-3 py-10 text-center text-sm text-subtext">
                  {!q ? t("hint") : searching ? t("searching") : t("empty", { query: query.trim() })}
                </li>
              )}
              {items.length > 0 && searching && (
                <li role="presentation" className="px-3 py-2 text-xs text-subtext">
                  {t("searching")}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  staffRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffRole: StaffRole;
}) {
  const [peek, setPeek] = useState<{ kind: RecordKind; id: string } | null>(null);

  // Global shortcut: it must work while closed too, so it lives on the outer component.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <>
      {open && <PaletteDialog staffRole={staffRole} close={close} onPeek={setPeek} />}
      {peek && <RecordPeek kind={peek.kind} id={peek.id} onClose={() => setPeek(null)} />}
    </>
  );
}
