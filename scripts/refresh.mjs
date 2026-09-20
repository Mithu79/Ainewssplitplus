#!/usr/bin/env node
/**
 * Triggers an immediate crawl on a running NewsSplit instance.
 *
 *   node scripts/refresh.mjs                        # http://localhost:3000
 *   node scripts/refresh.mjs https://news.example   # any deployment
 *   REFRESH_TOKEN=secret node scripts/refresh.mjs   # when the endpoint is protected
 *
 * Exit code 0 = crawl succeeded, 1 = failure (handy for cron mail and CI).
 */

const target = process.argv[2] || process.env.NEWS_SPLIT_URL || "http://localhost:3000";
const token = process.env.REFRESH_TOKEN || "";

const url = new URL("/api/refresh", target.replace(/\/$/, ""));
if (token) url.searchParams.set("token", token);

const started = Date.now();

try {
  const response = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(`[newssplit] refresh failed: HTTP ${response.status} — ${data.error ?? "unknown error"}`);
    process.exit(1);
  }

  const status = data.status ?? {};
  const okFeeds = (status.sources ?? []).filter((source) => source.state === "ok").length;
  console.log(
    `[newssplit] crawl ok in ${data.durationMs ?? Date.now() - started}ms — ` +
      `${status.articleCount ?? 0} stories, ${status.clusterCount ?? 0} clusters, ` +
      `${okFeeds}/${(status.sources ?? []).length} feeds responded (mode: ${status.mode})`,
  );
  process.exit(okFeeds > 0 ? 0 : 2);
} catch (error) {
  console.error(`[newssplit] could not reach ${url.toString()}: ${error.message}`);
  process.exit(1);
}
