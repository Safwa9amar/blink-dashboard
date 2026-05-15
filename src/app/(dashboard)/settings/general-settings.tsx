"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SectionCard, InputField, SelectField } from "./settings-field";

export function GeneralSettings() {
  const t = useTranslations("settings");
  const tg = useTranslations("settings.general");

  const [platformName, setPlatformName] = useState("Blink");
  const [supportEmail, setSupportEmail] = useState("support@blink.com");
  const [supportPhone, setSupportPhone] = useState("+213000000000");
  const [timezone, setTimezone] = useState("Africa/Algiers");
  const [currency, setCurrency] = useState("DZD");
  const [currencySymbol, setCurrencySymbol] = useState("DA");
  const [defaultLang, setDefaultLang] = useState("ar");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SectionCard
      title={tg("title")}
      description={tg("description")}
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
        <InputField label={tg("platform_name")} value={platformName} onChange={setPlatformName} />
        <InputField label={tg("support_email")} value={supportEmail} onChange={setSupportEmail} type="email" />
        <InputField label={tg("support_phone")} value={supportPhone} onChange={setSupportPhone} />
        <SelectField
          label={tg("timezone")}
          value={timezone}
          onChange={setTimezone}
          options={[
            { value: "Africa/Algiers", label: "Africa/Algiers (GMT+1)" },
            { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
            { value: "Europe/London", label: "Europe/London (GMT+0)" },
            { value: "America/New_York", label: "America/New York (GMT-5)" },
          ]}
        />
        <InputField label={tg("currency")} value={currency} onChange={setCurrency} />
        <InputField label={tg("currency_symbol")} value={currencySymbol} onChange={setCurrencySymbol} />
        <SelectField
          label={tg("default_language")}
          value={defaultLang}
          onChange={setDefaultLang}
          options={[
            { value: "en", label: "English" },
            { value: "ar", label: "العربية" },
            { value: "fr", label: "Français" },
          ]}
        />
      </div>
    </SectionCard>
  );
}
