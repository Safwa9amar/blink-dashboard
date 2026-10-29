"use client";

import { useTranslations } from "next-intl";
import { INPUT } from "./auth-shell";

/** 6-digit one-time-code input: digits only, paste-friendly, always LTR. */
export function CodeField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const t = useTranslations("auth");
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      dir="ltr"
      maxLength={6}
      pattern="[0-9]{6}"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onPaste={(e) => {
        e.preventDefault();
        onChange(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
      }}
      required
      placeholder={t("code_placeholder")}
      className={`${INPUT} text-center text-xl tracking-[0.5em] font-mono`}
    />
  );
}
