import { describe, expect, it } from "vitest";
import { applyRanking, diversify, isBreaking, leadScore, recencyBoost, scoreArticle, sortArticles } from "../rank";
import type { FeedSource } from "../types";
import { FIXED_NOW, makeArticle } from "./helpers";

const hoursAgo = (h: number) => new Date(FIXED_NOW - h * 3_600_000).toISOString();

describe("recencyBoost", () => {
  it("decays with age", () => {
    const fresh = makeArticle({ title: "Fresh story about the summit", publishedAt: hoursAgo(1) });
    const old = makeArticle({ title: "Older story about the summit", publishedAt: hoursAgo(48) });
    expect(recencyBoost(fresh, FIXED_NOW)).toBeGreaterThan(recencyBoost(old, FIXED_NOW));
  });

  it("decays faster for sport than for science", () => {
    const sport = makeArticle({ title: "Match report", primaryCategory: "sports", publishedAt: hoursAgo(24) });
    const science = makeArticle({ title: "Research finding", primaryCategory: "science", publishedAt: hoursAgo(24) });
    expect(recencyBoost(science, FIXED_NOW)).toBeGreaterThan(recencyBoost(sport, FIXED_NOW));
  });
});

describe("scoreArticle", () => {
  it("rewards trusted sources", () => {
    const article = makeArticle({ title: "Council approves the new housing plan" });
    expect(scoreArticle(article, 5, FIXED_NOW)).toBeGreaterThan(scoreArticle(article, 2, FIXED_NOW));
  });

  it("boosts breaking language", () => {
    const plain = makeArticle({ title: "Council approves the new housing plan", publishedAt: hoursAgo(2) });
    const breaking = makeArticle({ title: "Breaking: Council approves housing plan", publishedAt: hoursAgo(2) });
    expect(scoreArticle(breaking, 4, FIXED_NOW)).toBeGreaterThan(scoreArticle(plain, 4, FIXED_NOW));
  });

  it("penalises newsletters and quizzes", () => {
    const story = makeArticle({ title: "Council approves the new housing plan", publishedAt: hoursAgo(2) });
    const quiz = makeArticle({ title: "The daily quiz: Monday 14 September", publishedAt: hoursAgo(2) });
    expect(scoreArticle(story, 4, FIXED_NOW)).toBeGreaterThan(scoreArticle(quiz, 4, FIXED_NOW));
  });

  it("rewards images and standfirsts", () => {
    const bare = makeArticle({ title: "Council approves the new housing plan", image: undefined, summary: "" });
    const rich = makeArticle({
      title: "Council approves the new housing plan",
      image: "https://cdn.example/photo.jpg",
      summary: "A detailed standfirst that explains what happened and why it matters to residents.",
    });
    expect(scoreArticle(rich, 4, FIXED_NOW)).toBeGreaterThan(scoreArticle(bare, 4, FIXED_NOW));
  });
});

describe("isBreaking", () => {
  it("is true for very fresh stories", () => {
    expect(isBreaking(makeArticle({ title: "Council approves plan", publishedAt: hoursAgo(0.5) }), FIXED_NOW)).toBe(true);
  });
  it("is true for explicit breaking language at any age", () => {
    expect(isBreaking(makeArticle({ title: "Breaking: big news", publishedAt: hoursAgo(30) }), FIXED_NOW)).toBe(true);
  });
  it("is false for ordinary older stories", () => {
    expect(isBreaking(makeArticle({ title: "Council approves plan", publishedAt: hoursAgo(6) }), FIXED_NOW)).toBe(false);
  });
});

describe("applyRanking", () => {
  it("mutates articles with scores and breaking flags", () => {
    const articles = [
      makeArticle({ title: "Breaking: Council approves the housing plan", publishedAt: hoursAgo(0.2) }),
      makeArticle({ title: "Weekly newsletter: what you missed", publishedAt: hoursAgo(20) }),
    ];
    applyRanking(articles, new Map([["wire", { id: "wire", name: "Test Wire", category: "world", weight: 4 } as FeedSource]]), FIXED_NOW);
    expect(articles[0].score).toBeGreaterThan(articles[1].score);
    expect(articles[0].breaking).toBe(true);
    expect(articles[1].breaking).toBe(false);
  });
});

describe("sorting and diversity", () => {
  it("sorts newest first", () => {
    const sorted = sortArticles(
      [
        makeArticle({ title: "Older story", link: "https://a.example/old", publishedAt: hoursAgo(30), score: 90 }),
        makeArticle({ title: "Newer story", link: "https://a.example/new", publishedAt: hoursAgo(1), score: 10 }),
      ],
      "newest",
    );
    expect(sorted[0].title).toBe("Newer story");
  });

  it("caps how often one domain appears at the top", () => {
    const articles = [
      makeArticle({ title: "A1", link: "https://a.example/1", domain: "a.example", score: 100 }),
      makeArticle({ title: "A2", link: "https://a.example/2", domain: "a.example", score: 90 }),
      makeArticle({ title: "A3", link: "https://a.example/3", domain: "a.example", score: 80 }),
      makeArticle({ title: "A4", link: "https://a.example/4", domain: "a.example", score: 70 }),
      makeArticle({ title: "B1", link: "https://b.example/1", domain: "b.example", score: 10 }),
    ];
    const out = diversify(articles, 2);
    expect(out.slice(0, 3).map((a) => a.domain)).toEqual(["a.example", "a.example", "b.example"]);
    expect(out).toHaveLength(5);
  });

  it("leadScore penalises aggregator redirects", () => {
    const direct = makeArticle({ title: "Same headline here", link: "https://a.example/1", domain: "a.example", score: 50 });
    const redirect = makeArticle({ title: "Same headline here", link: "https://news.google.com/x", domain: "news.google.com", score: 80 });
    expect(leadScore(direct)).toBeGreaterThan(leadScore(redirect));
  });
});
