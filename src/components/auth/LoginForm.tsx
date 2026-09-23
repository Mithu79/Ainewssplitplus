"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { GoogleButton } from "./GoogleButton";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function LoginForm({
  googleEnabled,
  callbackUrl,
  initialError,
}: {
  googleEnabled: boolean;
  callbackUrl: string;
  initialError?: string;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ? dict.auth.invalidCredentials : null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        setError(dict.auth.invalidCredentials);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(dict.auth.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="display text-2xl">{dict.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-muted">{dict.auth.loginSubtitle}</p>
      </header>

      <GoogleButton enabled={googleEnabled} callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        {dict.auth.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <Field label={dict.auth.email}>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={dict.auth.password}>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="button button-primary mt-1 w-full justify-center">
          {busy ? dict.auth.working : dict.auth.signInButton}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {dict.auth.noAccount}{" "}
        <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          {dict.nav.signUp}
        </Link>
      </p>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </label>
  );
}
