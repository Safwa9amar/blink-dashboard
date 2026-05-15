import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

const messageImports = {
  en: () => import("../../messages/en.json"),
  ar: () => import("../../messages/ar.json"),
  fr: () => import("../../messages/fr.json"),
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(localeCookie as Locale)
    ? (localeCookie as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await messageImports[locale]()).default,
  };
});
