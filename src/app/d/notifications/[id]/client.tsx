"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader, Card, StatGrid, StatCard, Badge, DashIcon } from "@/components/ui";
import { TypePill, ChanIcons } from "@/features/notifications";
import { NSTATUS, N_ROLE_VARIANT, CHANNELS } from "@/features/notifications/data";
import { useNotificationsStore, useHydrateNotifications } from "@/features/notifications/store";

export default function CampaignDetailClient({ id }: { id: string }) {
  const t = useTranslations("notif");
  useHydrateNotifications();
  const c = useNotificationsStore((s) => s.campaigns.find((x) => x.id === id));

  const back = (
    <Link
      href="/notifications"
      className="inline-flex items-center gap-1.5 text-sm text-subtext hover:text-text transition-colors mb-4"
    >
      <DashIcon name="chevron-left" className="w-4 h-4 rtl:-scale-x-100" />
      {t("detail.back")}
    </Link>
  );

  if (!c) {
    return (
      <div>
        {back}
        <Card className="text-center py-16">
          <p className="text-subtext text-sm">{t("detail.not_found")}</p>
        </Card>
      </div>
    );
  }

  const m = c.metrics ?? { sent: 0, delivered: 0, opened: 0, clicked: 0 };
  const pct = (n: number) => (m.sent ? Math.round((n / m.sent) * 100) : 0);
  const channelLabels = c.chans.map((ch) => CHANNELS.find((x) => x[0] === ch)?.[1] ?? ch).join(" · ");

  const funnel: { label: string; value: number; rate: number }[] = [
    { label: t("detail.delivered"), value: m.delivered, rate: pct(m.delivered) },
    { label: t("col.open_rate"), value: m.opened, rate: pct(m.opened) },
    { label: t("detail.clicked"), value: m.clicked, rate: pct(m.clicked) },
  ];

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("col.type"), value: <TypePill type={c.type} /> },
    { label: t("col.audience"), value: <Badge variant={N_ROLE_VARIANT[c.audience]}>{c.audience}</Badge> },
    {
      label: t("col.channels"),
      value: (
        <span className="inline-flex items-center gap-2">
          <ChanIcons chans={c.chans} />
          <span className="text-subtext text-[13px]">{channelLabels}</span>
        </span>
      ),
    },
    { label: t("col.status"), value: <Badge variant={NSTATUS[c.status]}>{c.status}</Badge> },
    { label: t("detail.sent_on"), value: <span className="text-subtext">{c.date}</span> },
  ];

  return (
    <div>
      {back}

      <PageHeader
        title={c.title}
        description={t("detail.performance")}
        actions={<Badge variant={NSTATUS[c.status]}>{c.status}</Badge>}
      />

      <StatGrid cols={4}>
        <StatCard label={t("col.reach")} value={c.reach || "—"} variant="primary" icon="bell" />
        <StatCard label={t("detail.delivered")} value={m.delivered || "—"} variant="info" icon="send" />
        <StatCard label={t("col.open_rate")} value={c.opens} variant="success" icon="trending" />
        <StatCard label={t("detail.clicked")} value={m.clicked || "—"} variant="warning" icon="activity" />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-5 items-start">
        <Card title={t("detail.funnel")}>
          <div className="space-y-4 pt-1">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-subtext">{f.label}</span>
                  <span className="font-semibold text-text">
                    {f.value.toLocaleString()} <span className="text-subtext font-normal">· {f.rate}%</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${f.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("detail.details")}>
          <dl className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <dt className="text-[13px] font-medium text-subtext">{r.label}</dt>
                <dd className="text-sm text-text">{r.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
