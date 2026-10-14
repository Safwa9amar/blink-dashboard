"use client";

import { useLocale, useTranslations } from "next-intl";
import { StatCard } from "@/components/ui";
import type { Kpis } from "../types";

/** KPI cards: 2 columns on phones, 3 on tablets, 5 on desktop. */
export function LiveKpis({ kpis, now }: { kpis: Kpis; now: number | null }) {
  const t = useTranslations("live_ops");
  const tc = useTranslations("common");
  const locale = useLocale();
  const oldest =
    kpis.oldestSearchingSince && now != null
      ? Math.max(0, Math.floor((now - new Date(kpis.oldestSearchingSince).getTime()) / 60000))
      : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
      <StatCard label={t("kpi_active")} value={kpis.activeOrders} icon="package" variant="primary" />
      <StatCard
        label={t("kpi_searching")}
        value={kpis.searching}
        icon="clock"
        variant={kpis.searching ? "warning" : "success"}
        change={oldest != null && kpis.searching ? t("kpi_searching_sub", { n: oldest }) : undefined}
      />
      <StatCard
        label={t("kpi_riders")}
        value={kpis.ridersOnline}
        icon="bike"
        variant="success"
        change={t("kpi_riders_sub", { busy: kpis.ridersBusy })}
      />
      <StatCard
        label={t("kpi_chats")}
        value={kpis.chatsOpen}
        icon="chat"
        variant="info"
        change={kpis.chatsUnread ? t("kpi_chats_sub", { n: kpis.chatsUnread }) : undefined}
      />
      <StatCard
        label={t("kpi_cash")}
        value={`${Math.round(kpis.cashAmount).toLocaleString(locale)} ${tc("da")}`}
        icon="wallet"
        variant="default"
        change={t("kpi_cash_sub", { n: kpis.cashCount })}
      />
    </div>
  );
}
