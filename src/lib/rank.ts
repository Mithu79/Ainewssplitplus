import { config } from "./config";
import type { Article, CategoryId, FeedSource, SortOrder } from "./types";

/**
 * Ranking: a transparent, tunable blend of source trust and recency, with
 * bonuses for presentation quality and penalties for low-value evergreen items
 * (newsletters, quizzes, podcasts) that news feeds like to mix in.
 */

const BREAKING_RE =
  /\b(breaking|just\s+in|just\s+now|urgent|developing|live\s+updates?|watch\s+live|as\s+it\s+happened|exclusive)\b/i;

const LOW_VALUE_RE =
  /\b(newsletter|podcast|quiz|horoscope|crossword|wordle|sudoku|recipe|sponsored|advertisement|promo|gossip|roundup|flashback|on\s+this\s+day|weekend\s+read|long\s+read|installer|the\s+stepback|version\s+history|trailer\s+park)\b/i;

/** Hours after which a story's recency bonus has decayed by ~63%. */
const CATEGORY_HALF_LIFE: Record<CategoryId, number> = {
  sports: 10,
  tech: 12,
  world: 16,
  business: 16,
  local: 20,
  entertainment: 28,
  science: 40,
  health: 40,
};

export function ageHours(article: Article, now: number): number {
  const published = Date.parse(article.publishedAt);
  if (Number.isNaN(published)) return 24;
  return Math.max(0, (now - published) / 3_600_000);
}

export function recencyBoost(article: Article, now: number): number {
  const halfLife = CATEGORY_HALF_LIFE[article.primaryCategory] ?? 18;
  return 70 * Math.exp(-ageHours(article, now) / halfLife);
}

export function isBreaking(article: Article, now: number): boolean {
  if (BREAKING_RE.test(article.title)) return true;
  const ageMs = now - Date.parse(article.publishedAt);
  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= config.breakingWindowMs;
}

export function scoreArticle(article: Article, weight: number, now: number): number {
  let score = weight * 8 + recencyBoost(article, now);

  if (article.image) score += 6;
  if (article.summary.length > 60) score += 4;
  if (article.summary.length === 0) score -= 3;
  if (article.author) score += 1;
  if (BREAKING_RE.test(article.title)) score += 25;
  if (LOW_VALUE_RE.test(article.title)) score -= 35;
  if (article.isVideo) score -= 5;
  if (article.title.length < 18) score -= 6;
  if (article.title.length > 140) score -= 4;
  // Slight boost for stories with real body text available.
  if (article.wordCount && article.wordCount > 250) score += 3;

  return Math.round(score * 100) / 100;
}

/** Mutates `articles` in place with a computed score + breaking flag. */
export function applyRanking(
  articles: Article[],
  sourceById: Map<string, FeedSource>,
  now = Date.now(),
): Article[] {
  for (const article of articles) {
    const weight = sourceById.get(article.sourceId)?.weight ?? 3;
    article.score = scoreArticle(article, weight, now);
    article.breaking = isBreaking(article, now);
  }
  return articles;
}

export function byRank(a: Article, b: Article): number {
  if (b.score !== a.score) return b.score - a.score;
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export function byNewest(a: Article, b: Article): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export function sortArticles(articles: Article[], sort: SortOrder = "rank"): Article[] {
  return [...articles].sort(sort === "newest" ? byNewest : byRank);
}

/**
 * Round-robin style diversity pass: no single outlet may occupy more than
 * `cap` slots inside any window of `window` positions. Keeps the front page
 * from turning into a single-publisher firehose.
 */
export function diversify(articles: Article[], cap: number = config.perSourceCap, windowSize?: number): Article[] {
  const window = windowSize ?? cap * 3;
  const sorted = [...articles];
  const out: Article[] = [];
  const deferred: Article[] = [];

  const windowOk = (article: Article) => {
    const start = Math.max(0, out.length - window);
    let seen = 0;
    for (let i = start; i < out.length; i += 1) {
      if (out[i].domain === article.domain) seen += 1;
    }
    return seen < cap;
  };

  for (const article of sorted) {
    if (windowOk(article)) out.push(article);
    else deferred.push(article);
  }

  // Anything held back still gets appended in rank order.
  for (const article of deferred) out.push(article);
  return out;
}

/** Picks the lead story of a cluster: direct publisher links and richer cards win. */
export function leadScore(article: Article): number {
  let score = article.score;
  if (/news\.google\.com/i.test(article.domain)) score -= 40;
  if (article.image) score += 8;
  if (article.summary) score += 5;
  return score;
}
