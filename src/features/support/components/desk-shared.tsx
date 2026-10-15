"use client";

import { useEffect, useState } from "react";
import { Badge, type Variant } from "@/components/ui";
import { formatMinutes, type Priority, type SlaState } from "../metrics";
import type { TFn } from "../types";

/** Priority accent colors (design-system tokens). */
export const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: "var(--danger)",
  high: "var(--warning)",
  normal: "var(--info)",
  low: "var(--subtext)",
};

export const STATUS_VARIANT: Record<string, Variant> = {
  bot: "default",
  waiting: "danger",
  assigned: "warning",
  resolved: "success",
};

export const ROLE_BADGE: Record<string, Variant> = {
  customer: "info",
  rider: "success",
  merchant: "primary",
  agent: "warning",
};

export const unitsOf = (t: TFn) => ({ m: t("sla.u_min"), h: t("sla.u_h"), d: t("sla.u_d") });

/** `null` until the page has mounted, then the live clock (30 s tick). Avoids hydration drift. */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function PriorityLabel({ priority, t }: { priority: Priority; t: TFn }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: PRIORITY_COLOR[priority] }}>
      <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[priority] }} />
      {t(`tk.prio_${priority}`)}
    </span>
  );
}

export function SlaBadge({ sla, t }: { sla: SlaState | null; t: TFn }) {
  if (!sla) return <span className="text-subtext">—</span>;
  const time = formatMinutes(sla.minutes, unitsOf(t));
  if (sla.state === "breached") {
    return <Badge className="normal-case! tracking-normal!" variant="danger">{t("tk.sla_late", { time })}</Badge>;
  }
  if (sla.state === "due_soon") return <Badge className="normal-case! tracking-normal!" variant="warning">{t("tk.sla_due", { time })}</Badge>;
  return <Badge className="normal-case! tracking-normal!" variant="success">{t("tk.sla_ok")}</Badge>;
}

export function MigrationNotice({ t }: { t: TFn }) {
  return (
    <div className="mb-4 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning">
      {t("sla.migration")}
    </div>
  );
}
