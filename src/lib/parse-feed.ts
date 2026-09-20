import { XMLParser } from "fast-xml-parser";
import type { ParsedFeed, RawItem } from "./types";

/**
 * Minimal, defensive RSS 2.0 / RSS 1.0 (RDF) / Atom reader built on
 * fast-xml-parser. Entity processing is turned off so every value goes through
 * exactly one decoding pass in `normalize.ts`.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  processEntities: false,
  parseTagValue: false,
  trimValues: true,
  removeNSPrefix: false,
  isArray: (name) =>
    [
      "item",
      "entry",
      "category",
      "link",
      "enclosure",
      "media:content",
      "media:thumbnail",
      "media:group",
      "media:credit",
      "atom:link",
    ].includes(name),
});

/** Flattens the many shapes fast-xml-parser can produce into a plain string. */
export function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = text(entry);
      if (candidate) return candidate;
    }
    return "";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const cdata = text(record.__cdata);
    if (cdata) return cdata;
    const hash = text(record["#text"]);
    if (hash) return hash;
    const nested = text(record._);
    if (nested) return nested;
    const value2 = text(record.value);
    if (value2) return value2;
    const content = text(record.content);
    if (content) return content;
  }
  return "";
}

/** All strings for a tag that may appear zero, one or many times. */
export function textAll(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function attr(node: unknown, name: string): string {
  if (!node || typeof node !== "object") return "";
  const record = node as Record<string, unknown>;
  return text(record[`@_${name}`]);
}

function firstNode(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

/** Escapes stray ampersands and strips control characters that break XML parsers. */
export function repairXml(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
}

export function parseFeedXml(xml: string): ParsedFeed {
  const cleaned = xml.replace(/^\uFEFF/, "").trim();
  let data: any;
  try {
    data = parser.parse(cleaned);
  } catch {
    data = parser.parse(repairXml(cleaned));
  }

  if (!data || typeof data !== "object") {
    return { format: "unknown", items: [] };
  }

  if (data.rss) return parseRss(data.rss);
  if (data["rdf:RDF"]) return parseRdf(data["rdf:RDF"]);
  if (data.feed) return parseAtom(data.feed);
  if (data["atom:feed"]) return parseAtom(data["atom:feed"]);

  // Some feeds are served without a recognisable root element name.
  const unknownRoot = Object.values(data).find(
    (value: any) => value && typeof value === "object" && (value.item || value.entry),
  ) as any;
  if (unknownRoot?.entry) return parseAtom(unknownRoot);
  if (unknownRoot?.item) return parseRss(unknownRoot);

  return { format: "unknown", items: [] };
}

function parseRss(channelNode: any): ParsedFeed {
  const channel = channelNode?.channel ?? channelNode ?? {};
  const items: any[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  return {
    format: "rss",
    title: text(channel.title),
    link: text(channel.link),
    description: text(channel.description),
    updatedRaw: text(channel.lastBuildDate) || text(channel.pubDate) || text(channel["dc:date"]),
    items: items.map(mapRssItem),
  };
}

function mapRssItem(item: any): RawItem {
  const images = collectMediaImages(item);
  const enclosure = firstNode(item.enclosure);
  const enclosureUrl = attr(enclosure, "url") || text(enclosure);
  const enclosureType = attr(enclosure, "type");
  if (enclosureUrl && /^image\//i.test(enclosureType || "")) images.push(enclosureUrl);

  const mediaContent = firstNode(item["media:content"]);
  const mediaMedium = attr(mediaContent, "medium");
  const mediaType = attr(mediaContent, "type");
  const isVideo =
    mediaMedium === "video" || /^video\//i.test(mediaType || "") || /^video\//i.test(enclosureType || "");

  const source = item.source;
  return {
    title: text(item.title),
    link: text(firstNode(item.link)) || text(item.guid),
    guid: text(item.guid) || attr(item.guid, "guid") || text(item["dc:identifier"]),
    description: text(item.description) || text(item["dc:description"]),
    content: text(item["content:encoded"]) || text(item.content),
    publishedRaw: text(item.pubDate) || text(item["dc:date"]) || text(item["atom:updated"]),
    updatedRaw: text(item["dc:date"]),
    author:
      text(item["dc:creator"]) ||
      text(item.author) ||
      text(firstNode(item["media:credit"])) ||
      text(item["itunes:author"]),
    images,
    enclosureType,
    categories: [...textAll(item.category), ...textAll(item["dc:subject"])].filter(Boolean),
    publisher: text(source) || undefined,
    publisherUrl: attr(source, "url") || undefined,
    mediaMedium: isVideo ? "video" : mediaMedium || undefined,
  };
}

function collectMediaImages(item: any): string[] {
  const urls: string[] = [];
  const push = (node: any) => {
    if (!node) return;
    const url = attr(node, "url") || text(node);
    const type = attr(node, "type");
    const medium = attr(node, "medium");
    if (!url) return;
    if (medium === "video" || /^video\//i.test(type || "")) return;
    urls.push(url);
  };
  const groups = Array.isArray(item["media:group"]) ? item["media:group"] : item["media:group"] ? [item["media:group"]] : [];
  for (const group of groups) {
    for (const content of group["media:content"] ?? []) push(content);
    for (const thumb of group["media:thumbnail"] ?? []) push(thumb);
  }
  for (const content of item["media:content"] ?? []) push(content);
  for (const thumb of item["media:thumbnail"] ?? []) push(thumb);
  return urls;
}

function parseRdf(rdf: any): ParsedFeed {
  const items: any[] = Array.isArray(rdf.item) ? rdf.item : rdf.item ? [rdf.item] : [];
  return {
    format: "rdf",
    title: text(rdf.channel?.title),
    link: text(rdf.channel?.link),
    description: text(rdf.channel?.description),
    updatedRaw: text(rdf.channel?.["dc:date"]),
    items: items.map(mapRssItem),
  };
}

function parseAtom(feed: any): ParsedFeed {
  const entries: any[] = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];
  return {
    format: "atom",
    title: text(feed.title),
    link: atomLink(feed.link, "alternate") || text(feed.id),
    description: text(feed.subtitle),
    updatedRaw: text(feed.updated),
    items: entries.map(mapAtomEntry),
  };
}

function atomLink(links: any, rel: string): string {
  const list: any[] = Array.isArray(links) ? links : links ? [links] : [];
  const preferred =
    list.find((link) => attr(link, "rel") === rel) ||
    list.find((link) => !attr(link, "rel")) ||
    list[0];
  return attr(preferred, "href") || text(preferred);
}

function mapAtomEntry(entry: any): RawItem {
  const images = collectMediaImages(entry);
  const content = text(entry.content);
  const summary = text(entry.summary);
  const mediaContents: any[] = Array.isArray(entry["media:content"]) ? entry["media:content"] : entry["media:content"] ? [entry["media:content"]] : [];
  const videoMedia = mediaContents.find(
    (node: any) => attr(node, "medium") === "video" || /^video\//i.test(attr(node, "type") || ""),
  );
  const enclosure = firstNode(entry.link?.filter?.((l: any) => attr(l, "rel") === "enclosure"));
  if (enclosure) {
    const url = attr(enclosure, "href");
    if (url && /^image\//i.test(attr(enclosure, "type") || "")) images.push(url);
  }
  const authorNode = firstNode(entry.author) as any;
  return {
    title: text(entry.title),
    link: atomLink(entry.link, "alternate"),
    guid: text(entry.id),
    description: summary,
    content,
    publishedRaw: text(entry.published) || text(entry.issued) || text(entry.updated),
    updatedRaw: text(entry.updated) || text(entry.modified),
    author: text(authorNode?.name) || text(entry["dc:creator"]),
    images,
    enclosureType: enclosure ? attr(enclosure, "type") : undefined,
    categories: textAll(entry.category)
      .concat((Array.isArray(entry.category) ? entry.category : entry.category ? [entry.category] : []).map((c: any) => attr(c, "term")))
      .filter(Boolean),
    publisher: text(entry.source?.title) || undefined,
    publisherUrl: atomLink(entry.source?.link, "alternate") || undefined,
    mediaMedium: videoMedia ? "video" : undefined,
  };
}
