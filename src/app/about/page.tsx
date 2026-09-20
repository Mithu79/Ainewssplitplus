import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icons";
import { SectionHeading } from "@/components/SectionHeading";
import { config } from "@/lib/config";
import { allSources } from "@/lib/sources";
import { getStatus } from "@/lib/store";

export const metadata: Metadata = {
  title: "How NewsSplit works",
  description:
    "The architecture behind NewsSplit: an automated crawl loop, a normalising RSS/Atom parser, de-duplication, headline clustering, transparent ranking and a live responsive front end.",
};

export default async function AboutPage() {
  const status = getStatus();
  const sources = allSources();

  return (
    <>
      <div className="border-b border-line bg-bg-tint">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-5 sm:py-14">
          <p className="kicker text-faint">Documentation</p>
          <h1 className="display mt-2 max-w-3xl text-[2.2rem] leading-[1.08] md:text-[3rem]">
            A newsroom that runs itself: crawl, clean, cluster, rank, publish.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            NewsSplit is an automated aggregation engine plus a modern responsive reader. It polls {sources.length} public RSS
            and Atom endpoints every {status.refreshIntervalMinutes} minutes, turns every format into one article shape, merges
            duplicates, groups outlets that are covering the same event, and ranks the result with a transparent score — right
            now that is {status.articleCount} stories in {status.clusterCount} clusters.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="button button-primary">
              <Icon name="bolt" className="h-4 w-4" />
              Read the front page
            </Link>
            <Link href="/sources" className="button">
              <Icon name="activity" className="h-4 w-4" />
              Feed health
            </Link>
            <Link href="/api/news?category=top&limit=5" className="button">
              <Icon name="code" className="h-4 w-4" />
              Try the JSON API
            </Link>
            <Link href="/api/feed" className="button">
              <Icon name="rss" className="h-4 w-4" />
              Subscribe to the output feed
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-4 py-10 sm:px-5">
        <section aria-labelledby="features">
          <SectionHeading id="features" kicker="What you get" title="Features" icon="sparkles" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-muted">
                  <Icon name={feature.icon} className="h-[18px] w-[18px]" />
                </span>
                <h3 className="mt-3 text-sm font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ranking">
          <SectionHeading id="ranking" kicker="No black box" title="How the ranking score is built" icon="trending" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="card p-5">
              <p className="text-sm leading-relaxed text-muted">
                Every article gets one number. It is deliberately boring and inspectable — no engagement signals, no personal
                data, no third-party API:
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface p-4 text-[11.5px] leading-relaxed text-ink-soft">
                <code>{`score = sourceWeight × 8
      + 70 × e^(−ageHours / halfLife[category])
      + 6   if it has an image
      + 4   if it has a real standfirst
      + 25  if the headline says "breaking"
      + 3   if the feed shipped 250+ words
      − 35  for newsletters, quizzes, podcasts
      − 5   for video-only items`}</code>
              </pre>
            </div>
            <div className="card divide-y divide-line">
              {[
                {
                  title: "Source weight",
                  body: "Each registry entry carries a 1–5 editorial weight, so a wire service outranks an anonymous aggregator.",
                },
                {
                  title: "Category half-life",
                  body: "Sport decays in ~10 hours, tech in ~12, world news in ~16, science and health in ~40 — a transfer rumour should not sit on the front page for a week.",
                },
                {
                  title: "Breaking window",
                  body: `Anything published in the last ${Math.round(config.breakingWindowMs / 60_000)} minutes, or headed “breaking/just in/live”, enters the red ticker.`,
                },
                {
                  title: "Diversity pass",
                  body: `A round-robin caps any single publisher at ${config.perSourceCap} slots near the top so one outlet cannot own the page.`,
                },
                {
                  title: "Clustering",
                  body: "Salient headline tokens are compared with Jaccard similarity plus containment inside a 72-hour window; matches become one story with an “N outlets” pill.",
                },
              ].map((item) => (
                <div key={item.title} className="p-4">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="api">
          <SectionHeading id="api" kicker="Machine readable" title="API & output feeds" icon="code" />
          <div className="card overflow-hidden">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface text-[10px] font-extrabold uppercase tracking-[0.1em] text-faint">
                  <th className="px-3 py-2.5">Endpoint</th>
                  <th className="px-3 py-2.5">What it returns</th>
                  <th className="hidden px-3 py-2.5 lg:table-cell">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ENDPOINTS.map((endpoint) => (
                  <tr key={endpoint.path} className="transition hover:bg-surface">
                    <td className="px-3 py-2.5">
                      <p className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold"
                          style={{
                            color: endpoint.method === "POST" ? "var(--warn)" : "var(--ok)",
                            backgroundColor: endpoint.method === "POST" ? "var(--warn-soft)" : "var(--ok-soft)",
                          }}
                        >
                          {endpoint.method}
                        </span>
                        <Link href={endpoint.path} className="font-mono text-[11px] font-semibold underline-offset-2 hover:underline">
                          {endpoint.path.split("?")[0]}
                        </Link>
                      </p>
                      {endpoint.query && <p className="mt-1 font-mono text-[10px] text-faint">{endpoint.query}</p>}
                    </td>
                    <td className="max-w-md px-3 py-2.5 leading-relaxed text-muted">{endpoint.body}</td>
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <code className="block max-w-xs truncate font-mono text-[10.5px] text-faint">{endpoint.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="env">
          <SectionHeading id="env" kicker="Configuration" title="Environment variables" icon="sliders" href="/sources" hrefLabel="Feed registry" />
          <div className="card overflow-hidden">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface text-[10px] font-extrabold uppercase tracking-[0.1em] text-faint">
                  <th className="px-3 py-2.5">Variable</th>
                  <th className="px-3 py-2.5">Default</th>
                  <th className="px-3 py-2.5">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ENV_VARS.map((variable) => (
                  <tr key={variable.name} className="transition hover:bg-surface">
                    <td className="px-3 py-2.5 font-mono text-[11px] font-semibold">{variable.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-faint">{variable.fallback}</td>
                    <td className="max-w-md px-3 py-2.5 leading-relaxed text-muted">{variable.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Copy <code className="rounded bg-surface px-1 py-0.5">.env.example</code> to{" "}
            <code className="rounded bg-surface px-1 py-0.5">.env.local</code> — every value is optional.
          </p>
        </section>

        <section aria-labelledby="attribution">
          <div className="card flex flex-col gap-3 p-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Icon name="shield" className="h-4 w-4 text-muted" />
              Attribution &amp; etiquette
            </p>
            <p className="max-w-3xl text-xs leading-relaxed text-muted">
              NewsSplit caches headlines, standfirsts, thumbnails and links purely to rank and de-duplicate them. Every card
              links out to the publisher, nothing is republished in full, and crawls are rate-limited to{" "}
              {config.concurrency} parallel requests with a {Math.round(config.requestTimeoutMs / 1000)}s timeout so no feed is
              hammered. Remove any endpoint from <code className="rounded bg-surface px-1 py-0.5">src/lib/sources.ts</code> at
              any time.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

const FEATURES: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Self-running crawl loop",
    body: "Boots from instrumentation.ts, refreshes on a timer, and re-crawls on demand when a request finds stale data.",
    icon: "refresh",
  },
  {
    title: "RSS, Atom and RDF",
    body: "One defensive parser handles CDATA, namespaces, media:content, enclosures and four different date formats.",
    icon: "rss",
  },
  {
    title: "De-duplication & clustering",
    body: "Canonical URLs collapse syndicated copies; headline similarity groups separate outlets covering one event.",
    icon: "layers",
  },
  {
    title: "Region-aware local news",
    body: "Pick a city and the local feeds are rebuilt for it on the server, then cached like any other category.",
    icon: "pin",
  },
  {
    title: "Eight categories",
    body: "World, Tech, Business, Sports, Science, Health, Entertainment and Local — each with its own accent and rail.",
    icon: "grid",
  },
  {
    title: "Live, self-updating UI",
    body: "The header polls crawler status and re-renders the page when a new crawl lands, so the front page keeps moving.",
    icon: "activity",
  },
  {
    title: "Responsive + themeable",
    body: "One layout from 320px to ultrawide, with light/dark themes, reduced-motion support and keyboard shortcuts.",
    icon: "sun",
  },
  {
    title: "Offline resilient",
    body: "If no feed responds, a clearly labelled snapshot keeps the site usable; a disk cache survives restarts.",
    icon: "shield",
  },
  {
    title: "API and RSS output",
    body: "JSON endpoints for every view plus NewsSplit's own RSS feed, so the aggregator can be aggregated.",
    icon: "code",
  },
];

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/news?category=top&limit=24",
    query: "category · q · source · hours · sort · limit · offset · region · clustered",
    body: "The same query the pages use: articles, facets, pagination totals and the current data mode.",
    example: "curl 'localhost:3000/api/news?category=tech&sort=newest&limit=5'",
  },
  {
    method: "GET",
    path: "/api/categories",
    query: "—",
    body: "Category metadata with live story counts and the feeds registered against each one.",
    example: "curl localhost:3000/api/categories",
  },
  {
    method: "GET",
    path: "/api/status",
    query: "—",
    body: "Crawler health: mode, timings, per-source latency, item counts and the last error for each feed.",
    example: "curl localhost:3000/api/status",
  },
  {
    method: "POST",
    path: "/api/refresh",
    query: "?token=… (when REFRESH_TOKEN is set)",
    body: "Forces an immediate crawl of every feed. Used by the bundled GitHub Actions schedule.",
    example: "curl -X POST localhost:3000/api/refresh",
  },
  {
    method: "GET",
    path: "/api/feed?category=world",
    query: "category · limit",
    body: "NewsSplit republished as RSS 2.0 — subscribe to the aggregate in any reader.",
    example: "curl 'localhost:3000/api/feed?category=tech'",
  },
  {
    method: "GET",
    path: "/api/story/{clusterId}",
    query: "—",
    body: "One clustered story with every outlet that filed it.",
    example: "curl localhost:3000/api/status  # find a clusterId, then fetch it",
  },
];

const ENV_VARS = [
  { name: "REFRESH_INTERVAL_MINUTES", fallback: "10", body: "How often the background crawler re-reads every feed." },
  { name: "FETCH_TIMEOUT_SECONDS", fallback: "10", body: "Per-request timeout for a single feed." },
  { name: "FETCH_RETRIES", fallback: "1", body: "Retries for network errors, 429s and 5xx responses." },
  { name: "FETCH_CONCURRENCY", fallback: "6", body: "How many feeds are downloaded in parallel." },
  { name: "MAX_ITEMS_PER_SOURCE", fallback: "40", body: "Items kept from each feed per crawl." },
  { name: "MAX_CACHE_ITEMS", fallback: "1500", body: "Upper bound of the in-memory index." },
  { name: "CACHE_FILE", fallback: ".cache/newssplit.json", body: "Where the index is persisted between restarts." },
  { name: "NEWS_SPLIT_OFFLINE", fallback: "auto", body: "auto | always | never — controls the snapshot fallback." },
  { name: "REFRESH_TOKEN", fallback: "—", body: "Shared secret that protects POST /api/refresh." },
  { name: "LOCAL_DEFAULT_REGION", fallback: "United States", body: "Region used before a visitor picks one." },
  { name: "LOCAL_FEEDS", fallback: "—", body: "Comma-separated extra RSS URLs merged into Local news." },
  { name: "GOOGLE_NEWS_HL / GL / CEID", fallback: "en-US / US / US:en", body: "Locale used for Google News endpoints." },
];
