"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  AiBotTab,
  useKbStore,
  type SupportArticleType,
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
  | "sla"
  | "ai";

export default function SupportClient({ tab }: { tab: Tab }) {
  const t = useTranslations("support");
  const router = useRouter();
  const params = useSearchParams();
  const articles = useKbStore((s) => s.articles);
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
      return (
        <KbTab
          t={t}
          onNew={(type) => router.push(`/support/articles/new?type=${type}`)}
          onEdit={(id) => router.push(`/support/articles/new?id=${id}`)}
        />
      );
    case "create": {
      // Edit mode: an `id` param resolves the row from the kb-store. Otherwise a
      // fresh form, seeded with the `type` param chosen on the KB tab.
      const id = params.get("id");
      const initial = id ? articles.find((a) => a.id === id) : undefined;
      const defaultType = (params.get("type") as SupportArticleType) || "article";
      return (
        <CreateArticle
          t={t}
          initial={initial}
          defaultType={defaultType}
          onCancel={() => router.push("/support/kb")}
        />
      );
    }
    case "macros":
      return <MacrosTab t={t} />;
    case "csat":
      return <CsatTab t={t} />;
    case "agents":
      return <AgentsTab t={t} />;
    case "sla":
      return <SlaTab t={t} />;
    case "ai":
      return <AiBotTab t={t} />;
    default:
      return <OverviewTab t={t} />;
  }
}
