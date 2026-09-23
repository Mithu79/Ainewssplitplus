import { cookies, headers } from "next/headers";
import { getDictionary, type Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, LOCALE_COOKIE, localeFromAcceptLanguage, normalizeLocale, type Locale } from "./locales";

/**
 * Resolve the visitor's locale on the server.
 * Priority: `ns-locale` cookie → `Accept-Language` header → English.
 * Server components, route handlers and layouts all call this so the whole
 * response agrees on one language.
 */
export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  const h = await headers();
  return localeFromAcceptLanguage(h.get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
