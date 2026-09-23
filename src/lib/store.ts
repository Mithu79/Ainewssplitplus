import fs from "node:fs";
import path from "node:path";

import { config, IS_TEST } from "./config";
import { clusterArticles, dedupeById } from "./dedupe";
import { fetchText, mapLimit } from "./fetcher";
import { articleId } from "./hash";
import { normalizeItem, parseFeedDate } from "./normalize";
import { parseFeedXml } from "./parse-feed";
import { applyRanking, byNewest, byRank, diversify, sortArticles } from "./rank";
import { loadSnapshotArticles, snapshotCapturedAt } from "./snapshot";
import { allSources, resolveSourceUrl } from "./sources";
import { salientTokens, tokenize } from "./text";
import type {
  ArticleLanguage,
  Article,
  CategoryId,
  Cluster,
  DataMode,
  Facets,
  FeedSource,
  NewsQuery,
  NewsResult,
  SourceHealth,
  StoreStatus,
} from "./types";

/**
 * The NewsSplit store.
 *
 * Server-only. It owns the crawl loop (fetch → parse → normalise → dedupe →
 * rank → cluster), an in-memory index, an optional on-disk cache so restarts
 * are not blind, and the query API used by pages and route handlers.
 */

interface CrawlResult {
  source: FeedSource;
  ok: boolean;
  articles: Article[];
  ms: number;
  status?: number;
  error?: string;
  url?: string;
}

interface LocalCacheEntry {
  at: number;
  region: string;
  articles: Article[];
  ok: boolean;
  error?: string;
}

interface State {
  ready: boolean;
  articles: Article[];
  byId: Map<string, Article>;
  clusters: Cluster[];
  clusterById: Map<string, Cluster>;
  health: Map<string, SourceHealth>;
  mode: DataMode;
  startedAt: number;
  lastRefreshAt: number | null;
  lastSuccessfulRefreshAt: number | null;
  refreshCount: number;
  refreshing: Promise<void> | null;
  timer: ReturnType<typeof setInterval> | null;
  localCache: Map<string, LocalCacheEntry>;
  loadedFrom: "none" | "disk" | "snapshot" | "crawl";
  lastError?: string;
}

const STORE_KEY = Symbol.for("newssplit.store.v1");

type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: State };

function createState(): State {
  const health = new Map<string, SourceHealth>();
  for (const source of allSources()) {
    health.set(source.id, {
      id: source.id,
      name: source.name,
      category: source.category,
      url: resolveSourceUrl(source, config.defaultRegion),
      state: "idle",
      items: 0,
    });
  }

  return {
    ready: false,
    articles: [],
    byId: new Map(),
    clusters: [],
    clusterById: new Map(),
    health,
    mode: "empty",
    startedAt: Date.now(),
    lastRefreshAt: null,
    lastSuccessfulRefreshAt: null,
    refreshCount: 0,
    refreshing: null,
    timer: null,
    localCache: new Map(),
    loadedFrom: "none",
  };
}

export function getState(): State {
  const globalStore = globalThis as GlobalWithStore;
  if (!globalStore[STORE_KEY]) {
    const state = createState();
    globalStore[STORE_KEY] = state;
    hydrate(state);
  }
  return globalStore[STORE_KEY] as State;
}

function hydrate(state: State): void {
  if (config.offlineMode === "always") {
    adoptSnapshot(state);
    state.ready = true;
    return;
  }

  if (!IS_TEST && loadFromDisk(state)) {
    state.ready = true;
    return;
  }

  if (config.offlineMode !== "never") adoptSnapshot(state);
  state.ready = true;
}

function adoptSnapshot(state: State): void {
  const articles = loadSnapshotArticles();
  assignArticles(state, articles);
  state.mode = "snapshot";
  state.loadedFrom = "snapshot";
  if (!state.lastRefreshAt) state.lastRefreshAt = Date.parse(snapshotCapturedAt()) || null;
}

function assignArticles(state: State, articles: Article[]): void {
  const limited = articles.slice(0, config.maxCacheItems);
  state.articles = limited;
  state.byId = new Map(limited.map((article) => [article.id, article]));
  state.clusters = clusterArticles(limited);
  state.clusterById = new Map(state.clusters.map((cluster) => [cluster.id, cluster]));
}

/* ───────────────────────────── crawling ───────────────────────────── */

async function crawlSource(source: FeedSource, region: string, now: number): Promise<CrawlResult> {
  const url = resolveSourceUrl(source, region);
  if (!url) {
    return { source, ok: false, articles: [], ms: 0, error: "No feed URL configured" };
  }

  const result = await fetchText(url);
  if (!result.ok || !result.body) {
    return { source, ok: false, articles: [], ms: result.ms, status: result.status, error: result.error, url };
  }

  let parsed;
  try {
    parsed = parseFeedXml(result.body);
  } catch (error) {
    return {
      source,
      ok: false,
      articles: [],
      ms: result.ms,
      status: result.status,
      error: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      url,
    };
  }

  const articles: Article[] = [];
  for (const raw of parsed.items.slice(0, config.maxItemsPerSource)) {
    const article = normalizeItem(raw, { source, now, feedLink: parsed.link });
    if (article) articles.push(article);
  }

  if (articles.length === 0) {
    return {
      source,
      ok: false,
      articles: [],
      ms: result.ms,
      status: result.status,
      error: `No usable items (format: ${parsed.format})`,
      url,
    };
  }

  return { source, ok: true, articles, ms: result.ms, status: result.status, url };
}

export async function refreshAll(options: { force?: boolean; region?: string } = {}): Promise<void> {
  const state = getState();

  if (config.offlineMode === "always" && !options.force) return;
  if (state.refreshing && !options.force) {
    await state.refreshing.catch(() => undefined);
    return;
  }

  const run = (async () => {
    const now = Date.now();
    const region = options.region ?? config.defaultRegion;
    const sources = allSources().filter((source) => source.enabled !== false);

    const results = await mapLimit(sources, config.concurrency, (source) =>
      crawlSource(source, region, now).catch((error): CrawlResult => ({
        source,
        ok: false,
        articles: [],
        ms: 0,
        error: error instanceof Error ? error.message : String(error),
      })),
    );

    for (const result of results) {
      const previous = state.health.get(result.source.id);
      const health: SourceHealth = {
        id: result.source.id,
        name: result.source.name,
        category: result.source.category,
        url: result.url ?? previous?.url,
        state: result.ok ? "ok" : "error",
        items: result.articles.length,
        latencyMs: result.ms,
        httpStatus: result.status,
        error: result.ok ? undefined : result.error,
        lastAttemptAt: new Date(now).toISOString(),
        lastOkAt: result.ok ? new Date(now).toISOString() : previous?.lastOkAt,
      };
      state.health.set(result.source.id, health);
    }

    const okSources = results.filter((result) => result.ok);
    const crawled = okSources.flatMap((result) => result.articles);

    state.refreshCount += 1;
    state.lastRefreshAt = now;
    state.lastError = okSources.length === 0 ? (results[0]?.error ?? "All feeds failed") : undefined;

    if (crawled.length > 0) {
      const sourceById = new Map(allSources().map((source) => [source.id, source]));
      const unique = dedupeById(crawled);
      applyRanking(unique, sourceById, now);
      unique.sort(byRank);
      assignArticles(state, unique);
      state.mode = "live";
      state.loadedFrom = "crawl";
      state.lastSuccessfulRefreshAt = now;
      state.localCache.clear();
      persist(state);
    } else if (state.articles.length > 0 && state.loadedFrom === "crawl") {
      state.mode = "stale";
    } else if (config.offlineMode !== "never") {
      adoptSnapshot(state);
    } else {
      state.mode = "empty";
    }
  })();

  state.refreshing = run;
  try {
    await run;
  } finally {
    state.refreshing = null;
  }
}

/** Starts the crawl loop. Called from `instrumentation.ts` on server boot. */
export async function initStore(): Promise<void> {
  const state = getState();

  const needsCrawl =
    config.offlineMode !== "always" &&
    (state.articles.length === 0 ||
      !state.lastSuccessfulRefreshAt ||
      Date.now() - state.lastSuccessfulRefreshAt > config.staleAfterMs);

  if (needsCrawl) {
    refreshAll().catch((error) => {
      state.lastError = error instanceof Error ? error.message : String(error);
    });
  }

  if (IS_TEST || state.timer || config.offlineMode === "always") return;

  state.timer = setInterval(() => {
    refreshAll().catch((error) => {
      state.lastError = error instanceof Error ? error.message : String(error);
    });
  }, config.refreshIntervalMs);
  state.timer.unref?.();
}

/** Kick a refresh when the data is older than the configured interval. */
export function ensureFresh(): void {
  const state = getState();
  if (config.offlineMode === "always" || state.refreshing) return;
  const age = state.lastRefreshAt ? Date.now() - state.lastRefreshAt : Infinity;
  if (age > config.staleAfterMs) {
    refreshAll().catch(() => undefined);
  }
}

/* ────────────────────────── region aware local news ────────────────────────── */

export async function getLocalArticles(region: string): Promise<{
  articles: Article[];
  ok: boolean;
  fromCache: boolean;
  error?: string;
}> {
  const state = getState();
  const normalized = region.trim() || config.defaultRegion;

  if (normalized.toLowerCase() === config.defaultRegion.toLowerCase()) {
    return {
      articles: state.articles.filter((article) => article.categories.includes("local")),
      ok: state.mode !== "empty",
      fromCache: true,
    };
  }

  const cached = state.localCache.get(normalized.toLowerCase());
  if (cached && Date.now() - cached.at < config.staleAfterMs) {
    return { articles: cached.articles, ok: cached.ok, fromCache: true, error: cached.error };
  }

  if (config.offlineMode === "always") {
    const fallback = state.articles.filter((article) => article.categories.includes("local"));
    return { articles: fallback, ok: true, fromCache: true };
  }

  const now = Date.now();
  const localSources = allSources().filter((source) => source.category === "local");
  const results = await mapLimit(localSources, config.concurrency, (source) =>
    crawlSource(source, normalized, now).catch((error): CrawlResult => ({
      source,
      ok: false,
      articles: [],
      ms: 0,
      error: error instanceof Error ? error.message : String(error),
    })),
  );

  const articles = dedupeById(results.flatMap((result) => result.articles));
  applyRanking(
    articles,
    new Map(allSources().map((source) => [source.id, source])),
    now,
  );
  articles.sort(byRank);

  const ok = results.some((result) => result.ok);
  const error = ok ? undefined : (results.find((r) => r.error)?.error ?? "Local feeds unavailable");

  state.localCache.set(normalized.toLowerCase(), { at: now, region: normalized, articles, ok, error });

  if (!ok) {
    const fallback = state.articles.filter((article) => article.categories.includes("local"));
    if (fallback.length > 0) return { articles: fallback, ok: false, fromCache: false, error };
  }

  return { articles, ok, fromCache: false, error };
}

/* ─────────────────────────────── querying ─────────────────────────────── */

function matchesQuery(article: Article, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const titleTokens = tokenize(article.title);
  const haystack = [
    ...titleTokens,
    ...tokenize(article.summary),
    ...tokenize(article.tags.join(" ")),
    ...tokenize(article.sourceName),
    ...tokenize(article.categories.join(" ")),
  ];
  const set = new Set(haystack);
  const titleSet = new Set(titleTokens);

  let hits = 0;
  let titleHits = 0;
  for (const token of tokens) {
    const inTitle = [...titleSet].some((t) => t.startsWith(token));
    const inHaystack = inTitle || [...set].some((t) => t.startsWith(token));
    if (inHaystack) hits += 1;
    if (inTitle) titleHits += 1;
  }

  if (hits === 0) return 0;
  // Require every token to match somewhere, otherwise treat it as a weak match.
  const complete = hits === new Set(tokens).size ? 1 : 0.35;
  return complete * (1 + titleHits * 1.5 + hits * 0.25);
}

export function searchArticles(query: string, articles: Article[]): Article[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return articles;

  const scored = articles
    .map((article) => ({ article, match: matchesQuery(article, tokens) }))
    .filter((entry) => entry.match > 0);

  const strong = scored.filter((entry) => entry.match >= 1);
  const pool = strong.length > 0 ? strong : scored;

  return pool
    .sort((a, b) => b.match - a.match || b.article.score - a.article.score)
    .map((entry) => entry.article);
}

export async function queryNews(query: NewsQuery = {}): Promise<NewsResult> {
  ensureFresh();
  const state = getState();

  const category = query.category && query.category !== "top" ? (query.category as CategoryId) : undefined;
  const limit = Math.min(200, Math.max(1, query.limit ?? 24));
  const offset = Math.max(0, query.offset ?? 0);
  const sort = query.sort === "newest" ? "newest" : "rank";
  const hours = Number.isFinite(query.hours) ? Math.max(0, Number(query.hours)) : 0;

  let pool = state.articles;
  let region: string | undefined;

  if (category === "local") {
    region = (query.region ?? config.defaultRegion).trim();
    const local = await getLocalArticles(region);
    pool = local.articles.length > 0 ? local.articles : pool.filter((a) => a.categories.includes("local"));
  } else if (category) {
    pool = pool.filter((article) => article.categories.includes(category));
  }

  // Native-language feeds are opt-in: without `lang` the English rails stay English,
  // with `lang=bn|hi|ta` only that language is returned.
  const wantedLang = query.lang ?? "en";
  pool = pool.filter((article) => (article.language ?? "en") === wantedLang);

  if (query.source) {
    const wanted = query.source.toLowerCase();
    pool = pool.filter(
      (article) => article.sourceId.toLowerCase() === wanted || article.sourceName.toLowerCase() === wanted,
    );
  }

  if (hours > 0) {
    const cutoff = Date.now() - hours * 3_600_000;
    pool = pool.filter((article) => Date.parse(article.publishedAt) >= cutoff);
  }

  if (query.q && query.q.trim()) {
    pool = searchArticles(query.q, pool);
  } else {
    pool = sortArticles(pool, sort);
    if (sort === "rank" && !category) pool = diversify(pool);
  }

  const facets = buildFacets(pool, state);
  const total = pool.length;
  const page = pool.slice(offset, offset + limit);

  const result: NewsResult = {
    ok: state.mode !== "empty",
    mode: state.mode,
    generatedAt: new Date().toISOString(),
    lastRefreshAt: state.lastRefreshAt ? new Date(state.lastRefreshAt).toISOString() : null,
    query: { ...query, category: category ?? "top", sort, limit, offset },
    total,
    articles: page,
    facets,
    region,
  };

  if (query.clustered) {
    const allClusters = clusterArticles(pool).sort((a, b) =>
      sort === "newest" ? Date.parse(b.latestAt) - Date.parse(a.latestAt) : b.score - a.score,
    );
    result.clusters = allClusters.slice(offset, offset + limit);
    result.total = allClusters.length;
  }

  return result;
}

function buildFacets(pool: Article[], state: State): Facets {
  const sources = new Map<string, { name: string; count: number }>();
  const categories = new Map<string, number>();

  for (const article of pool) {
    const key = article.sourceName.toLowerCase();
    const entry = sources.get(key) ?? { name: article.sourceName, count: 0 };
    entry.count += 1;
    sources.set(key, entry);
    for (const category of article.categories) {
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
  }

  // Health of the sources behind the current result set.
  void state;

  return {
    sources: [...sources.entries()]
      .map(([id, value]) => ({ id, name: value.name, count: value.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25),
    categories: [...categories.entries()]
      .map(([id, count]) => ({ id, name: id, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function getCluster(id: string): Cluster | undefined {
  const state = getState();
  return state.clusterById.get(id);
}

export function getArticle(id: string): Article | undefined {
  return getState().byId.get(id);
}

/** Articles filed in English (or with no declared language) — the default pool for every rail. */
function englishArticles(state: State): Article[] {
  return state.articles.filter((article) => !article.language || article.language === "en");
}

/** Headlines filed in a non-English language, newest first. */
export function getLanguageArticles(lang: ArticleLanguage, limit = 12): Article[] {
  return getState()
    .articles.filter((article) => article.language === lang)
    .sort(byNewest)
    .slice(0, limit);
}

/** How many indexed headlines each non-English language currently has. */
export function languageCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const article of getState().articles) {
    if (article.language && article.language !== "en") counts[article.language] = (counts[article.language] ?? 0) + 1;
  }
  return counts;
}

export function getBreaking(limit = 12): Article[] {
  const state = getState();
  return englishArticles(state)
    .filter((article) => article.breaking)
    .sort(byNewest)
    .slice(0, limit);
}

/** Stories covered by several outlets — the "who else is reporting this" list. */
export function getTopClusters(limit = 8, options: { minSources?: number; category?: CategoryId } = {}): Cluster[] {
  const state = getState();
  const minSources = options.minSources ?? 2;
  return state.clusters
    .filter((cluster) => cluster.sourceCount >= minSources)
    .filter((cluster) => (options.category ? cluster.categories.includes(options.category) : true))
    .slice(0, limit);
}

export function clusterSourceCounts(): Map<string, number> {
  const state = getState();
  const counts = new Map<string, number>();
  for (const cluster of state.clusters) {
    if (cluster.sourceCount > 1) counts.set(cluster.id, cluster.sourceCount);
  }
  return counts;
}

/** Long-form picks: stories whose feeds shipped a real body. */
export function getDeepReads(limit = 6): Article[] {
  return englishArticles(getState())
    .filter((article) => (article.wordCount ?? 0) >= 500 && !article.isVideo)
    .sort(byRank)
    .slice(0, limit);
}

export function getTopStories(limit = 8): Article[] {
  return diversify(sortArticles(englishArticles(getState()), "rank")).slice(0, limit);
}

export function getLatest(limit = 20): Article[] {
  return englishArticles(getState()).sort(byNewest).slice(0, limit);
}

export function getRelated(article: Article, limit = 6): Article[] {
  const state = getState();
  const tokens = new Set(salientTokens(article.title));
  return state.articles
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => {
      const candidateTokens = salientTokens(candidate.title);
      const shared = candidateTokens.filter((token) => tokens.has(token)).length;
      return { candidate, shared };
    })
    .filter((entry) => entry.shared >= 2)
    .sort((a, b) => b.shared - a.shared || b.candidate.score - a.candidate.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getStatus(): StoreStatus {
  const state = getState();
  const countsByCategory: Record<string, number> = {};
  for (const article of state.articles) {
    for (const category of article.categories) {
      countsByCategory[category] = (countsByCategory[category] ?? 0) + 1;
    }
  }

  return {
    mode: state.mode,
    startedAt: new Date(state.startedAt).toISOString(),
    lastRefreshAt: state.lastRefreshAt ? new Date(state.lastRefreshAt).toISOString() : null,
    lastSuccessfulRefreshAt: state.lastSuccessfulRefreshAt
      ? new Date(state.lastSuccessfulRefreshAt).toISOString()
      : null,
    nextRefreshAt: state.lastRefreshAt
      ? new Date(state.lastRefreshAt + config.refreshIntervalMs).toISOString()
      : null,
    refreshCount: state.refreshCount,
    refreshing: Boolean(state.refreshing),
    articleCount: state.articles.length,
    clusterCount: state.clusters.length,
    breakingCount: state.articles.filter((article) => article.breaking).length,
    countsByCategory,
    sources: [...state.health.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    offlineMode: config.offlineMode,
    refreshIntervalMinutes: Math.round(config.refreshIntervalMs / 60_000),
    lastError: state.lastError ?? null,
  };
}

/* ───────────────────────────── disk persistence ───────────────────────────── */

interface PersistedState {
  version: 1;
  savedAt: string;
  mode: DataMode;
  loadedFrom: State["loadedFrom"];
  lastRefreshAt: number | null;
  lastSuccessfulRefreshAt: number | null;
  refreshCount: number;
  articles: Article[];
  health: SourceHealth[];
}

function cachePath(): string {
  return path.isAbsolute(config.cacheFile) ? config.cacheFile : path.join(process.cwd(), config.cacheFile);
}

function persist(state: State): void {
  if (IS_TEST) return;
  const payload: PersistedState = {
    version: 1,
    savedAt: new Date().toISOString(),
    mode: state.mode,
    loadedFrom: state.loadedFrom,
    lastRefreshAt: state.lastRefreshAt,
    lastSuccessfulRefreshAt: state.lastSuccessfulRefreshAt,
    refreshCount: state.refreshCount,
    articles: state.articles,
    health: [...state.health.values()],
  };
  try {
    const file = cachePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(payload), "utf8");
  } catch (error) {
    state.lastError = `Cache write failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function loadFromDisk(state: State): boolean {
  try {
    const file = cachePath();
    if (!fs.existsSync(file)) return false;
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed?.articles?.length) return false;

    // Re-score against the current clock so ordering stays meaningful.
    const articles = parsed.articles.filter((article): article is Article =>
      Boolean(article?.id && article?.title && article?.link && articleId(article.link)),
    );
    if (articles.length === 0) return false;

    applyRanking(articles, new Map(allSources().map((source) => [source.id, source])), Date.now());
    articles.sort(byRank);
    assignArticles(state, articles);

    for (const health of parsed.health ?? []) state.health.set(health.id, health);

    state.mode = parsed.mode === "live" ? "stale" : (parsed.mode ?? "stale");
    state.loadedFrom = "disk";
    state.lastRefreshAt = parsed.lastRefreshAt ?? null;
    state.lastSuccessfulRefreshAt = parsed.lastSuccessfulRefreshAt ?? null;
    state.refreshCount = parsed.refreshCount ?? 0;
    return true;
  } catch {
    return false;
  }
}

/** Test helper — resets the singleton. */
export function __resetStoreForTests(): void {
  const globalStore = globalThis as GlobalWithStore;
  const state = globalStore[STORE_KEY];
  if (state?.timer) clearInterval(state.timer);
  delete globalStore[STORE_KEY];
}

export { describeFreshness } from "./store-status-client";

/** Exposed for tests that need to inspect parse-level date handling. */
export const storeInternals = { crawlSource, parseFeedDate, matchesQuery };
