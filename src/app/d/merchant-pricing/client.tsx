"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui";
import { PricingStats, SuggestionsTable } from "@/features/merchant-pricing";

export default function MerchantPricingClient() {
  const t = useTranslations("merchant_pricing");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <PricingStats t={t} />
      <SuggestionsTable t={t} />
    </div>
  );
}
