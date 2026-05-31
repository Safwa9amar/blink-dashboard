"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { STAFF_ROLES, sectionKeysForRole } from "../data";
import { RoleBadge } from "./role-badge";

// A reference grid: one card per dashboard role, with the sections it can reach
// (derived from ROLE_ACCESS, so it always mirrors what's actually enforced).
export function RolesReference() {
  const t = useTranslations("access");
  const ts = useTranslations("sidebar");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {STAFF_ROLES.map((role) => {
        const sections = sectionKeysForRole(role);
        return (
          <Card key={role}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-base font-bold text-text">{t(`roles.${role}.name`)}</h3>
              <RoleBadge role={role} />
            </div>
            <p className="text-[13px] text-subtext mb-4">{t(`roles.${role}.desc`)}</p>

            {sections === "all" ? (
              <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-soft-pink text-primary">
                {t("full_access")}
              </div>
            ) : (
              <>
                <div className="text-[10px] font-bold text-subtext uppercase tracking-wider mb-1.5 opacity-75">
                  {t("can_access")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sections.map((key) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium bg-background border border-border text-subtext"
                    >
                      {ts(key)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
