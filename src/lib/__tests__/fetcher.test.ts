import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchText, MAX_BODY_BYTES } from "../fetcher";

const URL_STUB = "https://feeds.example.com/rss.xml";

describe("fetchText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the body for a normal feed response", async () => {
    const body = `<rss><channel><title>${"x".repeat(64)}</title></channel></rss>`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body)));
    const result = await fetchText(URL_STUB, { retries: 0 });
    expect(result.ok).toBe(true);
    expect(result.body).toBe(body);
  });

  it("fails fast when content-length exceeds the cap", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("tiny", {
            headers: { "content-length": String(MAX_BODY_BYTES + 1) },
          }),
      ),
    );
    const result = await fetchText(URL_STUB, { retries: 0 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/larger than/);
  });

  it("aborts mid-stream when the body grows past the cap", async () => {
    const chunk = "y".repeat(1024 * 1024); // 1 MiB
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (let i = 0; i < 12; i += 1) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(stream)));
    const result = await fetchText(URL_STUB, { retries: 0 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/larger than/);
  });

  it("does not retry 4xx responses", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchText(URL_STUB, { retries: 2 });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
