"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SectionCard, ToggleField } from "./settings-field";

export function NotificationsSettings() {
  const t = useTranslations("settings");
  const tn = useTranslations("settings.notifications_settings");

  const [emailNewOrder, setEmailNewOrder] = useState(true);
  const [emailNewRider, setEmailNewRider] = useState(true);
  const [emailDispute, setEmailDispute] = useState(true);
  const [pushOrderUpdates, setPushOrderUpdates] = useState(true);
  const [pushTripUpdates, setPushTripUpdates] = useState(true);
  const [pushPromotions, setPushPromotions] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SectionCard
      title={tn("title")}
      description={tn("description")}
      footer={
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-[var(--success)]">{t("saved")}</span>}
          <Button variant="primary" size="sm" onClick={handleSave}>
            {t("save")}
          </Button>
        </div>
      }
    >
      <div className="divide-y divide-[var(--border)]">
        <ToggleField label={tn("email_new_order")} checked={emailNewOrder} onChange={setEmailNewOrder} />
        <ToggleField label={tn("email_new_rider")} checked={emailNewRider} onChange={setEmailNewRider} />
        <ToggleField label={tn("email_dispute")} checked={emailDispute} onChange={setEmailDispute} />
        <ToggleField label={tn("push_order_updates")} checked={pushOrderUpdates} onChange={setPushOrderUpdates} />
        <ToggleField label={tn("push_trip_updates")} checked={pushTripUpdates} onChange={setPushTripUpdates} />
        <ToggleField label={tn("push_promotions")} checked={pushPromotions} onChange={setPushPromotions} />
      </div>
    </SectionCard>
  );
}
