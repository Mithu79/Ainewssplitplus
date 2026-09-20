import type { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { errorResponse, jsonResponse, stringParam } from "@/lib/http";
import { refreshAll, getStatus } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  if (!config.refreshToken) return true;
  const fromQuery = stringParam(request.nextUrl.searchParams.get("token"), 200);
  const header = request.headers.get("authorization") ?? "";
  const fromHeader = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : header.trim();
  return fromQuery === config.refreshToken || fromHeader === config.refreshToken;
}

/**
 * POST /api/refresh — forces an immediate crawl of every registered feed.
 * This is what the bundled GitHub Actions schedule calls.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return errorResponse("Invalid or missing refresh token.", 401);
  }

  const region = stringParam(request.nextUrl.searchParams.get("region"), 80);
  const started = Date.now();

  try {
    await refreshAll({ force: true, region });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Refresh failed", 500);
  }

  const status = getStatus();
  const okFeeds = status.sources.filter((source) => source.state === "ok").length;

  return jsonResponse({
    ok: true,
    durationMs: Date.now() - started,
    feedsResponding: okFeeds,
    feedsRegistered: status.sources.length,
    status,
  });
}

export async function GET() {
  return errorResponse("Use POST /api/refresh to trigger a crawl.", 405, {
    hint: "curl -X POST http://localhost:3000/api/refresh",
  });
}
