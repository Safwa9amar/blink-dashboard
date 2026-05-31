"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

const localeLabels: Record<Locale, { flag: string; key: string }> = {
  en: { flag: "🇬🇧", key: "english" },
  ar: { flag: "🇩🇿", key: "arabic" },
  fr: { flag: "🇫🇷", key: "french" },
};

export function LanguageSwitcher({ vertical = false }: { vertical?: boolean }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(newLocale: Locale) {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  }

  return (
    <div className={`flex items-center gap-1 ${vertical ? "flex-col" : ""}`}>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          disabled={isPending}
          title={t(localeLabels[l].key)}
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
            locale === l
              ? "bg-soft-pink border border-soft-border"
              : "hover:bg-card-hover border border-transparent"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {localeLabels[l].flag}
        </button>
      ))}
    </div>
  );
}
