import { afterEach, describe, expect, it, vi } from "vitest";
import { isTranslateTarget } from "../i18n/locales";
import { clearTranslateCache, translateCacheKey, translateSegments } from "../translate";

function googleMock() {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { q: string[]; target: string; source?: string };
    return new Response(
      JSON.stringify({
        data: {
          translations: body.q.map((text) => ({
            translatedText: `T(${body.target}):${text}`,
            detectedSourceLanguage: body.source ?? "en",
          })),
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
}

describe("isTranslateTarget", () => {
  it("accepts Bengali, English and Hindi only", () => {
    expect(isTranslateTarget("bn")).toBe(true);
    expect(isTranslateTarget("en")).toBe(true);
    expect(isTranslateTarget("hi")).toBe(true);
    expect(isTranslateTarget("ta")).toBe(false);
    expect(isTranslateTarget("fr")).toBe(false);
    expect(isTranslateTarget(undefined)).toBe(false);
  });
});

describe("translateSegments", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearTranslateCache();
  });

  it("reports not-configured when no API key is available", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await translateSegments({ texts: ["Hello"], target: "bn", apiKey: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not-configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns originals without an API call when source already is the target", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await translateSegments({ texts: ["নমস্কার"], target: "bn", source: "bn-IN", apiKey: "test-key" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.segments).toEqual([{ text: "নমস্কার", translatedText: "নমস্কার", detectedSourceLanguage: "bn-IN" }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("batches cache misses into one call and preserves order and duplicates", async () => {
    const fetchMock = googleMock();
    vi.stubGlobal("fetch", fetchMock);

    const result = await translateSegments({
      texts: ["Hello", "World", "Hello"],
      target: "hi",
      apiKey: "test-key",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.segments.map((s) => s.translatedText)).toEqual(["T(hi):Hello", "T(hi):World", "T(hi):Hello"]);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.q).toEqual(["Hello", "World"]); // duplicates shipped once
    expect(body.target).toBe("hi");
  });

  it("serves repeat requests from the cache", async () => {
    const fetchMock = googleMock();
    vi.stubGlobal("fetch", fetchMock);

    await translateSegments({ texts: ["Hello"], target: "bn", apiKey: "test-key" });
    await translateSegments({ texts: ["Hello", "Hello"], target: "bn", apiKey: "test-key" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends the key as a header and the source hint in the body", async () => {
    const fetchMock = googleMock();
    vi.stubGlobal("fetch", fetchMock);

    await translateSegments({ texts: ["Hello"], target: "bn", source: "en", apiKey: "secret-key" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Goog-Api-Key"]).toBe("secret-key");
    expect(JSON.parse(String(init.body)).source).toBe("en");
  });

  it("maps upstream failures to a typed error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota exceeded", { status: 429 })));
    const result = await translateSegments({ texts: ["Hello"], target: "bn", apiKey: "test-key" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("upstream");
      expect(result.error).toContain("429");
    }
  });

  it("cache keys separate target, source and text", () => {
    expect(translateCacheKey("bn", "en", "Hello")).not.toBe(translateCacheKey("hi", "en", "Hello"));
    expect(translateCacheKey("bn", "en", "Hello")).not.toBe(translateCacheKey("bn", undefined, "Hello"));
    expect(translateCacheKey("bn", "en", "Hello")).toBe(translateCacheKey("bn", "en", "Hello"));
  });
});
