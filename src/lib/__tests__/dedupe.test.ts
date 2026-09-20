import { describe, expect, it } from "vitest";
import { clusterArticles, dedupeById, headlineSimilarity, sameStory } from "../dedupe";
import { salientTokens } from "../text";
import type { CategoryId } from "../types";
import { FIXED_NOW, makeArticle } from "./helpers";

describe("dedupeById", () => {
  it("merges the same URL syndicated into two feeds and unions categories", () => {
    const link = "https://bbc.example.com/news/articles/gemini-hack";
    const a = makeArticle({
      title: "Gemini AI hacked three companies in a security test",
      link: `${link}?utm_source=rss`,
      categories: ["world"] as CategoryId[],
      primaryCategory: "world",
      publishedAt: new Date(FIXED_NOW - 3 * 3_600_000).toISOString(),
    });
    const b = makeArticle({
      title: "Gemini AI hacked three companies in a security test",
      link,
      categories: ["business"] as CategoryId[],
      primaryCategory: "business",
      summary: "",
      publishedAt: new Date(FIXED_NOW - 5 * 3_600_000).toISOString(),
    });

    const merged = dedupeById([a, b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].categories.sort()).toEqual(["business", "world"]);
    expect(merged[0].summary).toBe("A short standfirst for testing.");
    expect(merged[0].publishedAt).toBe(b.publishedAt);
  });

  it("prefers the direct publisher link over an aggregator redirect", () => {
    const direct = makeArticle({
      title: "Mayor opens the new bridge across the river",
      link: "https://gazette.example.com/mayor-bridge",
      domain: "gazette.example.com",
    });
    const redirect = makeArticle({
      title: "Mayor opens the new bridge across the river",
      link: "https://news.google.com/rss/articles/CBMi?oc=5",
      domain: "news.google.com",
    });
    redirect.id = direct.id;

    const merged = dedupeById([redirect, direct]);
    expect(merged).toHaveLength(1);
    expect(merged[0].link).toBe("https://gazette.example.com/mayor-bridge");
  });
});

describe("headlineSimilarity", () => {
  it("measures overlap of salient tokens", () => {
    const a = salientTokens("GB reach Davis Cup Finals as Patten and Skupski win");
    const b = salientTokens("GB qualify for Davis Cup Finals after doubles win");
    const { jaccard, containment } = headlineSimilarity(a, b);
    expect(jaccard).toBeCloseTo(0.5, 5);
    expect(containment).toBeCloseTo(5 / 7, 5);
  });

  it("is zero when nothing overlaps", () => {
    expect(headlineSimilarity(["alpha", "beta"], ["gamma", "delta"])).toEqual({ jaccard: 0, containment: 0 });
  });
});

describe("clusterArticles", () => {
  it("groups reworded coverage of the same event", () => {
    const clusters = clusterArticles([
      makeArticle({
        title: "GB reach Davis Cup Finals as Patten and Skupski win",
        link: "https://a.example/1",
        sourceName: "A Wire",
        domain: "a.example",
        score: 50,
      }),
      makeArticle({
        title: "GB qualify for Davis Cup Finals after doubles win",
        link: "https://b.example/2",
        sourceName: "B Wire",
        domain: "b.example",
        score: 40,
      }),
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].items).toHaveLength(2);
    expect(clusters[0].sourceCount).toBe(2);
    expect(clusters[0].lead.title).toBe("GB reach Davis Cup Finals as Patten and Skupski win");
    expect(clusters[0].score).toBe(50);
  });

  it("keeps genuinely different stories apart", () => {
    const clusters = clusterArticles([
      makeArticle({ title: "Trump signs sweeping Russia sanctions bill", link: "https://a.example/1" }),
      makeArticle({ title: "Trump opens triumphal arch complex to store ammunition", link: "https://a.example/2" }),
      makeArticle({ title: "Cuba hit by another nationwide blackout", link: "https://a.example/3" }),
    ]);
    expect(clusters).toHaveLength(3);
  });

  it("prefers a direct publisher link as the cluster lead", () => {
    const clusters = clusterArticles([
      makeArticle({
        title: "Mayor opens the new bridge across the river today",
        link: "https://news.google.com/rss/articles/CBMi?oc=5",
        domain: "news.google.com",
        sourceName: "Google News",
        score: 90,
      }),
      makeArticle({
        title: "Mayor opens the new bridge across the river today",
        link: "https://gazette.example.com/bridge",
        domain: "gazette.example.com",
        sourceName: "Springfield Gazette",
        score: 60,
      }),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].lead.domain).toBe("gazette.example.com");
  });

  it("never merges stories published far apart", () => {
    const clusters = clusterArticles([
      makeArticle({ title: "Council approves the new housing plan", link: "https://a.example/1" }),
      makeArticle({
        title: "Council approves the new housing plan",
        link: "https://b.example/2",
        publishedAt: new Date(FIXED_NOW - 30 * 24 * 3_600_000).toISOString(),
      }),
    ]);
    expect(clusters).toHaveLength(2);
  });
});

describe("sameStory", () => {
  it("matches containment style headlines", () => {
    expect(sameStory("Breaking: Summit ends with surprise deal", "Summit ends with surprise deal")).toBe(true);
    expect(sameStory("Cuba hit by blackout", "Japan raises interest rates")).toBe(false);
  });

  it("matches reworded cross-outlet leads (stemming + demonyms + numerals)", () => {
    expect(
      sameStory(
        "Moscow attacked by more than 1,000 Ukrainian drones",
        "Largest attack on Moscow sees Ukraine fire hundreds of drones, mayor says",
      ),
    ).toBe(true);
  });

  it("keeps distinct angles on the same saga apart", () => {
    expect(
      sameStory(
        "Ed Sheeran admits 'mistakes' at first show since Macklemore controversy",
        "Everything we know about the Ed Sheeran and Macklemore controversy",
      ),
    ).toBe(false);
  });
});
