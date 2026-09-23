"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslate } from "./TranslateProvider";
import type { TranslateTarget } from "@/lib/i18n/locales";

/**
 * Renders one text segment (headline / standfirst) and swaps it in place when
 * the visitor picks a "Read in" language. Originals are what the server
 * renders — the swap is a pure progressive enhancement, so crawlers and
 * readers without JS always see the headline exactly as the publisher filed it.
 */
export function TranslatableText({
  text,
  lang,
  className,
  truncate,
}: {
  text: string;
  /** Language the segment was filed in (defaults to English). */
  lang?: string;
  className?: string;
  /** Optional display truncation, applied to whichever language is shown. */
  truncate?: number;
}) {
  const { target, getTranslation } = useTranslate();
  const [display, setDisplay] = useState(text);
  const [busy, setBusy] = useState(false);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const original = textRef.current;
    const source = lang ?? "en";
    if (!target || source.split(/[-_]/)[0] === target) {
      setDisplay(original);
      setBusy(false);
      return;
    }

    let active = true;
    setBusy(true);
    getTranslation(original, lang, target)
      .then((translated) => {
        if (active) {
          setDisplay(translated);
          setBusy(false);
        }
      })
      .catch(() => {
        // Graceful fallback: keep the publisher's own words on screen.
        if (active) {
          setDisplay(original);
          setBusy(false);
        }
      });

    return () => {
      active = false;
    };
  }, [target, lang, getTranslation]);

  const shown = truncate && display.length > truncate ? `${display.slice(0, Math.max(0, truncate - 1)).trimEnd()}…` : display;
  const translated = Boolean(target && (lang ?? "en").split(/[-_]/)[0] !== target);
  const shownLang: string | undefined = translated && target ? target : lang;

  return (
    <span
      className={className}
      lang={shownLang}
      translate={translated ? "no" : undefined}
      data-translated={translated ? "true" : undefined}
      aria-busy={busy || undefined}
    >
      {shown}
    </span>
  );
}
