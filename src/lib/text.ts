/** Text helpers: entity decoding, HTML stripping, normalisation, truncation. */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  laquo: "«",
  raquo: "»",
  bull: "•",
  middot: "·",
  deg: "°",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  times: "×",
  divide: "÷",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  plusmn: "±",
  micro: "µ",
  para: "¶",
  sect: "§",
  dagger: "†",
  permil: "‰",
  prime: "′",
  Prime: "″",
  lsaquo: "‹",
  rsaquo: "›",
  minus: "−",
  infinity: "∞",
  ne: "≠",
  le: "≤",
  ge: "≥",
  rarr: "→",
  larr: "←",
  uarr: "↑",
  darr: "↓",
  harr: "↔",
};

/** Decodes numeric + the most common named HTML entities. Idempotent-safe. */
export function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (match, name: string) => {
      const lower = String(name).toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower)
        ? NAMED_ENTITIES[lower]
        : match;
    });
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** Removes HTML tags and collapses whitespace — used for summaries. */
export function stripHtml(input: string): string {
  if (!input) return "";
  return normalizeWhitespace(
    decodeEntities(
      input
        .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " ")
        .replace(/<[^>]*>/g, " "),
    ),
  );
}

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

/** Truncates on a word boundary and appends an ellipsis when cut. */
export function truncate(input: string, max: number): string {
  const text = input.trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[ ,.;:!\-–—(["'‘“]+$/, "")}…`;
}

const STOPWORDS = new Set(
  `a an and are as at be but by for from has have how i if in into is it its no not of on or
   our so than that the their there these they this to was we were what when where which who why
   will with you your up down out off over under again after before between during about against
   says said say new news live video watch photo photos more also`
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * Very light suffix stemmer — enough that reworded cross-outlet leads share
 * tokens ("attacked"/"attack", "drones"/"drone", "stories"/"story") without
 * the surprises a full Porter stemmer would bring to headline matching.
 */
function stem(token: string): string {
  let t = token;
  if (t.length > 4 && t.endsWith("ies")) return `${t.slice(0, -3)}y`;
  if (t.length > 4 && /(ss|sh|ch|x|z)es$/.test(t)) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s") && !/(ss|us|is)$/.test(t)) t = t.slice(0, -1);
  if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
  if (t.length > 4 && t.endsWith("ed") && !t.endsWith("eed")) t = t.slice(0, -2);
  return t;
}

/** Lowercased, lightly stemmed token list used for search matching and clustering. */
export function tokenize(input: string): string[] {
  return normalizeWhitespace(decodeEntities(input))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map(stem);
}

/**
 * Nationality/adjective forms folded onto their country noun so
 * "Ukrainian drones" matches "Ukraine fire … drones" across publishers.
 */
const DEMONYMS: Record<string, string> = {
  ukrainian: "ukraine",
  russian: "russia",
  israeli: "israel",
  palestinian: "palestine",
  british: "uk",
  gb: "uk",
  chinese: "china",
  iranian: "iran",
  turkish: "turkey",
  german: "germany",
  french: "france",
  spanish: "spain",
  japanese: "japan",
  indian: "india",
  brazilian: "brazil",
  canadian: "canada",
  australian: "australia",
};

/**
 * Tokens minus stopwords and bare numerals, with demonyms folded onto their
 * country — the "salient" words of a headline used for clustering/search.
 */
export function salientTokens(input: string): string[] {
  return tokenize(input)
    .filter((t) => !STOPWORDS.has(t) && !/^\d+$/.test(t))
    .map((t) => DEMONYMS[t] ?? t);
}

/** Jaccard similarity of two token sets, 0..1. */
export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let intersection = 0;
  for (const token of new Set(a)) if (setB.has(token)) intersection += 1;
  const union = new Set(a).size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Google News (and a few other aggregators) append the publisher to the
 * headline: "Mayor opens new bridge - Springfield Gazette".
 */
export function splitPublisherSuffix(title: string): { title: string; publisher?: string } {
  const trimmed = title.trim();
  // Score lines ("Villa 3 - 2 Spurs") use the same separator but are not publishers.
  if (/\d\s*[-–—|]\s*\d/.test(trimmed)) return { title: trimmed };

  const match = /^(.*?)\s+[-–—|]\s+([^-–—|]{2,60})$/.exec(trimmed);
  if (!match) return { title: trimmed };

  const head = match[1].trim();
  const candidate = match[2].trim();

  const looksLikePublisher =
    candidate.length >= 2 &&
    candidate.length <= 45 &&
    !/[.!?]$/.test(candidate) &&
    !/^\d+$/.test(candidate) &&
    candidate.split(/\s+/).length <= 6 &&
    head.split(/\s+/).length >= 3;

  if (!looksLikePublisher) return { title: trimmed };
  return { title: head, publisher: candidate };
}

export function wordCount(input: string): number {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
