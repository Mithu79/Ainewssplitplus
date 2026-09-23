"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Field } from "./LoginForm";
import { GoogleButton } from "./GoogleButton";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function SignupForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function messageFor(code: string): string {
    switch (code) {
      case "email-taken":
        return dict.auth.emailTaken;
      case "weak-password":
        return dict.auth.weakPassword;
      case "invalid-email":
        return dict.auth.invalidEmail;
      default:
        return dict.auth.genericError;
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(dict.auth.passwordsDontMatch);
      return;
    }
    if (password.length < 8) {
      setError(dict.auth.weakPassword);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(messageFor(body.error ?? ""));
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        router.push("/login");
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
        <h1 className="display text-2xl">{dict.auth.signupTitle}</h1>
        <p className="mt-1 text-sm text-muted">{dict.auth.signupSubtitle}</p>
      </header>

      <GoogleButton enabled={googleEnabled} callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        {dict.auth.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <Field label={dict.auth.name}>
          <input className="input" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
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
        <Field label={dict.auth.password} hint={dict.auth.passwordHint}>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label={dict.auth.confirmPassword}>
          <input
            className="input"
            type="password"
            name="confirm"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="button button-primary mt-1 w-full justify-center">
          {busy ? dict.auth.working : dict.auth.signUpButton}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {dict.auth.haveAccount}{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          {dict.nav.signIn}
        </Link>
      </p>
    </div>
  );
}
