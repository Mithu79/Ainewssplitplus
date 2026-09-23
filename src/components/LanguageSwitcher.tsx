"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locales";

/**
 * Navbar language picker. Writes the `ns-locale` cookie via /api/locale and
 * refreshes the current route so every server component re-renders in the
 * new language.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  async function change(next: Locale) {
    if (next === locale) return;
    setSaving(true);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      // Also set it client-side so the change is instant even if the API is slow.
      document.cookie = `ns-locale=${next}; path=/; max-age=31536000; samesite=lax`;
    } finally {
      setSaving(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{dict.nav.language}</span>
      <select
        aria-label={dict.nav.language}
        data-testid="language-switcher"
        value={locale}
        disabled={saving || pending}
        onChange={(event) => change(event.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-line bg-surface pl-3 pr-7 text-xs font-semibold text-ink transition hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
      >
        {LOCALES.map((id) => (
          <option key={id} value={id}>
            {LOCALE_META[id].label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
