/**
 * Shared domain types for NewsSplit.
 * Everything here is isomorphic (safe on the server, in route handlers and in the browser).
 */

export type CategoryId =
  | "world"
  | "tech"
  | "business"
  | "sports"
  | "science"
  | "health"
  | "entertainment"
  | "local";

export type FeedKind = "rss" | "atom" | "google-news";

export interface GoogleNewsLocale {
  hl: string;
  gl: string;
  ceid: string;
}

export interface FeedSource {
  /** Stable id, also used as the `source` facet value. */
  id: string;
  /** Human readable publisher name. */
  name: string;
  /** Static feed endpoint. Dynamic sources provide `resolveUrl` instead. */
  url?: string;
  category: CategoryId;
  /** Publisher homepage, used for favicons and "visit site" links. */
  site?: string;
  /** Editorial weight (1–5) feeding the ranking score and source diversity. */
  weight: number;
  kind?: FeedKind;
  enabled?: boolean;
  /** Builds the endpoint at request time (e.g. region aware Google News feeds). */
  resolveUrl?: (ctx: { region: string; locale: GoogleNewsLocale }) => string;
  /**
   * Language of the headlines this feed publishes. Omitted = English.
   * Copied onto every article so `/api/news?lang=bn` and the native-language
   * rail can filter on it. Headlines render as filed by default — visitors can
   * opt into machine translation via /api/translate (one-click "Read in").
   */
  language?: ArticleLanguage;
}

/** Headline languages carried by the registry. English feeds leave `language` unset. */
export type ArticleLanguage = "en" | "bn" | "hi" | "ta";

/**
 * Languages mixed into "Top stories" and every non-local category listing.
 * The front page deliberately alternates English, Bengali and Hindi coverage
 * so the home page reads multilingual. Tamil stays registered but opt-in
 * (`/api/news?lang=ta`, the native-language rail).
 */
export const MIX_LANGUAGES: ArticleLanguage[] = ["en", "bn", "hi"];

/** A single normalised story, regardless of which feed format it came from. */
export interface Article {
  id: string;
  /** Stories covering the same event share a clusterId. */
  clusterId: string;
  title: string;
  link: string;
  summary: string;
  image?: string;
  author?: string;
  sourceId: string;
  sourceName: string;
  site?: string;
  domain: string;
  categories: CategoryId[];
  primaryCategory: CategoryId;
  publishedAt: string;
  fetchedAt: string;
  tags: string[];
  wordCount?: number;
  readingMinutes?: number;
  /** Ranking score — higher surfaces first. */
  score: number;
  breaking: boolean;
  isVideo: boolean;
  /** Language the headline was filed in (feed-declared). Defaults to "en". */
  language?: ArticleLanguage;
}

/** A group of articles from different outlets covering the same story. */
export interface Cluster {
  id: string;
  title: string;
  lead: Article;
  items: Article[];
  sourceCount: number;
  categories: CategoryId[];
  latestAt: string;
  earliestAt: string;
  score: number;
}

export type SourceState = "idle" | "ok" | "error";

export interface SourceHealth {
  id: string;
  name: string;
  category: CategoryId;
  url?: string;
  state: SourceState;
  items: number;
  latencyMs?: number;
  httpStatus?: number;
  error?: string;
  lastOkAt?: string;
  lastAttemptAt?: string;
}

/**
 * Where the currently served data came from:
 * - `live`     freshly crawled feeds
 * - `stale`    a previous successful crawl, the latest one failed
 * - `snapshot` bundled offline snapshot because no feed could be reached
 * - `empty`    nothing available
 */
export type DataMode = "live" | "stale" | "snapshot" | "empty";

export type SortOrder = "rank" | "newest";

export interface NewsQuery {
  category?: CategoryId | "top";
  q?: string;
  source?: string;
  /** Only stories published within the last N hours (0 = any time). */
  hours?: number;
  sort?: SortOrder;
  limit?: number;
  offset?: number;
  region?: string;
  /** Group articles that cover the same story. */
  clustered?: boolean;
  /** Only stories filed in this language (e.g. "bn"). */
  lang?: ArticleLanguage;
}

export interface FacetValue {
  id: string;
  name: string;
  count: number;
}

export interface Facets {
  categories: FacetValue[];
  sources: FacetValue[];
}

export interface NewsResult {
  ok: boolean;
  mode: DataMode;
  generatedAt: string;
  lastRefreshAt: string | null;
  query: Required<Pick<NewsQuery, "sort" | "limit" | "offset">> & NewsQuery;
  total: number;
  articles: Article[];
  clusters?: Cluster[];
  facets: Facets;
  region?: string;
}

export interface StoreStatus {
  mode: DataMode;
  startedAt: string;
  lastRefreshAt: string | null;
  lastSuccessfulRefreshAt: string | null;
  nextRefreshAt: string | null;
  refreshCount: number;
  refreshing: boolean;
  articleCount: number;
  clusterCount: number;
  breakingCount: number;
  countsByCategory: Record<string, number>;
  sources: SourceHealth[];
  offlineMode: string;
  refreshIntervalMinutes: number;
  /** Last crawler error, surfaced in the banner, /sources and /api/status. */
  lastError?: string | null;
}

/** Raw, not-yet-normalised feed item produced by the XML layer. */
export interface RawItem {
  title?: string;
  link?: string;
  guid?: string;
  description?: string;
  content?: string;
  publishedRaw?: string;
  updatedRaw?: string;
  author?: string;
  images: string[];
  enclosureType?: string;
  categories: string[];
  publisher?: string;
  publisherUrl?: string;
  mediaMedium?: string;
}

export interface ParsedFeed {
  format: "rss" | "atom" | "rdf" | "unknown";
  title?: string;
  link?: string;
  description?: string;
  updatedRaw?: string;
  items: RawItem[];
}
