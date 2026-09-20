import snapshot from "../data/snapshot.json";
import { getSource } from "./sources";
import { articleId, domainFromUrl, originFromUrl } from "./hash";
import { hash64 } from "./hash";
import { applyRanking } from "./rank";
import { dedupeById } from "./dedupe";
import { salientTokens, splitPublisherSuffix } from "./text";
import type { Article, CategoryId, FeedSource } from "./types";

/**
 * The bundled snapshot is a real capture of the registered feeds (see
 * src/data/snapshot.json). It is served only when live crawling is impossible —
 * for example in a sandbox with no outbound network — and the UI always labels
 * it as a snapshot so nobody mistakes it for live coverage.
 */

export interface SnapshotItem {
  title: string;
  link: string;
  publishedAt: string;
  sourceId: string;
  categories: CategoryId[];
  summary?: string;
  image?: string;
  author?: string;
  isVideo?: boolean;
  tags?: string[];
}

export interface SnapshotData {
  capturedAt: string;
  note: string;
  items: SnapshotItem[];
}

const data = snapshot as SnapshotData;

export function snapshotCapturedAt(): string {
  return data.capturedAt;
}

export function snapshotNote(): string {
  return data.note;
}

export function loadSnapshotArticles(now = Date.now()): Article[] {
  const fetchedAt = new Date(Date.parse(data.capturedAt) || now).toISOString();

  const articles = data.items.flatMap((item): Article[] => {
    const source = getSource(item.sourceId);
    if (!source) return [];

    const isAggregated = source.kind === "google-news";
    const split = isAggregated ? splitPublisherSuffix(item.title) : { title: item.title };
    const publisher = isAggregated ? split.publisher : undefined;
    const title = (split.title || item.title).trim();
    if (!title) return [];

    const site = source.site;
    const domain = (site ? domainFromUrl(site) : "") || domainFromUrl(item.link);
    const categories = [...new Set([...(item.categories ?? []), source.category])];
    const publishedMs = Date.parse(item.publishedAt);

    return [
      {
        id: articleId(item.link),
        clusterId: hash64(`title:${salientTokens(title).sort().join(" ")}`),
        title,
        link: item.link,
        summary: item.summary ?? "",
        image: item.image,
        author: item.author,
        sourceId: source.id,
        sourceName: publisher || source.name,
        site: site ? originFromUrl(site) || site : undefined,
        domain,
        categories,
        primaryCategory: categories[0] ?? source.category,
        publishedAt: Number.isFinite(publishedMs) ? new Date(publishedMs).toISOString() : fetchedAt,
        fetchedAt,
        tags: item.tags ?? [],
        score: 0,
        breaking: false,
        isVideo: Boolean(item.isVideo),
      },
    ];
  });

  const sources = new Map<string, FeedSource>();
  for (const item of data.items) {
    const source = getSource(item.sourceId);
    if (source) sources.set(source.id, source);
  }

  applyRanking(articles, sources, now);
  return dedupeById(articles);
}
