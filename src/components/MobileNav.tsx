"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORY_ICON, Icon, LogoMark } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { CategoryMeta } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function MobileNav({ categories }: { categories: CategoryMeta[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { dict } = useI18n();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-button lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <Icon name="menu" className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />
          <nav
            id="mobile-nav"
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-1 overflow-y-auto border-l border-line bg-bg p-4 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="display flex items-center gap-2 text-lg">
                <LogoMark className="h-7 w-7" />
                News<span className="text-accent">Split</span>
              </span>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button type="button" onClick={() => setOpen(false)} className="icon-button" aria-label="Close menu">
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-xs font-semibold text-muted">{dict.nav.language}</span>
              <LanguageSwitcher />
            </div>

            <p className="kicker px-2 pb-1 pt-3 text-faint">{dict.footer.categories}</p>
            {categories.map((category) => {
              const active = pathname.startsWith(`/category/${category.id}`);
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-surface text-ink" : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-lg"
                    style={{
                      color: category.accent,
                      backgroundColor: `color-mix(in oklab, ${category.accent} 14%, transparent)`,
                    }}
                  >
                    <Icon name={CATEGORY_ICON[category.icon] ?? "newspaper"} className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{category.label}</span>
                  <Icon name="chevronRight" className="h-4 w-4 text-faint" />
                </Link>
              );
            })}

            <p className="kicker px-2 pb-1 pt-4 text-faint">NewsSplit</p>
            {[
              { href: "/dashboard", label: dict.nav.dashboard, icon: "sliders" as const },
              { href: "/sources", label: dict.nav.sources, icon: "activity" as const },
              { href: "/about", label: dict.nav.about, icon: "sparkles" as const },
              { href: "/feed", label: dict.footer.rssOutput, icon: "rss" as const },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink"
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
