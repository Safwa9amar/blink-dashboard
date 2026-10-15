"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge, Card } from "@/components/ui";
import { agoLabel } from "../format";
import type { ApiHealth, Health } from "../types";

function Row({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-t border-border first:border-t-0 text-[13px]">
      <div className="min-w-0">
        <div className="text-subtext">{label}</div>
        {detail && <div className="text-[11px] text-subtext tabular-nums">{detail}</div>}
      </div>
      {children}
    </div>
  );
}

function ApiRow({ label, h }: { label: string; h: ApiHealth }) {
  const t = useTranslations("live_ops");
  const detail = h.ms != null ? t("api_detail", { ms: h.ms }) : undefined;
  return (
    <Row label={label} detail={detail}>
      <Badge variant={h.state === "up" ? "success" : h.state === "down" ? "danger" : "warning"}>{t(h.state)}</Badge>
    </Row>
  );
}

export function SystemHealth({ health, now }: { health: Health; now: number | null }) {
  const t = useTranslations("live_ops");
  const dbVariant = health.dbMs == null ? "danger" : health.dbMs > 500 ? "warning" : "success";
  return (
    <Card title={t("system_health")}>
      <ApiRow label={t("api_primary")} h={health.primary} />
      <ApiRow label={t("api_spare")} h={health.spare} />
      <Row label={t("db_roundtrip")}>
        <Badge variant={dbVariant}>{health.dbMs == null ? t("down") : t("db_ms", { n: health.dbMs })}</Badge>
      </Row>
      <Row label={t("last_order")}>
        <span className="text-[12.5px] font-semibold text-text tabular-nums">
          {health.lastOrderAt ? agoLabel(t, health.lastOrderAt, now) : t("none_yet")}
        </span>
      </Row>
    </Card>
  );
}
