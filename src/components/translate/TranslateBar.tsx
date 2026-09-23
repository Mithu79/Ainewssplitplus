"use client";

import { useTranslate } from "./TranslateProvider";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { TRANSLATE_TARGETS, type TranslateTarget } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";

const TARGET_LABELS: Record<TranslateTarget, string> = {
  bn: "বাংলা",
  hi: "हिन्दी",
  en: "English",
};

/**
 * The one-click translation control. Pick a language and every headline and
 * standfirst on the page swaps to a Google Cloud Translation rendering; pick
 * it again (or "as filed") to return to the publisher's original words.
 */
export function TranslateBar({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { dict } = useI18n();
  const { target, setTarget } = useTranslate();

  return (
    <div
      role="group"
      aria-label={dict.translate.label}
      data-testid="translate-bar"
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-[12px] border border-line bg-surface px-2.5 py-1.5",
        compact ? "text-[11px]" : "text-xs",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 pr-1 font-bold uppercase tracking-[0.12em] text-faint">
        <Icon name="globe" className="h-3.5 w-3.5" />
        {dict.translate.label}
      </span>

      {TRANSLATE_TARGETS.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={target === id}
          onClick={() => setTarget(target === id ? null : id)}
          lang={id}
          className={cn(
            "chip transition",
            target === id ? "!border-ink bg-ink text-bg hover:text-bg" : "hover:text-ink",
          )}
        >
          {TARGET_LABELS[id]}
        </button>
      ))}

      <button
        type="button"
        aria-pressed={target === null}
        onClick={() => setTarget(null)}
        className={cn("chip transition", target === null ? "!border-ink bg-ink text-bg hover:text-bg" : "hover:text-ink")}
      >
        {dict.translate.original}
      </button>

      {target && (
        <span className="ml-0.5 hidden text-[10px] leading-tight text-faint sm:inline">{dict.translate.note}</span>
      )}
    </div>
  );
}
