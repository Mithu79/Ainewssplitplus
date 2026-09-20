import { config } from "./config";
import type { Article } from "./types";

/** NewsSplit republishes its own aggregated feed so readers can subscribe to it. */

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(input: string): string {
  return `<![CDATA[${input.replace(/]]>/g, "]] >")}]]>`;
}

export function buildRssFeed(articles: Article[], options: { title: string; description: string; link: string }): string {
  const items = articles
    .map((article) => {
      const enclosure = article.image
        ? `\n      <enclosure url="${escapeXml(article.image)}" type="image/jpeg" length="0" />`
        : "";
      const categories = article.categories
        .map((category) => `\n      <category>${escapeXml(category)}</category>`)
        .join("");
      return `    <item>
      <title>${cdata(article.title)}</title>
      <link>${escapeXml(article.link)}</link>
      <guid isPermaLink="false">${escapeXml(article.id)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${cdata(
        `${article.summary ? `${article.summary} ` : ""}Source: ${article.sourceName}`,
      )}</description>
      <source url="${escapeXml(article.site ?? article.link)}">${escapeXml(article.sourceName)}</source>${categories}${enclosure}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(options.title)}</title>
    <link>${escapeXml(options.link)}</link>
    <description>${escapeXml(options.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>${escapeXml(config.siteName)} aggregator</generator>
    <atom:link href="${escapeXml(options.link)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
