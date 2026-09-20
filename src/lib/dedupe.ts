import { hash64 } from "./hash";
import { leadScore } from "./rank";
import { salientTokens } from "./text";
import type { Article, CategoryId, Cluster } from "./types";

/**
 * Two jobs live here:
 *  1. `dedupeById` — the same URL syndicated into several feeds becomes one
 *     article whose `categories` list keeps every section it appeared in.
 *  2. `clusterArticles` — different outlets covering the same story are grouped,
 *     which powers the "N outlets covering this" badge and /story/[id].
 */

export function dedupeById(articles: Article[]): Article[] {
  const byId = new Map<string, Article>();

  for (const article of articles) {
    const existing = byId.get(article.id);
    if (!existing) {
      byId.set(article.id, { ...article, categories: [...article.categories] });
      continue;
    }
    byId.set(article.id, mergeArticles(existing, article));
  }

  return [...byId.values()];
}

function mergeArticles(existing: Article, incoming: Article): Article {
  const categories = [...new Set<CategoryId>([...existing.categories, ...incoming.categories])];
  const keepExistingLink = !/news\.google\.com/i.test(existing.domain);
  const base = keepExistingLink ? existing : incoming;
  const other = keepExistingLink ? incoming : existing;

  const published = Math.min(Date.parse(existing.publishedAt), Date.parse(incoming.publishedAt));

  return {
    ...base,
    categories,
    primaryCategory: base.primaryCategory,
    image: base.image || other.image,
    summary: (base.summary.length >= other.summary.length ? base.summary : other.summary),
    author: base.author || other.author,
    wordCount: Math.max(base.wordCount ?? 0, other.wordCount ?? 0) || undefined,
    readingMinutes: base.readingMinutes || other.readingMinutes,
    tags: [...new Set([...base.tags, ...other.tags])].slice(0, 8),
    publishedAt: Number.isFinite(published) ? new Date(published).toISOString() : base.publishedAt,
    score: Math.max(base.score, other.score),
  };
}

export interface ClusterOptions {
  /** Jaccard similarity of salient headline tokens required to merge. */
  threshold?: number;
  /** Containment (intersection / smaller set) also merges — catches reworded leads. */
  containment?: number;
  /** Stories further apart than this are never considered the same event. */
  maxAgeHours?: number;
}

/**
 * Headline similarity: Jaccard over salient tokens, plus a containment check so
 * "GB reach Davis Cup Finals as Patten and Skupski win" still matches the shorter
 * "GB qualify for Davis Cup Finals after doubles win".
 */
export function headlineSimilarity(a: string[], b: string[]): { jaccard: number; containment: number } {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return { jaccard: 0, containment: 0 };
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return {
    jaccard: union === 0 ? 0 : intersection / union,
    containment: intersection / Math.min(setA.size, setB.size),
  };
}

interface Bucket {
  tokens: string[];
  items: Article[];
  latest: number;
}

export function clusterArticles(articles: Article[], options: ClusterOptions = {}): Cluster[] {
  const threshold = options.threshold ?? 0.5;
  const containmentThreshold = options.containment ?? 0.75;
  const maxAgeMs = (options.maxAgeHours ?? 72) * 3_600_000;

  const buckets: Bucket[] = [];
  const inverted = new Map<string, Set<number>>();

  const ordered = [...articles].sort((a, b) => b.score - a.score);

  for (const article of ordered) {
    const tokens = [...new Set(salientTokens(article.title))];
    const published = Date.parse(article.publishedAt);

    if (tokens.length < 3) {
      addBucket(buckets, inverted, { tokens, items: [article], latest: published });
      continue;
    }

    const counts = new Map<number, number>();
    for (const token of tokens) {
      const bucketIds = inverted.get(token);
      if (!bucketIds) continue;
      for (const id of bucketIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    let bestId = -1;
    let bestSim = 0;
    for (const [id, shared] of counts) {
      // Long headlines need more evidence before we call them the same story.
      const minShared = tokens.length >= 8 ? 3 : 2;
      if (shared < minShared) continue;
      const bucket = buckets[id];
      if (!bucket || Math.abs(bucket.latest - published) > maxAgeMs) continue;
      const { jaccard, containment } = headlineSimilarity(tokens, bucket.tokens);
      const isMatch = jaccard >= threshold || containment >= containmentThreshold;
      if (isMatch && jaccard + containment > bestSim) {
        bestSim = jaccard + containment;
        bestId = id;
      }
    }

    if (bestId >= 0) {
      const bucket = buckets[bestId];
      bucket.items.push(article);
      bucket.latest = Math.max(bucket.latest, published);
    } else {
      addBucket(buckets, inverted, { tokens, items: [article], latest: published });
    }
  }

  return buckets.map(toCluster).sort((a, b) => b.score - a.score);
}

function addBucket(buckets: Bucket[], inverted: Map<string, Set<number>>, bucket: Bucket): void {
  const id = buckets.push(bucket) - 1;
  for (const token of bucket.tokens) {
    let set = inverted.get(token);
    if (!set) {
      set = new Set();
      inverted.set(token, set);
    }
    set.add(id);
  }
}

function toCluster(bucket: Bucket): Cluster {
  const items = [...bucket.items].sort((a, b) => leadScore(b) - leadScore(a));
  const lead = items[0];
  const sources = new Set(items.map((item) => item.sourceName.toLowerCase().trim()));
  const timestamps = items.map((item) => Date.parse(item.publishedAt)).filter(Number.isFinite);

  return {
    id: lead.clusterId || hash64(`cluster:${lead.title}`),
    title: lead.title,
    lead,
    items,
    sourceCount: sources.size,
    categories: [...new Set(items.flatMap((item) => item.categories))],
    latestAt: new Date(Math.max(...timestamps, 0)).toISOString(),
    earliestAt: new Date(Math.min(...timestamps, Date.now())).toISOString(),
    score: Math.max(...items.map((item) => item.score)),
  };
}

/** True when two headlines are effectively the same story (used by tests). */
export function sameStory(a: string, b: string, threshold = 0.5): boolean {
  const { jaccard, containment } = headlineSimilarity(salientTokens(a), salientTokens(b));
  return jaccard >= threshold || containment >= 0.75;
}
