"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { HealthRow } from "./health-row";

export function SystemHealth() {
  const t = useTranslations("live_ops");
  return (
    <Card title={t("system_health")}>
      <HealthRow label={t("api")} variant="success">{t("operational")}</HealthRow>
      <HealthRow label={t("payments")} variant="success">{t("operational")}</HealthRow>
      <HealthRow label={t("maps")} variant="warning">{t("degraded")}</HealthRow>
      <HealthRow label={t("notifications")} variant="success">{t("operational")}</HealthRow>
    </Card>
  );
}
