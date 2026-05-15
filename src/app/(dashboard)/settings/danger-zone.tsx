"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SectionCard } from "./settings-field";

export function DangerZone() {
  const td = useTranslations("settings.danger_zone");
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <SectionCard title={td("title")} description={td("description")}>
      <div className="space-y-4">
        {/* Export */}
        <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{td("export_data")}</p>
          </div>
          <Button variant="secondary" size="sm">
            {td("export")}
          </Button>
        </div>

        {/* Reset */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-[var(--danger)]">{td("reset_data")}</p>
          </div>
          {!confirmReset ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
              {td("reset")}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-xs text-[var(--danger)] max-w-xs text-end">{td("reset_confirm")}</p>
              <Button variant="secondary" size="xs" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="xs">
                {td("reset")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
