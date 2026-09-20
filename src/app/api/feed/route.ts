import type { NextRequest } from "next/server";
import { isCategoryId } from "@/lib/categories";
import { config } from "@/lib/config";
import { intParam } from "@/lib/http";
import { buildRssFeed } from "@/lib/rss-output";
import { queryNews } from "@/lib/store";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/feed?category=tech&limit=40
 * NewsSplit's own RSS 2.0 output, so the aggregate can be consumed anywhere.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawCategory = (sp.get("category") ?? "top").toLowerCase();
  const category: CategoryId | "top" =
    rawCategory === "top" || rawCategory === "all" || !isCategoryId(rawCategory) ? "top" : (rawCategory as CategoryId);
  const limit = intParam(sp.get("limit"), 40, 1, 200);

  const result = await queryNews({ category, limit, sort: "rank" });
  const label = category === "top" ? "Top stories" : `${category[0].toUpperCase()}${category.slice(1)} news`;

  const xml = buildRssFeed(result.articles, {
    title: `${config.siteName} — ${label}`,
    description: `${label} aggregated and ranked by ${config.siteName} from ${result.facets.sources.length} publishers in this page.`,
    link: `${config.siteUrl}${category === "top" ? "/" : `/category/${category}`}`,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-NewsSplit-Mode": result.mode,
    },
  });
}
