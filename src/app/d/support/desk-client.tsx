"use client";

import { useTranslations } from "next-intl";
import { OverviewTab } from "@/features/support/components/overview-tab";
import { TicketsTab } from "@/features/support/components/tickets-tab";
import { SlaTab } from "@/features/support/components/sla-tab";
import type { DeskData } from "./desk-data";

export default function DeskClient({ tab, data }: { tab: "overview" | "tickets" | "sla"; data: DeskData }) {
  const t = useTranslations("support");
  if (tab === "tickets") return <TicketsTab t={t} data={data} />;
  if (tab === "sla") return <SlaTab t={t} data={data} />;
  return <OverviewTab t={t} data={data} />;
}
