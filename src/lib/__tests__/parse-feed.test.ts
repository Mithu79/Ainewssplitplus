import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFeedXml, repairXml, text, textAll } from "../parse-feed";

const fixture = (name: string) => readFileSync(join(process.cwd(), "src/lib/__fixtures__", name), "utf8");

describe("parseFeedXml — RSS 2.0", () => {
  const feed = parseFeedXml(fixture("rss.xml"));

  it("detects the format and channel metadata", () => {
    expect(feed.format).toBe("rss");
    expect(feed.title).toBe("Test Wire — World");
    expect(feed.link).toBe("https://wire.example.com/world");
    expect(feed.updatedRaw).toBe("Sun, 20 Sep 2026 10:00:00 GMT");
  });

  it("reads every item, including the one we later drop", () => {
    expect(feed.items).toHaveLength(7);
  });

  it("unwraps CDATA titles", () => {
    expect(feed.items[0].title).toBe("Breaking: Summit ends with surprise deal");
  });

  it("keeps HTML in descriptions for the normaliser to strip", () => {
    expect(feed.items[0].description).toContain("<b>three days</b>");
    expect(feed.items[0].content).toContain("climate finance");
  });

  it("collects media images and skips video media", () => {
    expect(feed.items[0].images).toContain("https://cdn.wire.example.com/summit-1200.jpg");
    expect(feed.items[0].images).toContain("https://cdn.wire.example.com/summit-thumb.jpg");
    expect(feed.items[2].mediaMedium).toBe("video");
    expect(feed.items[2].images).not.toContain("https://cdn.wire.example.com/goals.mp4");
  });

  it("reads dc:creator, categories and the syndication source", () => {
    expect(feed.items[0].author).toBe("Jane Reporter");
    expect(feed.items[0].categories).toEqual(["Europe", "Diplomacy"]);
    expect(feed.items[1].publisher).toBe("Other Wire");
    expect(feed.items[1].publisherUrl).toBe("https://other.example.com");
  });

  it("leaves entities for a single decoding pass later", () => {
    expect(feed.items[6].title).toBe("Coalition &amp; opposition agree budget timetable");
  });
});

describe("parseFeedXml — Atom", () => {
  const feed = parseFeedXml(fixture("atom.xml"));

  it("detects atom and reads feed level links", () => {
    expect(feed.format).toBe("atom");
    expect(feed.title).toBe("The Test Verge");
    expect(feed.link).toBe("https://verge.example.com/");
    expect(feed.items).toHaveLength(3);
  });

  it("prefers the rel=alternate link over rel=self", () => {
    expect(feed.items[0].link).toBe("https://verge.example.com/2026/9/20/1234/chip-2nm");
  });

  it("keeps relative hrefs so they can be resolved against the feed link", () => {
    expect(feed.items[1].link).toBe("/2026/9/19/1200/robot-learning");
  });

  it("reads author names and category terms", () => {
    expect(feed.items[0].author).toBe("Terrence Test");
    expect(feed.items[0].categories).toEqual(["tech", "hardware"]);
  });

  it("flags video media and collects image enclosures", () => {
    expect(feed.items[1].mediaMedium).toBe("video");
    expect(feed.items[1].images).toEqual([]);
    expect(feed.items[2].images).toContain("https://cdn.verge.example.com/bundles.jpg");
  });
});

describe("resilience", () => {
  it("parses stray ampersands instead of throwing", () => {
    const feed = parseFeedXml(
      `<rss version="2.0"><channel><item><title>Tom & Jerry return</title><link>https://a.example/x</link></item></channel></rss>`,
    );
    expect(feed.items).toHaveLength(1);
    expect(text(feed.items[0].title)).toContain("Tom");
  });

  it("returns an empty unknown feed for non-XML payloads", () => {
    const feed = parseFeedXml("<html><body>Not a feed</body></html>");
    expect(feed.items).toHaveLength(0);
  });

  it("repairXml only escapes bare ampersands", () => {
    expect(repairXml("Tom & Jerry &amp; Co &#169;")).toBe("Tom &amp; Jerry &amp; Co &#169;");
  });
});

describe("value helpers", () => {
  it("text() flattens every shape fast-xml-parser produces", () => {
    expect(text("plain")).toBe("plain");
    expect(text({ __cdata: "cdata value" })).toBe("cdata value");
    expect(text({ "#text": "text node" })).toBe("text node");
    expect(text([{ __cdata: "first" }, "second"])).toBe("first");
    expect(text(undefined)).toBe("");
    expect(text({})).toBe("");
  });

  it("textAll() always returns an array", () => {
    expect(textAll("one")).toEqual(["one"]);
    expect(textAll(["a", { __cdata: "b" }])).toEqual(["a", "b"]);
    expect(textAll(undefined)).toEqual([]);
  });
});
