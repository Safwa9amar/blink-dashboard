"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SectionCard, InputField } from "./settings-field";

export function FeesSettings() {
  const t = useTranslations("settings");
  const tf = useTranslations("settings.fees");

  const [deliveryFee, setDeliveryFee] = useState("150");
  const [serviceFeePct, setServiceFeePct] = useState("5");
  const [commissionPct, setCommissionPct] = useState("15");
  const [minOrder, setMinOrder] = useState("300");
  const [freeDelivery, setFreeDelivery] = useState("2000");
  const [agentCommission, setAgentCommission] = useState("2");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SectionCard
      title={tf("title")}
      description={tf("description")}
      footer={
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-[var(--success)]">{t("saved")}</span>}
          <Button variant="primary" size="sm" onClick={handleSave}>
            {t("save")}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label={tf("delivery_fee")} value={deliveryFee} onChange={setDeliveryFee} type="number" />
        <InputField label={tf("service_fee_pct")} value={serviceFeePct} onChange={setServiceFeePct} type="number" />
        <InputField label={tf("commission_pct")} value={commissionPct} onChange={setCommissionPct} type="number" />
        <InputField label={tf("min_order")} value={minOrder} onChange={setMinOrder} type="number" />
        <InputField label={tf("free_delivery_threshold")} value={freeDelivery} onChange={setFreeDelivery} type="number" />
        <InputField label={tf("agent_commission_pct")} value={agentCommission} onChange={setAgentCommission} type="number" />
      </div>
    </SectionCard>
  );
}
