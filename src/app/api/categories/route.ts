import { CATEGORIES } from "@/lib/categories";
import { jsonResponse } from "@/lib/http";
import { sourcesForCategory } from "@/lib/sources";
import { getStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/categories — metadata, live counts and the feeds behind each section. */
export async function GET() {
  const status = getStatus();

  return jsonResponse({
    ok: true,
    mode: status.mode,
    generatedAt: new Date().toISOString(),
    total: status.articleCount,
    categories: CATEGORIES.map((category) => {
      const feeds = sourcesForCategory(category.id);
      return {
        id: category.id,
        label: category.label,
        tagline: category.tagline,
        accent: category.accent,
        href: category.href,
        count: status.countsByCategory[category.id] ?? 0,
        feeds: feeds.map((feed) => ({ id: feed.id, name: feed.name, weight: feed.weight })),
      };
    }),
  });
}
