import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "../categories";
import { getTopStories, getStatus, queryNews, searchArticles } from "../store";
import { loadSnapshotArticles } from "../snapshot";
import { MIX_LANGUAGES } from "../types";

describe("snapshot", () => {
  it("builds ranked articles for every category", () => {
    const articles = loadSnapshotArticles();
    expect(articles.length).toBeGreaterThan(60);
    for (const id of CATEGORY_IDS) {
      expect(articles.filter((article) => article.categories.includes(id)).length).toBeGreaterThan(0);
    }
    expect(new Set(articles.map((article) => article.id)).size).toBe(articles.length);
  });

  it("splits Google News publisher suffixes out of Bengali local headlines", () => {
    const articles = loadSnapshotArticles();
    const local = articles.filter((article) => article.categories.includes("local"));
    // The Local desk is fed exclusively by popular Bengali publishers.
    expect(local.length).toBeGreaterThan(0);
    expect(local.every((article) => article.language === "bn")).toBe(true);
    expect(local.some((article) => article.sourceName === "আনন্দবাজার পত্রিকা")).toBe(true);
    expect(local.some((article) => article.sourceName === "বর্তমান")).toBe(true);
    // "… - প্রকাশক" suffixes from Google News are split off the headline.
    expect(local.every((article) => !article.title.endsWith(" - আনন্দবাজার পত্রিকা"))).toBe(true);
    expect(local.every((article) => !article.title.endsWith(" - বর্তমান"))).toBe(true);
    expect(local.every((article) => !article.title.endsWith(" - কালের কণ্ঠ"))).toBe(true);
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

  it("provides top stories mixing Bengali, English and Hindi with publisher diversity", () => {
    const top = getTopStories(6);
    expect(top).toHaveLength(6);

    // The front page mixes all three languages by design (en → bn → hi lanes).
    const langs = new Set(top.map((article) => article.language ?? "en"));
    expect(langs.has("en")).toBe(true);
    expect(langs.has("bn")).toBe(true);
    expect(langs.has("hi")).toBe(true);

    // Within each language lane the ranking order is preserved.
    for (const lang of MIX_LANGUAGES) {
      const lane = top.filter((article) => (article.language ?? "en") === lang).map((article) => article.score);
      expect(lane).toEqual([...lane].sort((a, b) => b - a));
    }
  });

  it("reports per-category counts in the status payload", () => {
    const status = getStatus();
    for (const id of CATEGORY_IDS) {
      expect(status.countsByCategory[id] ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("languages", () => {
  it("mixes Bengali, English and Hindi on the front page while lang= still filters one desk", async () => {
    const { getLanguageArticles, languageCounts } = await import("../store");
    const counts = languageCounts();
    expect(counts.bn).toBeGreaterThan(0);
    expect(counts.hi).toBeGreaterThan(0);
    expect(counts.ta).toBeGreaterThan(0);

    // "Top stories" mixes bn · en · hi; Tamil stays opt-in via lang=ta.
    const top = getTopStories(50);
    const topLangs = new Set(top.map((article) => article.language ?? "en"));
    for (const lang of MIX_LANGUAGES) expect(topLangs.has(lang)).toBe(true);
    expect(top.every((article) => (article.language ?? "en") !== "ta")).toBe(true);

    const bn = await queryNews({ lang: "bn", limit: 20 });
    expect(bn.total).toBe(counts.bn);
    expect(bn.articles.every((article) => article.language === "bn")).toBe(true);
    expect(bn.articles.some((article) => article.sourceName === "আনন্দবাজার পত্রিকা")).toBe(true);

    // Category listings mix the same three languages.
    const world = await queryNews({ category: "world", limit: 100 });
    for (const lang of MIX_LANGUAGES) {
      expect(world.articles.some((article) => (article.language ?? "en") === lang)).toBe(true);
    }

    expect(getLanguageArticles("ta", 3).length).toBeLessThanOrEqual(3);
    expect(getLanguageArticles("ta", 3).every((article) => article.language === "ta")).toBe(true);
  });

  it("keeps the Local desk exclusively Bengali", async () => {
    const local = await queryNews({ category: "local", limit: 50 });
    expect(local.total).toBeGreaterThan(0);
    expect(local.articles.every((article) => article.language === "bn")).toBe(true);
  });
});
