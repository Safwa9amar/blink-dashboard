"use client";

import { useTranslations } from "next-intl";
import { SubNav } from "@/components/ui";

export function AccessSubNav() {
  const t = useTranslations("access");
  const items = [
    { href: "/access", label: t("tabs.members"), icon: "users" },
    { href: "/access/roles", label: t("tabs.roles"), icon: "lock" },
    { href: "/access/activity", label: t("tabs.activity"), icon: "clock" },
  ];
  return <SubNav items={items} />;
}
