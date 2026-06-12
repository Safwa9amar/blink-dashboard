"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MotionScrollbar } from "./motion-scrollbar";
import { NotificationBell } from "@/features/notifications";
import { NavigationProgress } from "./navigation-progress";
import { canAccessPath, defaultPathFor, type StaffRole } from "@/lib/auth/access";

export function DashboardShell({
  children,
  staffRole,
}: {
  children: React.ReactNode;
  staffRole: StaffRole;
}) {
  // Collapse state lives here so the fixed sidebar and the main content margin stay
  // in sync. App-Router keeps this layout mounted across navigations, so the choice
  // persists for the session without needing localStorage.
  const [collapsed, setCollapsed] = useState(false);

  // Client-side guard for deep-links into a section this role can't see. The real
  // boundary is the server layout (staff gate) + server actions (mutations); this is a
  // UX redirect so the address bar and the rendered page stay consistent with the nav.
  const pathname = usePathname();
  const router = useRouter();
  const allowed = canAccessPath(staffRole, pathname);
  useEffect(() => {
    if (!allowed) router.replace(defaultPathFor(staffRole));
  }, [allowed, staffRole, router]);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar staffRole={staffRole} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <NavigationProgress />
      <MotionScrollbar className={`${collapsed ? "ms-20" : "ms-64"} h-screen transition-[margin] duration-200`}>
        <header className="sticky top-0 z-20 flex items-center justify-end gap-2 px-8 h-14 bg-background/80 backdrop-blur border-b border-border">
          <NotificationBell />
        </header>
        <main className="p-8">{allowed ? children : null}</main>
      </MotionScrollbar>
    </div>
  );
}
