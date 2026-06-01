"use client";

import { useTranslations } from "next-intl";
import { SubNav } from "@/components/ui";
import { useNotificationsStore, useHydrateNotifications } from "@/features/notifications/store";

// Client sub-nav so the campaign/template/segment badge counts stay live as the
// store mutates (the server layout can't read the client store).
export function NotifSubNav() {
  const t = useTranslations("notif");
  useHydrateNotifications();
  const campaignsCount = useNotificationsStore((s) => s.campaigns.length);
  const templatesCount = useNotificationsStore((s) => s.templates.length);
  const segmentsCount = useNotificationsStore((s) => s.segments.length);

  const items = [
    { href: "/notifications", label: t("campaigns"), icon: "bell", count: String(campaignsCount) },
    { href: "/notifications/compose", label: t("compose"), icon: "send" },
    { href: "/notifications/templates", label: t("templates"), icon: "doc", count: String(templatesCount) },
    { href: "/notifications/segments", label: t("segments"), icon: "users", count: String(segmentsCount) },
  ];
  return <SubNav items={items} />;
}
