"use client";

import { useTranslations } from "next-intl";
import { canAccessPath } from "@/lib/auth/access";
import { ALL_SECTIONS, STAFF_ROLES } from "../data";

// Read-only roles × sections grid. Cells come straight from canAccessPath, so the
// matrix is an exact mirror of what the middleware/nav/guards actually enforce.
export function PermissionMatrix() {
  const t = useTranslations("access");
  const ts = useTranslations("sidebar");

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-text">{t("matrix.title")}</h3>
        <p className="text-[13px] text-subtext mt-0.5">{t("matrix.desc")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3.5 text-start text-[11px] font-semibold text-subtext uppercase tracking-wider">
                {t("matrix.section")}
              </th>
              {STAFF_ROLES.map((role) => (
                <th
                  key={role}
                  className="px-4 py-3.5 text-center text-[11px] font-semibold text-subtext uppercase tracking-wider whitespace-nowrap"
                >
                  {t(`roles.${role}.name`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ALL_SECTIONS.map((section) => (
              <tr key={section.href} className="text-text hover:bg-card-hover transition-colors">
                <td className="px-6 py-3 font-medium whitespace-nowrap">{ts(section.key)}</td>
                {STAFF_ROLES.map((role) => {
                  const allowed = canAccessPath(role, section.href);
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      {allowed ? (
                        <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-success/15 text-success" title={t("matrix.allowed")}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-subtext/40" title={t("matrix.denied")}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
