// Pure macro (canned response) helpers shared by the server actions, the Macros tab
// and the Inbox composer picker.

export const MACRO_LOCALES = ["en", "fr", "ar"] as const;
export const MACRO_ROLES = ["customer", "rider", "merchant", "agent"] as const;

export type MacroLocale = (typeof MACRO_LOCALES)[number];
export type MacroRole = (typeof MACRO_ROLES)[number];

export interface MacroRow {
  id: string;
  title: string;
  body: string;
  /** null = any language */
  locale: MacroLocale | null;
  /** null = any role */
  target_role: MacroRole | null;
  uses: number;
  created_at: string;
  updated_at: string;
}

export interface MacroInput {
  title: string;
  body: string;
  locale: MacroLocale | null;
  target_role: MacroRole | null;
}

export const MACRO_TITLE_MAX = 120;
export const MACRO_BODY_MAX = 2000;

/** Trims and validates a macro form. Returns the clean input or an error code. */
export function parseMacroInput(raw: {
  title?: unknown;
  body?: unknown;
  locale?: unknown;
  target_role?: unknown;
}): { ok: true; value: MacroInput } | { ok: false; error: "title" | "body" | "locale" | "role" } {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!title || title.length > MACRO_TITLE_MAX) return { ok: false, error: "title" };
  if (!body || body.length > MACRO_BODY_MAX) return { ok: false, error: "body" };
  const locale = raw.locale == null || raw.locale === "" ? null : raw.locale;
  if (locale !== null && !(MACRO_LOCALES as readonly unknown[]).includes(locale)) {
    return { ok: false, error: "locale" };
  }
  const role = raw.target_role == null || raw.target_role === "" ? null : raw.target_role;
  if (role !== null && !(MACRO_ROLES as readonly unknown[]).includes(role)) {
    return { ok: false, error: "role" };
  }
  return {
    ok: true,
    value: { title, body, locale: locale as MacroLocale | null, target_role: role as MacroRole | null },
  };
}

/**
 * Macros that fit a conversation: a macro with no locale/role fits any; one with a
 * locale/role fits only matching conversations (unknown conversation values fit all).
 */
export function macrosFor<T extends Pick<MacroRow, "locale" | "target_role">>(
  macros: T[],
  conv: { locale?: string | null; role?: string | null }
): T[] {
  return macros.filter(
    (m) =>
      (!m.locale || !conv.locale || m.locale === conv.locale) &&
      (!m.target_role || !conv.role || m.target_role === conv.role)
  );
}

/** Case-insensitive title/body search. */
export function searchMacros<T extends Pick<MacroRow, "title" | "body">>(macros: T[], q: string): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return macros;
  return macros.filter((m) => m.title.toLowerCase().includes(s) || m.body.toLowerCase().includes(s));
}
