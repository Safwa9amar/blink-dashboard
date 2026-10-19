import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";
import { getCurrentStaffRole } from "@/lib/auth/staff";
import { canAccessPath } from "@/lib/auth/access";

// Blink Server — super-admin control surface for the backend: the AI bot engine
// (provider/model/keys) and a live tail of server logs. Access is gated to
// super_admin by the access model (the route is absent from other roles' lists).
export default async function BlinkServerLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("blink_server");
  const items = [
    { href: "/blink-server", label: t("tab_ai"), icon: "sparkles" },
    { href: "/blink-server/ai-log", label: t("tab_ai_log"), icon: "chat" },
    { href: "/blink-server/logs", label: t("tab_logs"), icon: "activity" },
    { href: "/blink-server/health", label: t("tab_health"), icon: "trending" },
    { href: "/blink-server/traffic", label: t("tab_traffic"), icon: "grid" },
    { href: "/blink-server/ai-insights", label: t("tab_ai_insights"), icon: "fire" },
    { href: "/blink-server/alerts", label: t("tab_alerts"), icon: "bell" },
    { href: "/blink-server/mcp", label: t("tab_mcp"), icon: "lock" },
  ];
  // MCP access is open to every staff role (own tokens); the other tabs stay super_admin-only.
  const role = await getCurrentStaffRole();
  const visible = items.filter((i) => canAccessPath(role, i.href));
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={visible} />
      {children}
    </div>
  );
}
