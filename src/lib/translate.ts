import { config } from "./config";
import { decodeEntities } from "./text";
import type { TranslateTarget } from "./i18n/locales";

/**
 * Server-side Google Cloud Translation client (Translation API v2 REST).
 *
 * The API key never leaves the server: browsers call POST /api/translate and
 * this module is the only place that talks to `translation.googleapis.com`.
 * Results are memoised in a small LRU so a page of cards that all say the same
 * standfirst only bills once.
 *
 * Docs: https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */

export type { TranslateTarget };

export interface TranslateSegmentsOptions {
  /** Original strings (titles, standfirsts) in source order. */
  texts: string[];
  target: TranslateTarget;
  /** Optional BCP-47 source hint (e.g. an article's declared language). */
  source?: string;
  /** Overrides `config.googleTranslateApiKey` — used by tests. */
  apiKey?: string;
  timeoutMs?: number;
}

export interface TranslatedSegment {
  text: string;
  translatedText: string;
  /** Present when Google auto-detected the source language. */
  detectedSourceLanguage?: string;
}

export type TranslateSegmentsResult =
  | { ok: true; segments: TranslatedSegment[] }
  | { ok: false; code: "not-configured" | "upstream"; error: string };

const GOOGLE_TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

/** LRU cache keyed by `target\0source\0text`. */
const MAX_CACHE_ENTRIES = 2000;
const cache = new Map<string, string>();

export function translateCacheKey(target: string, source: string | undefined, text: string): string {
  return `${target}\u0000${source ?? "auto"}\u0000${text}`;
}

export function clearTranslateCache(): void {
  cache.clear();
}

function cacheGet(key: string): string | undefined {
  const hit = cache.get(key);
  if (hit === undefined) return undefined;
  // Refresh LRU position.
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function cacheSet(key: string, value: string): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Translate `texts` into `target`, preserving input order and duplicates.
 *
 * - Segments already in the target language (declared `source === target`)
 *   short-circuit to the original without an API call.
 * - Cache misses are de-duplicated and shipped as one batch request.
 */
export async function translateSegments(options: TranslateSegmentsOptions): Promise<TranslateSegmentsResult> {
  const { texts, target, source, timeoutMs = 10_000 } = options;
  const apiKey = options.apiKey ?? config.googleTranslateApiKey;
  const normalized = texts.map((text) => text.trim());

  // Same-language request: return the originals untouched, no key needed.
  if (source && source.split(/[-_]/)[0] === target) {
    return { ok: true, segments: normalized.map((text) => ({ text, translatedText: text, detectedSourceLanguage: source })) };
  }

  if (!apiKey) {
    return {
      ok: false,
      code: "not-configured",
      error: "Translation is not configured on this deployment — set GOOGLE_TRANSLATE_API_KEY.",
    };
  }

  // 1. Serve whatever the cache already knows.
  const resolved = new Array<string | undefined>(normalized.length);
  const missing = new Map<string, string>(); // text → text (de-duplicated, insertion ordered)
  normalized.forEach((text, index) => {
    if (!text) {
      resolved[index] = text;
      return;
    }
    const hit = cacheGet(translateCacheKey(target, source, text));
    if (hit !== undefined) resolved[index] = hit;
    else missing.set(text, text);
  });

  // 2. One batch call for every cache miss.
  if (missing.size > 0) {
    const batch = [...missing.values()];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(GOOGLE_TRANSLATE_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          q: batch,
          target,
          source: source?.split(/[-_]/)[0],
          format: "text",
          model: config.googleTranslateModel,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      return {
        ok: false,
        code: "upstream",
        error: `Translation request failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        code: "upstream",
        error: `Google Cloud Translation returned ${response.status}. ${detail.slice(0, 300)}`,
      };
    }

    type GoogleTranslation = { translatedText?: string; detectedSourceLanguage?: string };
    let payload: { data?: { translations?: GoogleTranslation[] } } | undefined;
    try {
      payload = (await response.json()) as { data?: { translations?: GoogleTranslation[] } };
    } catch {
      return { ok: false, code: "upstream", error: "Google Cloud Translation returned an unreadable response." };
    }

    const translations = payload?.data?.translations ?? [];
    if (translations.length !== batch.length) {
      return { ok: false, code: "upstream", error: "Google Cloud Translation returned a partial response." };
    }

    batch.forEach((text, index) => {
      const translated = decodeEntities(translations[index]?.translatedText ?? text);
      cacheSet(translateCacheKey(target, source, text), translated);
      missing.set(text, translated);
    });
  }

  // 3. Rebuild the caller's order (including duplicates).
  const segments: TranslatedSegment[] = normalized.map((text, index) => {
    const translatedText = resolved[index] ?? cacheGet(translateCacheKey(target, source, text)) ?? text;
    return source
      ? { text, translatedText, detectedSourceLanguage: source }
      : { text, translatedText };
  });

  return { ok: true, segments };
}
