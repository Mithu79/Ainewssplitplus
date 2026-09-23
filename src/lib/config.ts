import type { GoogleNewsLocale } from "./types";

function num(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function str(value: string | undefined, fallback: string): string {
  return value && value.trim() !== "" ? value.trim() : fallback;
}

const offlineRaw = str(process.env.NEWS_SPLIT_OFFLINE, "auto").toLowerCase();
const offlineMode: "auto" | "always" | "never" =
  offlineRaw === "always" || offlineRaw === "1" || offlineRaw === "true"
    ? "always"
    : offlineRaw === "never" || offlineRaw === "0" || offlineRaw === "false"
      ? "never"
      : "auto";

export const config = {
  siteName: str(process.env.NEXT_PUBLIC_SITE_NAME, "NewsSplit"),
  siteUrl: str(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000").replace(/\/$/, ""),
  tagline: "Every story, every source — split into what matters.",

  /** How often the background crawler re-reads every feed. */
  refreshIntervalMs: num(process.env.REFRESH_INTERVAL_MINUTES, 10) * 60_000,
  /** A request that finds data older than this kicks off a background refresh. */
  staleAfterMs: num(process.env.REFRESH_INTERVAL_MINUTES, 10) * 60_000,

  requestTimeoutMs: num(process.env.FETCH_TIMEOUT_SECONDS, 10) * 1000,
  retries: num(process.env.FETCH_RETRIES, 1),
  concurrency: Math.max(1, num(process.env.FETCH_CONCURRENCY, 6)),

  maxItemsPerSource: Math.max(5, num(process.env.MAX_ITEMS_PER_SOURCE, 40)),
  maxCacheItems: Math.max(50, num(process.env.MAX_CACHE_ITEMS, 1500)),

  cacheFile: str(process.env.CACHE_FILE, ".cache/newssplit.json"),
  offlineMode,
  refreshToken: str(process.env.REFRESH_TOKEN, ""),

  defaultRegion: str(process.env.LOCAL_DEFAULT_REGION, "West Bengal"),
  extraLocalFeeds: str(process.env.LOCAL_FEEDS, "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean),

  googleNewsLocale: {
    hl: str(process.env.GOOGLE_NEWS_HL, "en-US"),
    gl: str(process.env.GOOGLE_NEWS_GL, "US"),
    ceid: str(process.env.GOOGLE_NEWS_CEID, "US:en"),
  } satisfies GoogleNewsLocale,

  /**
   * Google Cloud Translation (one-click "Read in" translation).
   * An empty key disables POST /api/translate with a 503 so the UI can show a
   * friendly "not configured" state instead of a hard failure.
   */
  googleTranslateApiKey: str(process.env.GOOGLE_TRANSLATE_API_KEY, ""),
  /** Translation model: `nmt` (neural) or `base` (phrase-based). */
  googleTranslateModel: str(process.env.GOOGLE_TRANSLATE_MODEL, "nmt"),
  /** Per-request cap enforced by /api/translate before anything leaves the box. */
  translateMaxTexts: Math.max(1, num(process.env.TRANSLATE_MAX_TEXTS, 8)),
  translateMaxTextLength: Math.max(200, num(process.env.TRANSLATE_MAX_TEXT_LENGTH, 2000)),

  /** Stories younger than this are eligible for the breaking ticker. */
  breakingWindowMs: 90 * 60_000,
  /** Per-source cap applied to the top of a ranked list, keeps the mix diverse. */
  perSourceCap: 3,
} as const;

export type AppConfig = typeof config;

/** True while running under vitest — disables timers and disk writes. */
export const IS_TEST = Boolean(process.env.VITEST || process.env.NODE_ENV === "test");
