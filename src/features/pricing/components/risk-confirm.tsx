"use client";

import { useTranslations } from "next-intl";
import { Button, DashIcon } from "@/components/ui";
import type { RiskCode } from "../help";

/**
 * Plain-language warnings shown instead of the save button for risky edits. Nothing is saved
 * until the person presses the confirm button.
 */
export function RiskConfirm({
  risks,
  pending,
  creating,
  onBack,
  onConfirm,
}: {
  risks: RiskCode[];
  pending?: boolean;
  /** Button says "create" instead of "save". */
  creating?: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("pricing");
  return (
    <div role="alertdialog" aria-labelledby="risk-title" className="rounded-xl border border-warning/50 bg-warning-light p-3.5 space-y-3">
      <div>
        <p id="risk-title" className="flex items-center gap-1.5 text-[13px] font-bold text-warning">
          <DashIcon name="warn" className="h-4 w-4 shrink-0" />
          {t("risk.title")}
        </p>
        <p className="mt-0.5 text-[12.5px] text-text">{t("risk.intro")}</p>
      </div>
      <ul className="space-y-2">
        {risks.map((r) => (
          <li key={r} className="rounded-lg bg-card px-3 py-2">
            <p className="text-[13px] font-semibold text-text">{t(`risk.${r}.title`)}</p>
            <p className="mt-0.5 text-[12.5px] text-subtext">{t(`risk.${r}.body`)}</p>
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onBack} disabled={pending}>
          {t("risk.back")}
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={onConfirm} loading={pending}>
          {creating ? t("risk.confirm_create") : t("risk.confirm")}
        </Button>
      </div>
    </div>
  );
}
