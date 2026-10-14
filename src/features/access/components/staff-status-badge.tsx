"use client";

import { useTranslations } from "next-intl";
import { Badge, type Variant } from "@/components/ui";
import type { StaffStatus } from "../data";

const STATUS_VARIANT: Record<StaffStatus, Variant> = {
  active: "success",
  must_change: "warning",
  never_signed_in: "info",
  suspended: "danger",
};

export function StaffStatusBadge({ status }: { status: StaffStatus }) {
  const t = useTranslations("access");
  return <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}
