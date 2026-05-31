"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations("users");
  return (
    <Badge variant={isActive ? "success" : "danger"}>
      {isActive ? t("active") : t("inactive")}
    </Badge>
  );
}
