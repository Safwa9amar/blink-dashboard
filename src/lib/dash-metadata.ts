import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Builds per-page <head> metadata from a translation namespace.
 * The localized "title" composes with the root template → "Support · Blink".
 * An optional `badge` (a headline stat) is prefixed → "(42) Support · Blink".
 */
export async function pageMeta(namespace: string, badge?: string | number): Promise<Metadata> {
  const t = await getTranslations(namespace);
  const title = t("title");
  const hasBadge = badge !== undefined && badge !== null && `${badge}` !== "";
  return {
    title: hasBadge ? `(${badge}) ${title}` : title,
    description: t("description"),
  };
}
