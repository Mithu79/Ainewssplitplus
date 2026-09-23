"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TranslateTarget } from "@/lib/i18n/locales";

/**
 * Client-side translation state for the one-click "Read in" feature.
 *
 * Holds the visitor's preferred language (persisted in localStorage), a
 * translation cache shared by every card on the page, and a micro-batching
 * queue: when a whole feed swaps at once, all pending segments are shipped to
 * POST /api/translate in a handful of batched calls instead of one request per
 * headline.
 */

const TARGET_STORAGE_KEY = "ns-translate-target";
const CLIENT_CACHE_MAX = 4000;
const BATCH_DELAY_MS = 40;
const MAX_BATCH_TEXTS = 8; // mirrors TRANSLATE_MAX_TEXTS

interface TranslateContextValue {
  /** `null` = show headlines exactly as the publisher filed them. */
  target: TranslateTarget | null;
  setTarget: (target: TranslateTarget | null) => void;
  /** Resolves a single segment's translation (cached + batched). */
  getTranslation: (text: string, source: string | undefined, target: TranslateTarget) => Promise<string>;
}

const TranslateContext = createContext<TranslateContextValue | null>(null);

interface QueueItem {
  text: string;
  source: string | undefined;
  target: TranslateTarget;
  resolve: (translated: string) => void;
  reject: (error: unknown) => void;
}

function cacheKey(target: TranslateTarget, source: string | undefined, text: string): string {
  return `${target}\u0000${source ?? "auto"}\u0000${text}`;
}

export function TranslateProvider({ children }: { children: React.ReactNode }) {
  const [target, setTargetState] = useState<TranslateTarget | null>(null);
  const cacheRef = useRef(new Map<string, string>());
  const inflightRef = useRef(new Map<string, Promise<string>>());
  const queueRef = useRef<QueueItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the saved preference after mount (SSR always paints originals first).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TARGET_STORAGE_KEY);
      if (saved === "bn" || saved === "en" || saved === "hi") setTargetState(saved);
    } catch {
      /* private mode — stay with originals */
    }
  }, []);

  const setTarget = useCallback((next: TranslateTarget | null) => {
    setTargetState(next);
    try {
      if (next) window.localStorage.setItem(TARGET_STORAGE_KEY, next);
      else window.localStorage.removeItem(TARGET_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const flush = useCallback(async () => {
    const pending = queueRef.current.splice(0, queueRef.current.length);
    if (pending.length === 0) return;

    // Group by (target, source) so each group becomes one batched POST.
    const groups = new Map<string, QueueItem[]>();
    for (const item of pending) {
      const key = `${item.target}\u0000${item.source ?? "auto"}`;
      const group = groups.get(key);
      if (group) group.push(item);
      else groups.set(key, [item]);
    }

    for (const group of groups.values()) {
      // Split oversized groups into legal batch sizes.
      for (let start = 0; start < group.length; start += MAX_BATCH_TEXTS) {
        const batch = group.slice(start, start + MAX_BATCH_TEXTS);
        // De-duplicate identical segments inside the batch.
        const uniqueTexts = [...new Set(batch.map((item) => item.text))];
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              texts: uniqueTexts,
              target: batch[0].target,
              source: batch[0].source,
            }),
          });
          const data = (await response.json()) as {
            ok?: boolean;
            error?: string;
            segments?: { translatedText?: string }[];
          };
          if (!response.ok || !data.ok || !data.segments) {
            throw new Error(data.error ?? `Translation failed (HTTP ${response.status})`);
          }
          const byText = new Map<string, string>();
          uniqueTexts.forEach((text, index) => {
            byText.set(text, data.segments?.[index]?.translatedText ?? text);
          });
          for (const item of batch) {
            const translated = byText.get(item.text) ?? item.text;
            cacheRef.current.set(cacheKey(item.target, item.source, item.text), translated);
            item.resolve(translated);
          }
        } catch (error) {
          for (const item of batch) item.reject(error);
        }
      }
    }
  }, []);

  const getTranslation = useCallback(
    (text: string, source: string | undefined, target: TranslateTarget): Promise<string> => {
      const key = cacheKey(target, source, text);
      const cached = cacheRef.current.get(key);
      if (cached !== undefined) return Promise.resolve(cached);
      const inflight = inflightRef.current.get(key);
      if (inflight) return inflight;
      if (source && source.split(/[-_]/)[0] === target) return Promise.resolve(text);

      const promise = new Promise<string>((resolve, reject) => {
        queueRef.current.push({ text, source, target, resolve, reject });
        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            void flush();
          }, BATCH_DELAY_MS);
        }
      }).finally(() => {
        inflightRef.current.delete(key);
      });

      inflightRef.current.set(key, promise);
      return promise;
    },
    [flush],
  );

  // Keep the client-side cache bounded.
  useEffect(() => {
    const cache = cacheRef.current;
    while (cache.size > CLIENT_CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  });

  const value = useMemo<TranslateContextValue>(
    () => ({ target, setTarget, getTranslation }),
    [target, setTarget, getTranslation],
  );

  return <TranslateContext.Provider value={value}>{children}</TranslateContext.Provider>;
}

export function useTranslate(): TranslateContextValue {
  const ctx = useContext(TranslateContext);
  if (!ctx) throw new Error("useTranslate must be used inside <TranslateProvider>");
  return ctx;
}
