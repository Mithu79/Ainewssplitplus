import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleId, canonicalUrl } from "../hash";
import { cleanSummary, cleanTitle, normalizeItem, parseFeedDate, pickImage, resolveLink } from "../normalize";
import { parseFeedXml } from "../parse-feed";
import type { Article, FeedSource, RawItem } from "../types";

const fixture = (name: string) => readFileSync(join(process.cwd(), "src/lib/__fixtures__", name), "utf8");

const NOW = Date.parse("2026-09-20T12:00:00Z");

const wire: FeedSource = {
  id: "wire",
  name: "Test Wire",
  category: "world",
  url: "https://wire.example.com/world",
  site: "https://wire.example.com",
  weight: 5,
};

const googleNews: FeedSource = {
  id: "gn-local",
  name: "Google News",
  category: "local",
  kind: "google-news",
  site: "https://news.google.com",
  weight: 3,
};

function normalizeFeed(name: string, source: FeedSource): Article[] {
  const feed = parseFeedXml(fixture(name));
  const articles = feed.items
    .map((raw) => normalizeItem(raw, { source, now: NOW, feedLink: feed.link }))
    .filter((article): article is Article => Boolean(article));
  return articles;
}

describe("normalizeItem — RSS", () => {
  const articles = normalizeFeed("rss.xml", wire);
  const byTitle = (fragment: string) => articles.find((article) => article.title.includes(fragment));

  it("drops items with no usable link", () => {
    expect(articles).toHaveLength(6);
    expect(byTitle("Orphan story")).toBeUndefined();
  });

  it("decodes entities exactly once", () => {
    expect(byTitle("Coalition & opposition agree budget timetable")).toBeDefined();
  });

  it("strips HTML out of summaries and keeps the text", () => {
    const lead = byTitle("Summit ends with surprise deal");
    expect(lead?.summary).toBe("Negotiators agreed a final text after three days of talks in Geneva.");
    expect(lead?.summary).not.toContain("<");
  });

  it("prefers the largest media image", () => {
    expect(byTitle("Breaking: Summit")?.image).toBe("https://cdn.wire.example.com/summit-1200.jpg");
  });

  it("parses RFC822 and space separated dates", () => {
    expect(byTitle("Breaking: Summit")?.publishedAt).toBe("2026-09-20T09:30:00.000Z");
    expect(byTitle("Markets open higher")?.publishedAt).toBe("2026-09-20T08:45:48.000Z");
  });

  it("flags video items and estimates reading time", () => {
    expect(byTitle("Watch: All the goals")?.isVideo).toBe(true);
    const lead = byTitle("Breaking: Summit");
    expect(lead?.wordCount).toBeGreaterThan(15);
    expect(lead?.readingMinutes).toBe(1);
  });

  it("maps feed metadata onto the article", () => {
    const lead = byTitle("Breaking: Summit");
    expect(lead?.sourceId).toBe("wire");
    expect(lead?.sourceName).toBe("Test Wire");
    expect(lead?.domain).toBe("wire.example.com");
    expect(lead?.author).toBe("Jane Reporter");
    expect(lead?.tags).toEqual(["Europe", "Diplomacy"]);
    expect(lead?.categories).toEqual(["world"]);
  });

  it("uses the syndication publisher when present", () => {
    const other = articles.find((article) => article.link.includes("other.example.com"));
    expect(other?.sourceName).toBe("Other Wire");
    expect(other?.domain).toBe("other.example.com");
  });
});

describe("normalizeItem — Atom", () => {
  const verge: FeedSource = {
    id: "verge",
    name: "The Test Verge",
    category: "tech",
    kind: "atom",
    url: "https://verge.example.com/rss/index.xml",
    site: "https://verge.example.com",
    weight: 5,
  };
  const articles = normalizeFeed("atom.xml", verge);

  it("normalises every entry", () => {
    expect(articles).toHaveLength(3);
  });

  it("resolves relative links against the feed link", () => {
    const robot = articles.find((article) => article.title.includes("robot"));
    expect(robot?.link).toBe("https://verge.example.com/2026/9/19/1200/robot-learning");
  });

  it("converts offset timestamps to UTC ISO", () => {
    const chip = articles.find((article) => article.title.includes("2nm"));
    expect(chip?.publishedAt).toBe("2026-09-20T12:45:48.000Z");
    expect(chip?.author).toBe("Terrence Test");
    expect(chip?.image).toBe("https://cdn.verge.example.com/chip.jpg");
    expect(chip?.tags).toEqual(["tech", "hardware"]);
  });

  it("treats video media as video and does not use it as the thumbnail", () => {
    const robot = articles.find((article) => article.title.includes("robot"));
    expect(robot?.isVideo).toBe(true);
    expect(robot?.image).toBeUndefined();
  });
});

describe("Google News style aggregation", () => {
  const raw: RawItem = {
    title: "Santa Cruz police chief Bernie Escalante to retire after 30 years - Local News Matters",
    link: "https://news.google.com/rss/articles/CBMiqgFBVV95cUxQ?oc=5",
    publishedRaw: "Sun, 20 Sep 2026 14:00:00 GMT",
    images: [],
    categories: [],
  };

  it("splits the publisher out of the headline", () => {
    const article = normalizeItem(raw, { source: googleNews, now: NOW });
    expect(article?.title).toBe("Santa Cruz police chief Bernie Escalante to retire after 30 years");
    expect(article?.sourceName).toBe("Local News Matters");
    expect(article?.primaryCategory).toBe("local");
  });

  it("does not split headlines that merely contain a dash", () => {
    const { title, publisher } = cleanTitle("Live: Reaction as the votes are counted - live", false);
    expect(title).toBe("Live: Reaction as the votes are counted - live");
    expect(publisher).toBeUndefined();
  });
});

describe("helpers", () => {
  it("parseFeedDate rejects nonsense and impossible dates", () => {
    expect(parseFeedDate("not a date")).toBeNull();
    expect(parseFeedDate(undefined)).toBeNull();
    expect(parseFeedDate("Thu, 01 Jan 1970 00:00:00 GMT")).toBeNull();
    expect(parseFeedDate("Sun, 20 Sep 2026 09:30:00 GMT", NOW)?.toISOString()).toBe("2026-09-20T09:30:00.000Z");
  });

  it("canonicalUrl strips tracking parameters and fragments", () => {
    expect(canonicalUrl("https://www.bbc.co.uk/news/x?utm_source=rss#main")).toBe("bbc.co.uk/news/x");
    expect(canonicalUrl("https://bbc.co.uk/news/x/")).toBe("bbc.co.uk/news/x");
  });

  it("articleId is stable across tracking parameters", () => {
    expect(articleId("https://x.example/a?utm_campaign=rss")).toBe(articleId("https://www.x.example/a/"));
  });

  it("resolveLink falls back safely", () => {
    expect(resolveLink("/story", "https://site.example/feed")).toBe("https://site.example/story");
    expect(resolveLink("javascript:alert(1)")).toBe("");
    expect(resolveLink("")).toBe("");
  });

  it("pickImage ignores logos and non-http urls", () => {
    expect(
      pickImage(
        { images: ["data:image/gif;base64,AAA", "https://x.example/site-logo.png", "https://x.example/photo.jpg"], categories: [] },
        "",
      ),
    ).toBe("https://x.example/photo.jpg");
  });

  it("cleanSummary removes aggregator boilerplate", () => {
    expect(cleanSummary("<p>Body text.</p> Read the full story at The Verge.")).toBe("Body text.");
    expect(cleanSummary("Hello [link](https://x.example) world")).toBe("Hello link world");
  });

  it("cleanTitle trims brackets and whitespace", () => {
    expect(cleanTitle("  [ Video ]  ", false).title).toBe("Video");
  });
});
