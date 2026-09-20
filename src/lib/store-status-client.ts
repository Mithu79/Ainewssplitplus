/**
 * Client-safe slice of the store helpers. `src/lib/store.ts` imports `node:fs`,
 * so anything rendered in the browser must not pull it in — this module holds
 * the presentation-only functions that both sides can share.
 */

export function describeFreshness(lastRefreshAt: string | null, now = Date.now()): string {
  if (!lastRefreshAt) return "never";
  const ms = now - Date.parse(lastRefreshAt);
  if (!Number.isFinite(ms)) return "never";
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export const MODE_LABEL: Record<string, string> = {
  live: "Live feeds",
  stale: "Cached (last crawl failed)",
  snapshot: "Offline snapshot",
  empty: "No data yet",
};
