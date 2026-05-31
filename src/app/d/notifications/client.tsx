"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, Button } from "@/components/ui";
import { Campaigns, Compose, Templates, Segments } from "@/features/notifications";
import { useNotificationsStore, useHydrateNotifications } from "@/features/notifications/store";

type Draft = { type?: string; title?: string; body?: string } | null;

export default function NotificationsClient() {
  const t = useTranslations("notif");
  useHydrateNotifications();

  const [tab, setTab] = useState("campaigns");
  const [draft, setDraft] = useState<Draft>(null);
  const [composeKey, setComposeKey] = useState(0);

  const campaignsCount = useNotificationsStore((s) => s.campaigns.length);
  const templatesCount = useNotificationsStore((s) => s.templates.length);
  const segmentsCount = useNotificationsStore((s) => s.segments.length);

  const openCompose = (d: Draft = null) => {
    setDraft(d);
    setComposeKey((k) => k + 1);
    setTab("compose");
  };

  const tabs = [
    { id: "campaigns", label: t("campaigns"), icon: "bell", count: String(campaignsCount) },
    { id: "compose", label: t("compose"), icon: "send" },
    { id: "templates", label: t("templates"), icon: "doc", count: String(templatesCount) },
    { id: "segments", label: t("segments"), icon: "users", count: String(segmentsCount) },
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          tab === "campaigns" ? (
            <Button icon="send" onClick={() => openCompose()}>
              {t("new_notification")}
            </Button>
          ) : null
        }
      />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "campaigns" && <Campaigns t={t} onNew={() => openCompose()} />}
      {tab === "compose" && <Compose key={composeKey} t={t} initialDraft={draft} onCancel={() => setTab("campaigns")} />}
      {tab === "templates" && <Templates t={t} onUse={(tpl) => openCompose({ type: tpl.type, body: tpl.message })} />}
      {tab === "segments" && <Segments t={t} />}
    </div>
  );
}
