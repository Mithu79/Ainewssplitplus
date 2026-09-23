"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export interface SessionUserSummary {
  name: string;
  email: string;
  image?: string | null;
}

/**
 * Navbar account control. Signed-out visitors get a "Sign in" link; signed-in
 * readers get an avatar button with a small dropdown (dashboard, sign out).
 */
export function AccountMenu({ user, className = "" }: { user: SessionUserSummary | null; className?: string }) {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className={`button h-9 px-3 text-xs ${className}`} data-testid="nav-sign-in">
        <Icon name="users" className="h-4 w-4" />
        <span className="hidden sm:inline">{dict.nav.signIn}</span>
      </Link>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.nav.account}
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-line bg-surface text-xs font-bold text-ink transition hover:border-line-strong"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-[70] w-60 overflow-hidden rounded-2xl border border-line bg-bg p-1.5 shadow-[var(--shadow-lg)]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 border-t border-line" />
          <Link
            role="menuitem"
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
          >
            <Icon name="sliders" className="h-4 w-4" />
            {dict.nav.dashboard}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
          >
            <Icon name="close" className="h-4 w-4" />
            {dict.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
