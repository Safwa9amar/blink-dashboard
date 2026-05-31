"use client";

import { useTranslations } from "next-intl";
import { StatGrid, StatCard } from "@/components/ui";
import { useStaffStore } from "../store";

// Headline counts over the staff roster — read from the store so they update
// live as members are created, edited or revoked.
export function AccessStats() {
  const t = useTranslations("access");
  const staff = useStaffStore((s) => s.staff);

  const total = staff.length;
  const active = staff.filter((m) => m.status === "active").length;
  const invited = staff.filter((m) => m.status === "invited").length;
  const suspended = staff.filter((m) => m.status === "suspended").length;

  return (
    <StatGrid cols={4}>
      <StatCard label={t("stats.total")} value={total} icon="users" variant="primary" />
      <StatCard label={t("stats.active")} value={active} icon="shield" variant="success" />
      <StatCard label={t("stats.invited")} value={invited} icon="mail" variant="info" />
      <StatCard label={t("stats.suspended")} value={suspended} icon="lock" variant="warning" />
    </StatGrid>
  );
}
