"use client";

import { useTranslations } from "next-intl";
import { Badge, type Variant } from "@/components/ui";
import type { StaffRole } from "../data";

const ROLE_VARIANT: Record<StaffRole, Variant> = {
  super_admin: "primary",
  ops_admin: "info",
  finance_admin: "success",
  support_admin: "warning",
  commerce_admin: "default",
};

export function RoleBadge({ role }: { role: StaffRole }) {
  const t = useTranslations("access");
  return <Badge variant={ROLE_VARIANT[role]}>{t(`roles.${role}.name`)}</Badge>;
}
