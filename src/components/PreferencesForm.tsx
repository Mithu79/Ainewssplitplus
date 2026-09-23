"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Field } from "./auth/LoginForm";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locales";

export function PreferencesForm({ initialLocale, initialRegion }: { initialLocale: Locale; initialRegion: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [region, setRegion] = useState(initialRegion);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/prefs", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, region }),
      });
      if (!res.ok) throw new Error(String(res.status));
      document.cookie = `ns-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
      setStatus("saved");
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={dict.dashboard.preferredLanguage} hint={dict.dashboard.preferredLanguageHint}>
        <select
          name="locale"
          data-testid="dashboard-locale"
          className="input"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map((id) => (
            <option key={id} value={id}>
              {LOCALE_META[id].label} · {LOCALE_META[id].english}
            </option>
          ))}
        </select>
      </Field>

      <Field label={dict.dashboard.localRegion} hint={dict.dashboard.localRegionHint}>
        <input
          className="input"
          name="region"
          maxLength={80}
          placeholder="Kolkata, West Bengal"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={status === "saving"} className="button button-primary">
          {status === "saving" ? dict.auth.working : dict.dashboard.save}
        </button>
        {status === "saved" && (
          <span role="status" className="text-sm font-medium text-ok">
            {dict.dashboard.saved}
          </span>
        )}
        {status === "error" && (
          <span role="alert" className="text-sm font-medium text-accent">
            {dict.dashboard.saveError}
          </span>
        )}
      </div>
    </form>
  );
}
