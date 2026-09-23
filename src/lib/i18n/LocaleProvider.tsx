"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionaries";
import type { Locale } from "./locales";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Makes the server-resolved locale + dictionary available to client components. */
export function LocaleProvider({ locale, dict, children }: LocaleContextValue & { children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used inside <LocaleProvider>");
  return ctx;
}
