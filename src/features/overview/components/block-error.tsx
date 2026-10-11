"use client";

import { useTranslations } from "next-intl";

export function BlockError() {
  const t = useTranslations("overview");
  return <p className="text-sm text-danger py-6 text-center">{t("block_error")}</p>;
}
