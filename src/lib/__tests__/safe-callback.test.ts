import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "../safe-callback";

describe("safeCallbackUrl", () => {
  it("allows same-origin paths and rejects open redirects", () => {
    expect(safeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("/category/local?region=Kolkata")).toBe("/category/local?region=Kolkata");
    expect(safeCallbackUrl(["/a", "/b"])).toBe("/a");
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
    expect(safeCallbackUrl("https://evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/dashboard");
  });
});
