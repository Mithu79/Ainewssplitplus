import { articleId, hash64 } from "../hash";
import { salientTokens } from "../text";
import type { Article, CategoryId } from "../types";

export const FIXED_NOW = Date.parse("2026-09-20T12:00:00Z");

/** Builds a fully populated Article from a title plus any overrides. */
export function makeArticle(overrides: Partial<Article> & { title: string }, now = FIXED_NOW): Article {
  const link = overrides.link ?? `https://wire.example.com/${overrides.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const publishedAt = overrides.publishedAt ?? new Date(now - 60 * 60_000).toISOString();

  const base: Article = {
    id: articleId(link),
    clusterId: hash64(`title:${salientTokens(overrides.title).sort().join(" ")}`),
    title: overrides.title,
    link,
    summary: "A short standfirst for testing.",
    sourceId: "wire",
    sourceName: "Test Wire",
    site: "https://wire.example.com",
    domain: "wire.example.com",
    categories: ["world"] as CategoryId[],
    primaryCategory: "world",
    publishedAt,
    fetchedAt: new Date(now).toISOString(),
    tags: [],
    score: 0,
    breaking: false,
    isVideo: false,
  };

  return { ...base, ...overrides, link, id: base.id, clusterId: base.clusterId };
}
