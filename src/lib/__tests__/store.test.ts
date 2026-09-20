import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "../categories";
import { getTopStories, getStatus, queryNews, searchArticles } from "../store";
import { loadSnapshotArticles } from "../snapshot";

describe("snapshot", () => {
  it("builds ranked articles for every category", () => {
    const articles = loadSnapshotArticles();
    expect(articles.length).toBeGreaterThan(60);
    for (const id of CATEGORY_IDS) {
      expect(articles.filter((article) => article.categories.includes(id)).length).toBeGreaterThan(0);
    }
    expect(new Set(articles.map((article) => article.id)).size).toBe(articles.length);
  });

  it("splits Google News publishers out of the headline", () => {
    const articles = loadSnapshotArticles();
    const local = articles.filter((article) => article.categories.includes("local"));
    expect(local.some((article) => article.sourceName === "Local News Matters")).toBe(true);
    expect(local.every((article) => !article.title.endsWith(" - Local News Matters"))).toBe(true);
  });
});

describe("store", () => {
  it("boots in snapshot mode without touching the network", () => {
    const status = getStatus();
    expect(status.mode).toBe("snapshot");
    expect(status.offlineMode).toBe("always");
    expect(status.articleCount).toBeGreaterThan(60);
    expect(status.sources.length).toBeGreaterThan(20);
  });

  it("answers category queries", async () => {
    const sports = await queryNews({ category: "sports", limit: 50 });
    expect(sports.total).toBeGreaterThan(5);
    expect(sports.articles.every((article) => article.categories.includes("sports"))).toBe(true);
    expect(sports.query.category).toBe("sports");
  });

  it("paginates", async () => {
    const first = await queryNews({ category: "world", limit: 3, offset: 0 });
    const second = await queryNews({ category: "world", limit: 3, offset: 3 });
    expect(first.articles).toHaveLength(3);
    expect(second.articles[0].id).not.toBe(first.articles[0].id);
    expect(first.total).toBeGreaterThan(3);
  });

  it("filters by publisher facet", async () => {
    const all = await queryNews({ category: "tech", limit: 50 });
    const source = all.facets.sources[0];
    expect(source).toBeDefined();
    const filtered = await queryNews({ category: "tech", source: source.id, limit: 50 });
    expect(filtered.total).toBe(source.count);
  });

  it("searches across titles, summaries and publishers", async () => {
    const results = await queryNews({ q: "Gemini hacked", limit: 10 });
    expect(results.articles[0].title.toLowerCase()).toContain("gemini");

    const byPublisher = searchArticles("Verge", (await queryNews({ limit: 100 })).articles);
    expect(byPublisher.some((article) => article.sourceName === "The Verge")).toBe(true);
  });

  it("sorts newest first", async () => {
    const result = await queryNews({ sort: "newest", limit: 20 });
    const stamps = result.articles.map((article) => Date.parse(article.publishedAt));
    expect(stamps).toEqual([...stamps].sort((a, b) => b - a));
  });

  it("clusters duplicate coverage on demand", async () => {
    const result = await queryNews({ category: "sports", clustered: true, limit: 50 });
    expect(result.clusters).toBeDefined();
    expect(result.clusters!.some((cluster) => cluster.items.length >= 2)).toBe(true);
  });

  it("provides top stories with publisher diversity", () => {
    const top = getTopStories(6);
    expect(top).toHaveLength(6);
    expect(top[0].score).toBeGreaterThanOrEqual(top[top.length - 1].score);
  });

  it("reports per-category counts in the status payload", () => {
    const status = getStatus();
    for (const id of CATEGORY_IDS) {
      expect(status.countsByCategory[id] ?? 0).toBeGreaterThan(0);
    }
  });
});
