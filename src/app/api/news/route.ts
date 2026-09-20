import type { NextRequest } from "next/server";
import { CATEGORY_IDS, getCategory } from "@/lib/categories";
import { config } from "@/lib/config";
import { errorResponse, intParam, jsonResponse, stringParam } from "@/lib/http";
import { queryNews } from "@/lib/store";
import { isCategoryId } from "@/lib/categories";
import type { NewsQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/news
 *
 * category=top|world|tech|business|sports|science|health|entertainment|local
 * q=<text>           full-text search across titles, standfirsts, tags, publishers
 * source=<id|name>   publisher facet
 * hours=<n>          only stories from the last n hours (0 = any time)
 * sort=rank|newest
 * limit / offset     pagination (limit max 100)
 * region=<place>     used by the local category
 * clustered=1        also return grouped multi-outlet coverage
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const categoryRaw = (stringParam(sp.get("category"), 32) ?? "top").toLowerCase();

  if (categoryRaw !== "top" && categoryRaw !== "all" && !isCategoryId(categoryRaw)) {
    return errorResponse(`Unknown category "${categoryRaw}".`, 400, {
      valid: ["top", ...CATEGORY_IDS],
    });
  }

  const query: NewsQuery = {
    category: categoryRaw === "all" ? "top" : (categoryRaw as NewsQuery["category"]),
    q: stringParam(sp.get("q"), 140),
    source: stringParam(sp.get("source"), 60),
    hours: intParam(sp.get("hours"), 0, 0, 24 * 60),
    sort: sp.get("sort") === "newest" ? "newest" : "rank",
    limit: intParam(sp.get("limit"), 24, 1, 100),
    offset: intParam(sp.get("offset"), 0, 0, 10_000),
    region: stringParam(sp.get("region"), 80),
    clustered: sp.get("clustered") === "1" || sp.get("clustered") === "true",
  };

  if (query.category === "local" && !query.region) query.region = config.defaultRegion;

  const result = await queryNews(query);

  return jsonResponse({
    ...result,
    category: getCategory(query.category === "top" ? "" : query.category)?.label ?? "Top stories",
    links: {
      self: `/api/news?${sp.toString()}`,
      status: "/api/status",
      feed: `/api/feed?category=${query.category ?? "top"}`,
    },
  });
}
