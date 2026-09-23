import { describe, expect, it } from "vitest";
import { DICTIONARIES, flattenDictionary, getDictionary, t } from "../i18n/dictionaries";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  isLocale,
  localeFromAcceptLanguage,
  normalizeLocale,
} from "../i18n/locales";

describe("locales", () => {
  it("registers English, Bengali, Hindi and Tamil", () => {
    expect(LOCALES).toEqual(["en", "bn", "hi", "ta"]);
    expect(DEFAULT_LOCALE).toBe("en");
    for (const id of LOCALES) {
      expect(LOCALE_META[id].id).toBe(id);
      expect(LOCALE_META[id].label.length).toBeGreaterThan(0);
    }
    expect(LOCALE_META.bn.label).toBe("বাংলা");
  });

  it("normalises loose input", () => {
    expect(isLocale("bn")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(normalizeLocale("bn-IN")).toBe("bn");
    expect(normalizeLocale(" HI ")).toBe("hi");
    expect(normalizeLocale("ta_IN")).toBe("ta");
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale(42)).toBe("en");
  });

  it("honours Accept-Language quality values", () => {
    expect(localeFromAcceptLanguage("bn-IN,bn;q=0.9,en;q=0.8")).toBe("bn");
    expect(localeFromAcceptLanguage("fr-FR,fr;q=0.9")).toBeUndefined();
    expect(localeFromAcceptLanguage("en;q=0.5, ta;q=0.9")).toBe("ta");
    expect(localeFromAcceptLanguage(null)).toBeUndefined();
  });
});

describe("dictionaries", () => {
  const enKeys = Object.keys(flattenDictionary(DICTIONARIES.en)).sort();

  it("every locale covers every English key with a non-empty string", () => {
    for (const id of LOCALES) {
      const flat = flattenDictionary(DICTIONARIES[id]);
      expect(Object.keys(flat).sort(), `${id} keys`).toEqual(enKeys);
      for (const [key, value] of Object.entries(flat)) {
        expect(value.trim().length, `${id}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps placeholders consistent across locales", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const en = flattenDictionary(DICTIONARIES.en);
    for (const id of LOCALES) {
      const flat = flattenDictionary(DICTIONARIES[id]);
      for (const key of Object.keys(en)) {
        expect(placeholders(flat[key]), `${id}.${key}`).toEqual(placeholders(en[key]));
      }
    }
  });

  it("actually translates the Bengali UI", () => {
    const bn = getDictionary("bn");
    expect(bn.nav.signIn).toBe("সাইন ইন");
    expect(bn.nav.world).toBe("বিশ্ব");
    expect(bn.nav.top).not.toBe(DICTIONARIES.en.nav.top);
  });

  it("falls back to English for unknown locales", () => {
    expect(getDictionary("xx" as never)).toBe(DICTIONARIES.en);
  });

  it("interpolates placeholders", () => {
    expect(t("Hello, {name}", { name: "Mithu" })).toBe("Hello, Mithu");
    expect(t("{count} outlets", { count: 3 })).toBe("3 outlets");
    expect(t("{missing}")).toBe("{missing}");
  });
});
