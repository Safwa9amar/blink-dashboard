"use client";

import { useTranslations } from "next-intl";
import { STAFF_ROLES, type StaffRole } from "../data";

export const FIELD =
  "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text outline-none focus:border-primary";
export const LABEL = "block text-sm font-medium text-subtext mb-1";

/** Maps a server action `error` to a translated message (known key) or the raw text. */
export function useErrorText() {
  const t = useTranslations("access");
  return (error: string): string => (t.has(`errors.${error}` as never) ? t(`errors.${error}` as never) : error);
}

/** Role <select> with the selected role's description underneath. */
export function RoleSelect({
  value,
  onChange,
  id,
}: {
  value: StaffRole;
  onChange: (r: StaffRole) => void;
  id?: string;
}) {
  const t = useTranslations("access");
  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as StaffRole)}
        className={`${FIELD} cursor-pointer`}
      >
        {STAFF_ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}.name`)}
          </option>
        ))}
      </select>
      <p className="text-xs text-subtext mt-1.5">{t(`roles.${value}.desc`)}</p>
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mt-4 px-3 py-2 bg-danger-light border border-danger/20 rounded-xl">
      <p className="text-danger text-sm">{children}</p>
    </div>
  );
}
