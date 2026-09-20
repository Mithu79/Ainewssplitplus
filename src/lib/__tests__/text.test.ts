import { describe, expect, it } from "vitest";
import { salientTokens, tokenize, truncate } from "../text";

describe("tokenize", () => {
  it("lowercases, strips punctuation and lightly stems", () => {
    expect(tokenize("Drones attacked Moscow!")).toEqual(["drone", "attack", "moscow"]);
    expect(tokenize("stories of watches")).toEqual(["story", "of", "watch"]);
    expect(tokenize("press passes")).toEqual(["press", "pass"]); // -ss never stemmed to garbage
  });

  it("keeps hyphenated words and drops single characters", () => {
    expect(tokenize("31-year high — a win")).toEqual(["31-year", "high", "win"]); // "a" is length 1 → dropped
  });
});

describe("salientTokens", () => {
  it("removes stopwords and bare numerals", () => {
    expect(salientTokens("Moscow attacked by more than 1,000 Ukrainian drones")).toEqual([
      "moscow",
      "attack",
      "ukraine",
      "drone",
    ]);
  });

  it("folds demonyms onto their country", () => {
    expect(salientTokens("Russian and British officials")).toEqual(["russia", "uk", "official"]);
  });
});

describe("truncate", () => {
  it("cuts on a word boundary with an ellipsis", () => {
    const out = truncate("The quick brown fox jumps over the lazy dog", 20);
    expect(out.length).toBeLessThanOrEqual(21);
    expect(out.endsWith("…")).toBe(true);
  });

  it("leaves short strings untouched", () => {
    expect(truncate("Short headline", 80)).toBe("Short headline");
  });
});
