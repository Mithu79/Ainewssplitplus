import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getCluster, getRelated } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/story/{clusterId} — one clustered story plus related coverage. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const cluster = getCluster(id);

  if (!cluster) {
    return errorResponse(`No cluster with id "${id}". Clusters are rebuilt on every crawl.`, 404);
  }

  return jsonResponse({
    ok: true,
    cluster,
    coverage: cluster.items.map((item) => ({
      id: item.id,
      title: item.title,
      link: item.link,
      source: item.sourceName,
      domain: item.domain,
      publishedAt: item.publishedAt,
    })),
    related: getRelated(cluster.lead, 6),
  });
}
