import { config } from "@/lib/config";
import { jsonResponse } from "@/lib/http";
import { allSources } from "@/lib/sources";
import { getStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/status — crawler health, polled by the header pill. */
export async function GET() {
  const status = getStatus();

  return jsonResponse({
    ...status,
    ok: status.mode !== "empty",
    config: {
      refreshIntervalMinutes: Math.round(config.refreshIntervalMs / 60_000),
      requestTimeoutSeconds: Math.round(config.requestTimeoutMs / 1000),
      concurrency: config.concurrency,
      maxItemsPerSource: config.maxItemsPerSource,
      offlineMode: config.offlineMode,
      defaultRegion: config.defaultRegion,
      registeredFeeds: allSources().length,
    },
    lastError: status.lastError ?? null,
  });
}
