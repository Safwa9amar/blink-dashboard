"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import {
  OverviewTab,
  TicketsTab,
  InboxTab,
  KbTab,
  CreateArticle,
  MacrosTab,
  CsatTab,
  AgentsTab,
  SlaTab,
} from "@/features/support";
import { useDocumentTitle } from "@/lib/use-document-title";

type Tab =
  | "overview"
  | "tickets"
  | "inbox"
  | "kb"
  | "create"
  | "macros"
  | "csat"
  | "agents"
  | "sla";

export default function SupportClient({ tab }: { tab: Tab }) {
  const t = useTranslations("support");
  const router = useRouter();
  useDocumentTitle(t("title"), 42); // open tickets

  switch (tab) {
    case "tickets":
      return (
        <>
          <div className="flex justify-end mb-4">
            <Button icon="plus">{t("new_ticket")}</Button>
          </div>
          <TicketsTab t={t} />
        </>
      );
    case "inbox":
      return <InboxTab t={t} />;
    case "kb":
      return <KbTab t={t} onNew={() => router.push("/support/articles/new")} />;
    case "create":
      return <CreateArticle t={t} onCancel={() => router.push("/support/kb")} />;
    case "macros":
      return <MacrosTab t={t} />;
    case "csat":
      return <CsatTab t={t} />;
    case "agents":
      return <AgentsTab t={t} />;
    case "sla":
      return <SlaTab t={t} />;
    default:
      return <OverviewTab t={t} />;
  }
}
