"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { useNewsSettingsStore } from "@/features/news";
import { SectionCard, InputField } from "./settings-field";

export function NewsSettings() {
  const t = useTranslations("settings");
  const tn = useTranslations("settings.news");
  const maxBodyImages = useNewsSettingsStore((s) => s.maxBodyImages);
  const maxBodyLength = useNewsSettingsStore((s) => s.maxBodyLength);
  const setMaxBodyImages = useNewsSettingsStore((s) => s.setMaxBodyImages);
  const setMaxBodyLength = useNewsSettingsStore((s) => s.setMaxBodyLength);

  const [images, setImages] = useState(String(maxBodyImages));
  const [length, setLength] = useState(String(maxBodyLength));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setMaxBodyImages(Number(images) || 0);
    setMaxBodyLength(Number(length) || 0);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label={tn("max_images")} value={images} onChange={setImages} type="number" />
        <InputField label={tn("max_length")} value={length} onChange={setLength} type="number" />
      </div>
      <p className="text-xs text-[var(--subtext)] mt-3">{tn("hint")}</p>
    </SectionCard>
  );
}
