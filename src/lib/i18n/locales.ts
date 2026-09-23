/**
 * Locale registry for the NewsSplit UI.
 *
 * The UI chrome (navigation, labels, footer, auth forms) is translated;
 * headlines render exactly as the publisher filed them by default — visitors
 * can opt into one-click machine translation (Google Cloud Translation) via
 * the "Read in" control and /api/translate.
 */

export const LOCALES = ["en", "bn", "hi", "ta"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that remembers the visitor's language for a year. */
export const LOCALE_COOKIE = "ns-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface LocaleMeta {
  id: Locale;
  /** Native-script name shown in the switcher. */
  label: string;
  /** English name for tooltips / aria labels. */
  english: string;
  /** BCP-47 tag for `<html lang>`. */
  htmlLang: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { id: "en", label: "English", english: "English", htmlLang: "en" },
  bn: { id: "bn", label: "বাংলা", english: "Bengali", htmlLang: "bn" },
  hi: { id: "hi", label: "हिन्दी", english: "Hindi", htmlLang: "hi" },
  ta: { id: "ta", label: "தமிழ்", english: "Tamil", htmlLang: "ta" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Locales offered by the one-click "Read in" machine-translation control
 * (Bengali, English, Hindi). These are also the `target` values accepted by
 * POST /api/translate. Kept isomorphic: safe to import from client components.
 */
export const TRANSLATE_TARGETS = ["bn", "en", "hi"] as const;
export type TranslateTarget = (typeof TRANSLATE_TARGETS)[number];

export function isTranslateTarget(value: unknown): value is TranslateTarget {
  return typeof value === "string" && (TRANSLATE_TARGETS as readonly string[]).includes(value);
}

/** Coerce any user supplied value (cookie, query, form) to a known locale. */
export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const lower = value.trim().toLowerCase();
  if (isLocale(lower)) return lower;
  // Accept regional variants such as "bn-IN" or "hi_IN".
  const base = lower.split(/[-_]/)[0];
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

/**
 * Pick the best locale from an `Accept-Language` header.
 * Returns `undefined` when nothing matches so callers can fall back to a cookie or the default.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | undefined {
  if (!header) return undefined;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  for (const { tag } of ranked) {
    const base = tag.split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return undefined;
}
