"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { SectionCard, SelectField } from "./settings-field";
import { setLocale } from "@/i18n/actions";
import { type Locale } from "@/i18n/config";

export function AppearanceSettings() {
  const t = useTranslations("settings");
  const ta = useTranslations("settings.appearance");
  const locale = useLocale();
  const router = useRouter();

  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState(locale);
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");
  const [rowsPerPage, setRowsPerPage] = useState("50");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") ?? "dark");
  }, []);

  async function handleSave() {
    // Apply theme
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    // Apply language
    if (language !== locale) {
      await setLocale(language as Locale);
      router.refresh();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SectionCard
      title={ta("title")}
      description={ta("description")}
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
        <SelectField
          label={ta("theme")}
          value={theme}
          onChange={setTheme}
          options={[
            { value: "dark", label: ta("dark") },
            { value: "light", label: ta("light") },
          ]}
        />
        <SelectField
          label={ta("language")}
          value={language}
          onChange={setLanguage}
          options={[
            { value: "en", label: "English" },
            { value: "ar", label: "العربية" },
            { value: "fr", label: "Français" },
          ]}
        />
        <SelectField
          label={ta("date_format")}
          value={dateFormat}
          onChange={setDateFormat}
          options={[
            { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
            { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
            { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
          ]}
        />
        <SelectField
          label={ta("rows_per_page")}
          value={rowsPerPage}
          onChange={setRowsPerPage}
          options={[
            { value: "25", label: "25" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
        />
      </div>
    </SectionCard>
  );
}
