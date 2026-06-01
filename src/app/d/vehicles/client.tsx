"use client";

import { useTranslations } from "next-intl";
import { FleetTable, DocReviewTable } from "@/features/vehicles";

export default function VehiclesClient({ tab }: { tab: "fleet" | "documents" }) {
  const t = useTranslations("vehicles");
  if (tab === "documents") {
    return <DocReviewTable t={t} />;
  }
  return <FleetTable t={t} />;
}
