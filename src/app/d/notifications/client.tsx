"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Campaigns, Compose, Templates, Segments } from "@/features/notifications";
import type { ScheduledNotification } from "@/features/notifications";
import { useNotificationsStore, useHydrateNotifications } from "@/features/notifications/store";

type Tab = "campaigns" | "compose" | "templates" | "segments";

// Reads & clears the one-shot draft set by a template/campaign before navigation.
// Lives in its own component so the read-once `useState` initializer is a real hook.
function ComposeView() {
  const t = useTranslations("notif");
  const router = useRouter();
  const [draft] = useState(() => useNotificationsStore.getState().consumeComposeDraft());
  return <Compose t={t} initialDraft={draft} onCancel={() => router.push("/notifications")} />;
}

export default function NotificationsClient({
  tab,
  scheduled = [],
}: {
  tab: Tab;
  scheduled?: ScheduledNotification[];
}) {
  const t = useTranslations("notif");
  const router = useRouter();
  useHydrateNotifications();
  const setComposeDraft = useNotificationsStore((s) => s.setComposeDraft);

  switch (tab) {
    case "compose":
      return <ComposeView />;
    case "templates":
      return (
        <Templates
          t={t}
          onUse={(tpl) => {
            setComposeDraft({ type: tpl.type, body: tpl.message });
            router.push("/notifications/compose");
          }}
        />
      );
    case "segments":
      return <Segments t={t} />;
    default:
      return (
        <Campaigns
          t={t}
          scheduled={scheduled}
          onNew={() => router.push("/notifications/compose")}
        />
      );
  }
}
