import { config } from "./config";
import { articleId, canonicalUrl, domainFromUrl, originFromUrl } from "./hash";
import {
  decodeEntities,
  normalizeWhitespace,
  salientTokens,
  splitPublisherSuffix,
  stripHtml,
  truncate,
  wordCount,
} from "./text";
import { hash64 } from "./hash";
import type { Article, CategoryId, FeedSource, RawItem } from "./types";

/** Junk image URLs that should never become a card thumbnail. */
const BAD_IMAGE_RE =
  /(pixel|spacer|blank|1x1|tracking|logo|icon|avatar|badge|button|feedburner|rss[-_]?icon|share|sprite|placeholder)/i;

const BOILERPLATE: RegExp[] = [
  /read the (?:full|entire) (?:story|article|post) at .*$/i,
  /the post .*? appeared first on .*$/i,
  /this article was originally published .*/i,
  /continue reading .*$/i,
  /read more[:.]?.*$/i,
  /^©.*$/i,
  /all rights reserved\.?/i,
  /^\s*(?:advertisement|sponsored)\s*[-–—:]\s*/i,
];

export function parseFeedDate(value?: string, now = Date.now()): Date | null {
  if (!value) return null;
  const raw = normalizeWhitespace(decodeEntities(value));
  if (!raw) return null;

  let ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    // "2026-09-20 08:45:48" — treat as UTC.
    const normalized = raw.replace(" ", "T").replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
    ms = Date.parse(normalized.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
  }

  if (Number.isNaN(ms)) {
    // "20 Sep 2026" style without a weekday.
    const match = /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/.exec(raw);
    if (match) ms = Date.parse(`${match[2]} ${match[1]}, ${match[3]}`);
  }

  if (Number.isNaN(ms)) return null;

  const date = new Date(ms);
  // Feeds with broken clocks should not dominate "newest first" lists.
  if (date.getTime() > now + 2 * 60 * 60_000) return null;
  // Nor should 1970 epochs.
  if (date.getTime() < 946684800000) return null;
  return date;
}

/** Resolves possibly-relative links and drops tracking noise. */
export function resolveLink(link: string | undefined, base?: string): string {
  const raw = normalizeWhitespace(decodeEntities(link || ""));
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (base) {
    try {
      return new URL(raw, base).toString();
    } catch {
      /* fall through */
    }
  }
  return "";
}

export function pickImage(raw: RawItem, contentHtml: string): string | undefined {
  const candidates: string[] = [];

  for (const url of raw.images) candidates.push(url);

  const inline = /<img[^>]+src=["']([^"']+)["']/i.exec(contentHtml);
  if (inline?.[1]) candidates.push(inline[1]);

  for (const candidate of candidates) {
    const url = normalizeWhitespace(decodeEntities(candidate));
    if (!/^https?:\/\//i.test(url)) continue;
    if (/\.(gif|svg|webp|ico)(\?|$)/i.test(url)) continue;
    if (BAD_IMAGE_RE.test(url)) continue;
    return url;
  }
  // Second pass: allow anything that is at least a real image URL.
  for (const candidate of candidates) {
    const url = normalizeWhitespace(decodeEntities(candidate));
    if (/^https?:\/\//i.test(url) && !/\.(svg|ico)(\?|$)/i.test(url)) return url;
  }
  return undefined;
}

export function cleanSummary(rawHtml: string, max = 300): string {
  let text = stripHtml(rawHtml);
  // Markdown style links occasionally leak into descriptions.
  text = text.replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1");
  for (const pattern of BOILERPLATE) text = text.replace(pattern, " ");
  text = normalizeWhitespace(text);
  if (!text) return "";
  return truncate(text, max);
}

export function cleanTitle(rawTitle: string, isAggregated: boolean): { title: string; publisher?: string } {
  let title = normalizeWhitespace(stripHtml(rawTitle));
  if (!title) return { title: "" };
  let publisher: string | undefined;
  if (isAggregated) {
    const split = splitPublisherSuffix(title);
    title = split.title;
    publisher = split.publisher;
  }
  title = title.replace(/^[[\s]+|[\]\s]+$/g, "").trim();
  return { title: truncate(title, 240), publisher };
}

export interface NormalizeContext {
  source: FeedSource;
  now: number;
  feedLink?: string;
  region?: string;
}

/** Turns one raw feed item into a NewsSplit Article (score applied later by the ranker). */
export function normalizeItem(raw: RawItem, ctx: NormalizeContext): Article | null {
  const { source, now } = ctx;
  const isAggregated = source.kind === "google-news";

  const titleResult = cleanTitle(raw.title || "", isAggregated);
  const link = resolveLink(raw.link || raw.guid, ctx.feedLink || source.site);
  if (!titleResult.title || !link) return null;
  if (!/^https?:\/\//i.test(link)) return null;

  const contentHtml = raw.content || raw.description || "";
  const summarySource = raw.description || raw.content || "";
  const summary = cleanSummary(summarySource);

  const published =
    parseFeedDate(raw.publishedRaw, now) || parseFeedDate(raw.updatedRaw, now) || new Date(now);

  const publisher =
    raw.publisher || titleResult.publisher || (isAggregated ? undefined : source.name);
  const publisherUrl = raw.publisherUrl || source.site;

  const domain =
    (publisherUrl ? domainFromUrl(publisherUrl) : "") ||
    domainFromUrl(link) ||
    source.name.toLowerCase().replace(/\s+/g, "");

  const words = wordCount(stripHtml(contentHtml));
  const isVideo =
    raw.mediaMedium === "video" ||
    /^video\//i.test(raw.enclosureType || "") ||
    /\bvideo\b/i.test(domainFromUrl(link)) ||
    /^(watch|video)[:\s]/i.test(titleResult.title) ||
    /(youtube\.com|youtu\.be)\/watch/i.test(link);

  const categories: CategoryId[] = [source.category];
  const tags = [...new Set(raw.categories.map((c) => normalizeWhitespace(stripHtml(c))).filter(Boolean))]
    .slice(0, 6);

  const fingerprint = hash64(`title:${salientTokens(titleResult.title).sort().join(" ")}`);

  const article: Article = {
    id: articleId(link),
    clusterId: fingerprint,
    title: titleResult.title,
    link,
    summary,
    image: pickImage(raw, contentHtml),
    author: raw.author ? normalizeWhitespace(stripHtml(raw.author)).slice(0, 80) : undefined,
    sourceId: source.id,
    sourceName: publisher || source.name,
    site: publisherUrl ? originFromUrl(publisherUrl) || source.site : source.site,
    domain,
    categories,
    primaryCategory: source.category,
    publishedAt: published.toISOString(),
    fetchedAt: new Date(now).toISOString(),
    tags,
    wordCount: words > 0 ? words : undefined,
    readingMinutes: words > 0 ? Math.max(1, Math.round(words / 220)) : undefined,
    score: 0,
    breaking: false,
    isVideo,
  };

  return article;
}

/** Stable per-article canonical link, exposed for tests/debugging. */
export function canonicalLink(article: Article): string {
  return canonicalUrl(article.link);
}

export const normalizeInternals = { config };
