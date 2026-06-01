"use client";

import { useTranslations } from "next-intl";
import { SubNav } from "@/components/ui";
import { AccessStats, ACCESS_LOG, useStaffStore } from "@/features/access";

export function AccessSubNav() {
  const t = useTranslations("access");
  const staffCount = useStaffStore((s) => s.staff.length);
  const items = [
    { href: "/access", label: t("tabs.members"), icon: "users", count: String(staffCount) },
    { href: "/access/roles", label: t("tabs.roles"), icon: "lock" },
    { href: "/access/activity", label: t("tabs.activity"), icon: "clock", count: String(ACCESS_LOG.length) },
  ];
  return (
    <>
      <AccessStats />
      <SubNav items={items} />
    </>
  );
}
