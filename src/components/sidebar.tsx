"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { canAccessPath, type StaffRole } from "@/lib/auth/access";
import { DashIcon } from "@/components/ui";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

interface NavItem {
  key: string;
  href: string;
  icon: string;
}

// Role-based navigation — grouped by the app's four user roles (Customers · Riders ·
// Merchants · Agents) plus a Platform group for cross-cutting/admin sections.
const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "customers",
    items: [
      { key: "customers", href: "/customers", icon: "users" },
      { key: "orders", href: "/orders", icon: "package" },
      { key: "promotions", href: "/promotions", icon: "gift" },
      { key: "coupons", href: "/coupons", icon: "ticket" },
    ],
  },
  {
    group: "riders",
    items: [
      { key: "riders", href: "/riders", icon: "bike" },
      { key: "vehicles", href: "/vehicles", icon: "truck" },
      { key: "trips", href: "/trips", icon: "map" },
    ],
  },
  {
    group: "merchants",
    items: [
      { key: "merchants", href: "/merchants", icon: "users" },
      { key: "marketplace", href: "/marketplace", icon: "store" },
      { key: "library", href: "/library", icon: "package" },
      { key: "pricing", href: "/merchant-pricing", icon: "trending" },
      { key: "packs", href: "/packs-management", icon: "gift" },
    ],
  },
  {
    group: "agents",
    items: [
      { key: "agents", href: "/agents", icon: "users" },
      { key: "agent_shops", href: "/agent-shops", icon: "store" },
    ],
  },
  {
    group: "platform",
    items: [
      { key: "overview", href: "/", icon: "grid" },
      { key: "demand", href: "/demand", icon: "trending" },
      { key: "live_ops", href: "/live-ops", icon: "activity" },
      { key: "users", href: "/users", icon: "users" },
      { key: "access", href: "/access", icon: "lock" },
      { key: "verification", href: "/verification", icon: "shield" },
      { key: "blink_cash", href: "/blink-cash", icon: "wallet" },
      { key: "news", href: "/news", icon: "newspaper" },
      { key: "notifications", href: "/notifications", icon: "bell" },
      { key: "deep_links", href: "/deep-links", icon: "map" },
      { key: "settings", href: "/settings", icon: "settings2" },
    ],
  },
];

// double-chevron toggle (collapse «  /  expand »), flips automatically in RTL.
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-4 h-4 transition-transform rtl:-scale-x-100 ${collapsed ? "rotate-180" : ""}`}
    >
      <path d="M13 6l-6 6 6 6M19 6l-6 6 6 6" />
    </svg>
  );
}

export function Sidebar({
  staffRole,
  collapsed = false,
  onToggle,
}: {
  staffRole: StaffRole;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("sidebar");
  const tc = useTranslations("common");
  const tl = useTranslations("language");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const groups = NAV_GROUPS.map(({ group, items }) => {
    const groupLabel = t(group);
    // Only routes this staff role may reach; then narrow by the search query (expanded).
    const visible = items.filter((item) => canAccessPath(staffRole, item.href));
    const shown = collapsed
      ? visible
      : visible.filter(
          (item) => !q || t(item.key).toLowerCase().includes(q) || groupLabel.toLowerCase().includes(q)
        );
    return { group, groupLabel, shown };
  }).filter((g) => g.shown.length > 0);

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"} h-screen bg-card border-e border-border flex flex-col fixed start-0 top-0 transition-[width] duration-200 z-30`}
    >
      {/* header */}
      <div className={`border-b border-border ${collapsed ? "p-3" : "p-6"}`}>
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
          <Image src="/images/logo-b.png" alt="Blink" width={32} height={32} className="shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-text leading-tight">Blink</h1>
              <p className="text-[10px] text-subtext font-medium uppercase tracking-widest truncate">
                {t("admin_dashboard")}
              </p>
            </div>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
              title={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-subtext hover:text-text hover:bg-background border border-transparent hover:border-border transition-colors cursor-pointer shrink-0"
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
          )}
        </div>
      </div>

      {/* search (expanded) / search shortcut (collapsed) */}
      {collapsed ? (
        <div className="px-3 pt-3 flex justify-center">
          <button
            onClick={onToggle}
            aria-label={t("search_menu")}
            title={t("search_menu")}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-subtext hover:text-text hover:bg-background border border-border transition-colors cursor-pointer"
          >
            <DashIcon name="search" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
            <DashIcon name="search" className="w-4 h-4 text-subtext shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search_menu")}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-text placeholder:text-subtext"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-subtext hover:text-text cursor-pointer">
                <DashIcon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* nav */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
        {groups.map(({ group, groupLabel, shown }, gi) => (
          <div key={group} className={collapsed ? `pt-2 mt-2 ${gi ? "border-t border-border" : ""}` : "mb-3"}>
            {!collapsed && (
              <div className="text-[10px] font-bold text-subtext uppercase tracking-wider px-3 pt-1.5 pb-1 opacity-75">
                {groupLabel}
              </div>
            )}
            <div className="space-y-0.5">
              {shown.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? t(item.key) : undefined}
                    className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                      collapsed ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3 py-2.5"
                    } ${
                      isActive
                        ? "bg-soft-pink text-primary border border-soft-border"
                        : "text-subtext hover:text-text hover:bg-background border border-transparent"
                    }`}
                  >
                    <DashIcon name={item.icon} className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="truncate">{t(item.key)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {!collapsed && !groups.length && (
          <div className="text-xs text-subtext text-center py-8">{t("no_menu_match", { query })}</div>
        )}
      </nav>

      {/* footer */}
      <div className="p-3 border-t border-border space-y-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher vertical />
            <button
              onClick={handleSignOut}
              aria-label={tc("sign_out")}
              title={tc("sign_out")}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
            >
              <DashIcon name="logout" className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-subtext font-medium uppercase tracking-wider">{tl("title")}</span>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
            >
              <DashIcon name="logout" className="w-5 h-5" />
              {tc("sign_out")}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
