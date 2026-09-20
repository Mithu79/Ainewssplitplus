import { config } from "./config";

/**
 * HTTP layer for the crawler: timeouts, one retry, a browser-ish Accept header
 * and a small concurrency limiter so a refresh never opens 40 sockets at once.
 */

export interface FetchResult {
  url: string;
  ok: boolean;
  status?: number;
  body?: string;
  ms: number;
  error?: string;
  finalUrl?: string;
}

const USER_AGENT =
  "NewsSplit/1.0 (+https://github.com/Mithu79/Ainewssplitplus) RSS reader; compatible with FeedFetcher";

/** 8 MiB — far larger than any legitimate text feed; stops XML-bomb style abuse. */
export const MAX_BODY_BYTES = 8 * 1024 * 1024;

/** Reads a response body but aborts if it exceeds `maxBytes`. */
async function readBodyLimited(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`Response larger than ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error(`Response larger than ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

export async function fetchText(
  url: string,
  options: { timeoutMs?: number; retries?: number; headers?: Record<string, string> } = {},
): Promise<FetchResult> {
  const timeoutMs = options.timeoutMs ?? config.requestTimeoutMs;
  const retries = options.retries ?? config.retries;
  const started = Date.now();

  let lastError: string | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) await sleep(300 * attempt);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...options.headers,
        },
      });
      lastStatus = response.status;
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // Client errors will not fix themselves on retry.
          return { url, ok: false, status: response.status, ms: Date.now() - started, error: lastError };
        }
        continue;
      }
      const body = await readBodyLimited(response, MAX_BODY_BYTES);
      if (!body || body.length < 32) {
        lastError = "Empty response body";
        continue;
      }
      return {
        url,
        ok: true,
        status: response.status,
        body,
        ms: Date.now() - started,
        finalUrl: response.url,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (/timeout|aborted/i.test(lastError)) lastError = `Timed out after ${timeoutMs}ms`;
    }
  }

  return {
    url,
    ok: false,
    status: lastStatus,
    ms: Date.now() - started,
    error: lastError ?? "Unknown error",
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs `worker` over `items` with at most `limit` in flight, preserving order. */
export async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}
