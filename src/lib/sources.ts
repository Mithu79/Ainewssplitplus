import { config } from "./config";
import type { CategoryId, FeedSource } from "./types";

/**
 * The NewsSplit feed registry.
 *
 * Add or remove entries here — the crawler, the facets, the /sources health
 * page and the API all read from this single list. Every URL is a public
 * RSS/Atom endpoint; no API keys are required.
 *
 * `weight` (1–5) is an editorial trust/quality signal used by the ranker.
 */

function googleNews(topic: string, category: CategoryId, id: string): FeedSource {
  return {
    id,
    name: "Google News",
    category,
    kind: "google-news",
    site: "https://news.google.com",
    weight: 3,
    resolveUrl: ({ locale }) =>
      `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`,
  };
}

export const FEED_SOURCES: FeedSource[] = [
  // ── World ────────────────────────────────────────────────────────────────
  { id: "bbc-world", name: "BBC News", category: "world", url: "https://feeds.bbci.co.uk/news/world/rss.xml", site: "https://www.bbc.co.uk/news/world", weight: 5 },
  { id: "guardian-world", name: "The Guardian", category: "world", url: "https://www.theguardian.com/world/rss", site: "https://www.theguardian.com/world", weight: 5 },
  { id: "nyt-world", name: "The New York Times", category: "world", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", site: "https://www.nytimes.com/section/world", weight: 5 },
  { id: "aljazeera", name: "Al Jazeera", category: "world", url: "https://www.aljazeera.com/xml/rss/all.xml", site: "https://www.aljazeera.com", weight: 4 },
  { id: "npr-news", name: "NPR", category: "world", url: "https://feeds.npr.org/1001/rss.xml", site: "https://www.npr.org/sections/news/", weight: 4 },
  { id: "dw-world", name: "DW", category: "world", url: "https://rss.dw.com/xml/rss-en-all", site: "https://www.dw.com/en/top-stories/s-9097", weight: 3 },
  { id: "france24", name: "France 24", category: "world", url: "https://www.france24.com/en/rss", site: "https://www.france24.com/en/", weight: 3 },
  googleNews("WORLD", "world", "gn-world"),

  // ── Tech ─────────────────────────────────────────────────────────────────
  { id: "verge", name: "The Verge", category: "tech", kind: "atom", url: "https://www.theverge.com/rss/index.xml", site: "https://www.theverge.com", weight: 5 },
  { id: "ars-technica", name: "Ars Technica", category: "tech", url: "https://feeds.arstechnica.com/arstechnica/index", site: "https://arstechnica.com", weight: 4 },
  { id: "techcrunch", name: "TechCrunch", category: "tech", url: "https://techcrunch.com/feed/", site: "https://techcrunch.com", weight: 4 },
  { id: "wired", name: "WIRED", category: "tech", url: "https://www.wired.com/feed/rss", site: "https://www.wired.com", weight: 4 },
  { id: "engadget", name: "Engadget", category: "tech", url: "https://www.engadget.com/rss.xml", site: "https://www.engadget.com", weight: 3 },
  { id: "hacker-news", name: "Hacker News", category: "tech", url: "https://hnrss.org/frontpage", site: "https://news.ycombinator.com", weight: 3 },
  { id: "the-register", name: "The Register", category: "tech", kind: "atom", url: "https://www.theregister.com/headlines.atom", site: "https://www.theregister.com", weight: 3 },
  { id: "mit-tech-review", name: "MIT Technology Review", category: "tech", url: "https://www.technologyreview.com/feed/", site: "https://www.technologyreview.com", weight: 3 },
  googleNews("TECHNOLOGY", "tech", "gn-tech"),

  // ── Business ─────────────────────────────────────────────────────────────
  { id: "bbc-business", name: "BBC Business", category: "business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", site: "https://www.bbc.co.uk/news/business", weight: 5 },
  { id: "guardian-business", name: "The Guardian", category: "business", url: "https://www.theguardian.com/uk/business/rss", site: "https://www.theguardian.com/uk/business", weight: 4 },
  { id: "nyt-business", name: "The New York Times", category: "business", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", site: "https://www.nytimes.com/section/business", weight: 4 },
  { id: "cnbc", name: "CNBC", category: "business", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147", site: "https://www.cnbc.com", weight: 4 },
  { id: "marketwatch", name: "MarketWatch", category: "business", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", site: "https://www.marketwatch.com", weight: 3 },
  googleNews("BUSINESS", "business", "gn-business"),

  // ── Sports ───────────────────────────────────────────────────────────────
  { id: "bbc-sport", name: "BBC Sport", category: "sports", url: "https://feeds.bbci.co.uk/sport/rss.xml", site: "https://www.bbc.co.uk/sport", weight: 5 },
  { id: "espn", name: "ESPN", category: "sports", url: "https://www.espn.com/espn/rss/news", site: "https://www.espn.com", weight: 4 },
  { id: "guardian-sport", name: "The Guardian", category: "sports", url: "https://www.theguardian.com/uk/sport/rss", site: "https://www.theguardian.com/uk/sport", weight: 4 },
  { id: "nyt-sports", name: "The New York Times", category: "sports", url: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", site: "https://www.nytimes.com/section/sports", weight: 3 },
  { id: "cbs-sports", name: "CBS Sports", category: "sports", url: "https://www.cbssports.com/rss/headlines/", site: "https://www.cbssports.com", weight: 3 },
  { id: "sky-sports", name: "Sky Sports", category: "sports", url: "https://www.skysports.com/rss/12040", site: "https://www.skysports.com", weight: 3 },
  googleNews("SPORTS", "sports", "gn-sports"),

  // ── Science ──────────────────────────────────────────────────────────────
  { id: "bbc-science", name: "BBC Science", category: "science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", site: "https://www.bbc.co.uk/news/science_and_environment", weight: 5 },
  { id: "nature", name: "Nature", category: "science", url: "https://www.nature.com/nature.rss", site: "https://www.nature.com/nature/", weight: 4 },
  { id: "phys-org", name: "Phys.org", category: "science", url: "https://phys.org/rss-feed/", site: "https://phys.org", weight: 3 },
  { id: "science-daily", name: "ScienceDaily", category: "science", url: "https://www.sciencedaily.com/rss/top/science.xml", site: "https://www.sciencedaily.com", weight: 3 },
  { id: "new-scientist", name: "New Scientist", category: "science", url: "https://www.newscientist.com/section/news/feed/", site: "https://www.newscientist.com", weight: 3 },
  { id: "nasa", name: "NASA", category: "science", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss", site: "https://www.nasa.gov", weight: 3 },
  googleNews("SCIENCE", "science", "gn-science"),

  // ── Health ───────────────────────────────────────────────────────────────
  { id: "who", name: "WHO", category: "health", url: "https://www.who.int/rss-feeds/news-english.xml", site: "https://www.who.int", weight: 4 },
  { id: "stat-news", name: "STAT News", category: "health", url: "https://www.statnews.com/feed/", site: "https://www.statnews.com", weight: 4 },
  { id: "guardian-health", name: "The Guardian", category: "health", url: "https://www.theguardian.com/society/health/rss", site: "https://www.theguardian.com/society/health", weight: 3 },
  { id: "medical-news-today", name: "Medical News Today", category: "health", url: "https://www.medicalnewstoday.com/rss", site: "https://www.medicalnewstoday.com", weight: 3 },
  googleNews("HEALTH", "health", "gn-health"),

  // ── Entertainment ────────────────────────────────────────────────────────
  { id: "bbc-entertainment", name: "BBC Entertainment", category: "entertainment", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", site: "https://www.bbc.co.uk/news/entertainment_and_arts", weight: 4 },
  { id: "variety", name: "Variety", category: "entertainment", url: "https://variety.com/feed/", site: "https://variety.com", weight: 4 },
  { id: "hollywood-reporter", name: "The Hollywood Reporter", category: "entertainment", url: "https://www.hollywoodreporter.com/feed/", site: "https://www.hollywoodreporter.com", weight: 4 },
  { id: "guardian-film", name: "The Guardian", category: "entertainment", url: "https://www.theguardian.com/film/rss", site: "https://www.theguardian.com/film", weight: 3 },
  googleNews("ENTERTAINMENT", "entertainment", "gn-entertainment"),

  // ── Local (region aware) ─────────────────────────────────────────────────
  {
    id: "gn-local",
    name: "Google News",
    category: "local",
    kind: "google-news",
    site: "https://news.google.com",
    weight: 3,
    resolveUrl: ({ region, locale }) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(
        `${region} when:2d`,
      )}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`,
  },
  {
    id: "gn-local-headlines",
    name: "Google News",
    category: "local",
    kind: "google-news",
    site: "https://news.google.com",
    weight: 3,
    resolveUrl: ({ locale }) =>
      `https://news.google.com/rss/headlines/section/topic/LOCAL?hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`,
  },

  // ── Indian languages (Bengali · Hindi · Tamil) ───────────────────────────
  // Every entry declares `language`; the normaliser copies it onto each article
  // so `/api/news?lang=bn` and the front page's native-language rail can filter.
  // Headlines are always shown as filed — never machine-translated.
  { id: "gn-bn", name: "Google News বাংলা", category: "world", kind: "google-news", url: "https://news.google.com/rss?hl=bn&gl=IN&ceid=IN:bn", site: "https://news.google.com/?hl=bn&gl=IN&ceid=IN:bn", weight: 3, language: "bn" },
  { id: "gn-hi", name: "Google News हिन्दी", category: "world", kind: "google-news", url: "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi", site: "https://news.google.com/?hl=hi&gl=IN&ceid=IN:hi", weight: 3, language: "hi" },
  { id: "gn-ta", name: "Google News தமிழ்", category: "world", kind: "google-news", url: "https://news.google.com/rss?hl=ta&gl=IN&ceid=IN:ta", site: "https://news.google.com/?hl=ta&gl=IN&ceid=IN:ta", weight: 3, language: "ta" },
  { id: "ndtv-india", name: "NDTV India", category: "world", url: "https://feeds.feedburner.com/ndtvkhabar-latest", site: "https://ndtv.in", weight: 3, language: "hi" },
  // Anandabazar and Daily Thanthi's own /rss paths return 404, so route them through Google News site: queries.
  { id: "anandabazar", name: "আনন্দবাজার পত্রিকা", category: "world", kind: "google-news", url: "https://news.google.com/rss/search?q=site:anandabazar.com+when:2d&hl=bn&gl=IN&ceid=IN:bn", site: "https://www.anandabazar.com", weight: 3, language: "bn" },
  { id: "dailythanthi", name: "தினத்தந்தி", category: "world", kind: "google-news", url: "https://news.google.com/rss/search?q=site:dailythanthi.com+when:2d&hl=ta&gl=IN&ceid=IN:ta", site: "https://www.dailythanthi.com", weight: 3, language: "ta" },
];

/** Feeds that publish in a non-English language. */
export function languageSources(): FeedSource[] {
  return FEED_SOURCES.filter((s) => s.language && s.language !== "en");
}

/** Extra local feeds supplied through the LOCAL_FEEDS env var. */
export function customLocalSources(): FeedSource[] {
  return config.extraLocalFeeds.map((url, index) => {
    let site: string | undefined;
    try {
      const parsed = new URL(url);
      site = `${parsed.protocol}//${parsed.host}`;
    } catch {
      site = undefined;
    }
    return {
      id: `local-custom-${index + 1}`,
      name: site ? new URL(site).hostname.replace(/^www\./, "") : `Local feed ${index + 1}`,
      category: "local" as CategoryId,
      url,
      site,
      weight: 3,
    };
  });
}

export function allSources(): FeedSource[] {
  return [...FEED_SOURCES, ...customLocalSources()];
}

export function getSource(id: string): FeedSource | undefined {
  return allSources().find((s) => s.id === id);
}

export function sourcesForCategory(category: CategoryId): FeedSource[] {
  return allSources().filter((s) => s.category === category && s.enabled !== false);
}

export function resolveSourceUrl(source: FeedSource, region: string): string | undefined {
  if (source.resolveUrl) return source.resolveUrl({ region, locale: config.googleNewsLocale });
  return source.url;
}

/** Distinct publisher names per category — used for the /sources page copy. */
export function publisherCount(): number {
  return new Set(allSources().map((s) => s.name)).size;
}
