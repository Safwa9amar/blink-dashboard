"use client";

import { useTranslations } from "next-intl";
import { Badge, type Variant } from "@/components/ui";
import type { DeletionStatus } from "../types";

const VARIANT: Record<DeletionStatus, Variant> = {
  pending: "warning",
  completed: "success",
  cancelled: "default",
};

export function DeletionStatusBadge({ status }: { status: DeletionStatus }) {
  const t = useTranslations("deletion_requests");
  return <Badge variant={VARIANT[status]}>{t(`statuses.${status}` as Parameters<typeof t>[0])}</Badge>;
}
