import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the real fetch → parse → normalise → store pipeline without relying
// on publisher availability. The normal suite defaults to offline=always.
let store: typeof import("../store");
let fetchMock: ReturnType<typeof vi.fn>;

const feed = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test newsroom</title><link>https://news.example.com</link>
    <item>
      <title>Scientists publish new findings from ocean expedition</title>
      <link>https://news.example.com/ocean-expedition</link>
      <description>Researchers share results from their latest deep ocean survey.</description>
      <media:content medium="image" url="https://news.example.com/ocean-photo.jpg" />
    </item>
  </channel>
</rss>`;

describe("live-only crawler", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("NEWS_SPLIT_OFFLINE", "never");
    vi.stubEnv("FETCH_RETRIES", "0");
    fetchMock = vi.fn(async () => new Response(feed));
    vi.stubGlobal("fetch", fetchMock);
    store = await import("../store");
    store.__resetStoreForTests();
  });

  afterEach(() => {
    store.__resetStoreForTests();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("starts empty rather than loading the bundled snapshot", () => {
    expect(store.getStatus()).toMatchObject({
      offlineMode: "never",
      mode: "empty",
      articleCount: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("crawls registered feeds and preserves publisher image URLs", async () => {
    await store.refreshAll();

    const { allSources, resolveSourceUrl } = await import("../sources");
    const { config } = await import("../config");
    const sources = allSources().filter((source) => source.enabled !== false);
    expect(sources.length).toBeGreaterThan(20);
    expect(fetchMock).toHaveBeenCalledTimes(sources.length);
    for (const source of sources) {
      const url = resolveSourceUrl(source, config.defaultRegion);
      expect(url).toMatch(/^https?:\/\//);
      expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ cache: "no-store" }));
    }

    expect(store.getStatus()).toMatchObject({ mode: "live", articleCount: 1, lastError: null });
    expect(store.getStatus().lastSuccessfulRefreshAt).not.toBeNull();
    const { articles } = await store.queryNews({ limit: 10 });
    expect(articles[0].image).toBe("https://news.example.com/ocean-photo.jpg");
    expect(articles[0].link).toBe("https://news.example.com/ocean-expedition");
  });

  it("reports feed failures without adopting the snapshot", async () => {
    fetchMock.mockImplementation(async () => new Response("Feed unavailable", { status: 503 }));
    await store.refreshAll();

    const status = store.getStatus();
    expect(status).toMatchObject({ mode: "empty", articleCount: 0, lastError: "HTTP 503" });
    expect(status.sources.filter((source) => source.state === "error").length).toBeGreaterThan(20);
    expect((await store.queryNews({ limit: 10 })).articles).toEqual([]);
  });

  it("keeps previously crawled stories as stale after a later outage", async () => {
    await store.refreshAll();
    fetchMock.mockImplementation(async () => new Response("Feed unavailable", { status: 503 }));
    await store.refreshAll();

    expect(store.getStatus()).toMatchObject({ mode: "stale", articleCount: 1 });
    expect((await store.queryNews({ limit: 10 })).articles[0].image).toBe(
      "https://news.example.com/ocean-photo.jpg",
    );
  });
});
