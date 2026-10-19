"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MotionScrollbar } from "./motion-scrollbar";
import { NavigationProgress } from "./navigation-progress";
import { AssistantChatHead } from "@/features/assistant";
import { CommandPalette } from "@/features/search";
import { canAccessPath, defaultPathFor, isRedirectOnlyPath, type StaffRole } from "@/lib/auth/access";
import type { AttentionCounts } from "@/lib/nav/modules";
import type { InboxSnapshot } from "@/lib/shell/inbox-types";
import { AttentionProvider } from "./shell/attention-provider";
import { InboxProvider } from "./shell/inbox-provider";
import { Breadcrumbs } from "./shell/breadcrumbs";
import { MobileDrawer } from "./shell/mobile-drawer";
import { ModuleNav } from "./shell/module-nav";
import { ModuleRail } from "./shell/module-rail";
import { TopBar } from "./shell/top-bar";

const MID_WIDTH = "(min-width: 1024px) and (max-width: 1279px)";
function subscribeMidWidth(cb: () => void) {
  const mq = window.matchMedia(MID_WIDTH);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const midWidthSnapshot = () => window.matchMedia(MID_WIDTH).matches;

export function DashboardShell({
  children,
  staffRole,
  staffName,
  attention,
  inbox,
}: {
  children: React.ReactNode;
  staffRole: StaffRole;
  staffName: string;
  attention: AttentionCounts;
  inbox: InboxSnapshot;
}) {
  const t = useTranslations("shell.nav");
  const pathname = usePathname();
  const router = useRouter();

  // Module-menu collapse lives here for the session (the layout stays mounted across
  // navigations). It starts collapsed on 1024-1279px screens.
  const midWidth = useSyncExternalStore(subscribeMidWidth, midWidthSnapshot, () => false);
  const [navOverride, setNavOverride] = useState<boolean | null>(null);
  const navCollapsed = navOverride ?? midWidth;

  const [searchOpen, setSearchOpen] = useState(false);
  // The drawer is only open for the pathname it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;

  // Client-side guard for deep-links into a section this role can't see. The real
  // boundary is the server layout (staff gate) + server actions (mutations); this is a
  // UX redirect so the address bar and the rendered page stay consistent with the nav.
  const allowed = canAccessPath(staffRole, pathname) || isRedirectOnlyPath(pathname);
  useEffect(() => {
    if (!allowed) router.replace(defaultPathFor(staffRole));
  }, [allowed, staffRole, router]);

  return (
    <AttentionProvider initial={attention}>
      <InboxProvider initial={inbox}>
        <div className="h-screen flex flex-col overflow-hidden bg-background">
          <NavigationProgress />
          <TopBar
            staffRole={staffRole}
            staffName={staffName}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenDrawer={() => setDrawerPath(pathname)}
          />
          <div className="flex-1 min-h-0 flex">
            <div className="hidden lg:flex h-full">
              <ModuleRail staffRole={staffRole} />
              <ModuleNav staffRole={staffRole} collapsed={navCollapsed} />
            </div>
            <MotionScrollbar className="flex-1 min-w-0 h-full">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-2 mb-4 min-h-6">
                  <button
                    type="button"
                    onClick={() => setNavOverride(!navCollapsed)}
                    aria-label={navCollapsed ? t("expand") : t("collapse")}
                    title={navCollapsed ? t("expand") : t("collapse")}
                    className="hidden lg:flex w-6 h-6 rounded-md items-center justify-center text-subtext hover:text-text hover:bg-card border border-transparent hover:border-border cursor-pointer shrink-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-4 h-4 rtl:rotate-180 ${navCollapsed ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path d="M13 6l-6 6 6 6M19 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <Breadcrumbs />
                </div>
                <main>{allowed ? children : null}</main>
              </div>
            </MotionScrollbar>
          </div>
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerPath(null)} staffRole={staffRole} />
          <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} staffRole={staffRole} />
          <AssistantChatHead staffRole={staffRole} staffName={staffName} />
        </div>
      </InboxProvider>
    </AttentionProvider>
  );
}
