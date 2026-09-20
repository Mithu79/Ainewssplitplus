import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_ICON, Icon } from "@/components/Icons";
import { PipelineExplainer } from "@/components/PipelineExplainer";
import { RefreshButton } from "@/components/RefreshButton";
import { SectionHeading } from "@/components/SectionHeading";
import { TimeAgo } from "@/components/TimeAgo";
import { CATEGORIES } from "@/lib/categories";
import { config } from "@/lib/config";
import { formatFullDate, formatNumber } from "@/lib/format";
import { MODE_LABEL } from "@/lib/store-status-client";
import { getStatus } from "@/lib/store";
import type { SourceHealth } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sources & feed health",
  description: `Every RSS and Atom endpoint ${config.siteName} watches, with live crawl status, latency and error detail.`,
};

export default async function SourcesPage() {
  const status = getStatus();
  const ok = status.sources.filter((source) => source.state === "ok").length;
  const failed = status.sources.filter((source) => source.state === "error").length;
  const idle = status.sources.filter((source) => source.state === "idle").length;

  const tiles = [
    { label: "Data mode", value: MODE_LABEL[status.mode] ?? status.mode, icon: "activity" as const, tone: status.mode === "live" ? "ok" : status.mode === "empty" ? "warn" : "info" },
    { label: "Stories indexed", value: formatNumber(status.articleCount), icon: "newspaper" as const },
    { label: "Story clusters", value: formatNumber(status.clusterCount), icon: "layers" as const },
    { label: "Breaking now", value: formatNumber(status.breakingCount), icon: "bolt" as const, tone: "accent" },
    { label: "Crawl runs", value: formatNumber(status.refreshCount), icon: "refresh" as const },
    { label: "Feeds ok / failed / idle", value: `${ok} / ${failed} / ${idle}`, icon: "rss" as const, tone: failed > 0 ? "warn" : "ok" },
  ];

  return (
    <>
      <div className="border-b border-line bg-bg-tint">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-8 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="kicker text-faint">Operations</p>
            <h1 className="display mt-1 text-[2rem] leading-tight md:text-[2.5rem]">Sources &amp; feed health</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              NewsSplit watches {status.sources.length} public RSS and Atom endpoints across {CATEGORIES.length} categories.
              This page is the crawler&rsquo;s own log: what responded, how fast, and what it returned.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
              {status.lastRefreshAt && (
                <span className="flex items-center gap-1.5">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  Last crawl <TimeAgo iso={status.lastRefreshAt} /> · {formatFullDate(status.lastRefreshAt)}
                </span>
              )}
              {status.nextRefreshAt && (
                <span className="flex items-center gap-1.5">
                  <Icon name="refresh" className="h-3.5 w-3.5" />
                  Next crawl {formatFullDate(status.nextRefreshAt)}
                </span>
              )}
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-4 py-8 sm:px-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {tiles.map((tile) => (
            <div key={tile.label} className="card p-3.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{
                  color: tile.tone === "ok" ? "var(--ok)" : tile.tone === "warn" ? "var(--warn)" : tile.tone === "accent" ? "var(--accent)" : "var(--muted)",
                  backgroundColor:
                    tile.tone === "ok"
                      ? "var(--ok-soft)"
                      : tile.tone === "warn"
                        ? "var(--warn-soft)"
                        : tile.tone === "accent"
                          ? "var(--accent-soft)"
                          : "var(--surface)",
                }}
              >
                <Icon name={tile.icon} className="h-4 w-4" />
              </span>
              <p className="display mt-2.5 text-xl leading-none">{tile.value}</p>
              <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">{tile.label}</p>
            </div>
          ))}
        </div>

        <section aria-labelledby="pipeline">
          <SectionHeading id="pipeline" kicker="The automation loop" title="From feed to front page" icon="sparkles" href="/about" hrefLabel="Full docs" />
          <div className="card overflow-hidden">
            <PipelineExplainer />
          </div>
        </section>

        <section aria-labelledby="registry">
          <SectionHeading
            id="registry"
            kicker={`${status.sources.length} endpoints`}
            title="Feed registry"
            icon="rss"
            count={`Refresh every ${status.refreshIntervalMinutes} min`}
          />

          <div className="flex flex-col gap-6">
            {CATEGORIES.map((category) => {
              const rows = status.sources.filter((source) => source.category === category.id);
              if (rows.length === 0) return null;
              return (
                <div key={category.id}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.1em]" style={{ color: category.accent }}>
                    <Icon name={CATEGORY_ICON[category.icon] ?? "newspaper"} className="h-4 w-4" />
                    {category.label}
                    <span className="text-[11px] font-semibold normal-case tracking-normal text-faint">
                      {rows.filter((row) => row.state === "ok").length}/{rows.length} responding
                    </span>
                  </h3>

                  <div className="card overflow-hidden">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-line bg-surface text-[10px] font-extrabold uppercase tracking-[0.1em] text-faint">
                          <th className="px-3 py-2.5 font-extrabold">Publisher</th>
                          <th className="hidden px-3 py-2.5 font-extrabold md:table-cell">Endpoint</th>
                          <th className="px-3 py-2.5 font-extrabold">State</th>
                          <th className="hidden px-3 py-2.5 text-right font-extrabold sm:table-cell">Items</th>
                          <th className="hidden px-3 py-2.5 text-right font-extrabold sm:table-cell">Latency</th>
                          <th className="hidden px-3 py-2.5 font-extrabold lg:table-cell">Last ok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {rows.map((row) => (
                          <SourceRow key={row.id} row={row} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="add-feed">
          <SectionHeading id="add-feed" kicker="Extend it" title="Add your own feed" icon="code" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <p className="text-sm font-bold">1. Register the endpoint</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Add one entry to <code className="rounded bg-surface px-1 py-0.5">FEED_SOURCES</code> in{" "}
                <code className="rounded bg-surface px-1 py-0.5">src/lib/sources.ts</code>. Nothing else needs to change — the
                crawler, facets, filters and this page pick it up automatically.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface p-3 text-[11px] leading-relaxed text-ink-soft">
                <code>{`{
  id: "rest-of-world",
  name: "Rest of World",
  category: "tech",
  url: "https://restofworld.org/feed/",
  site: "https://restofworld.org",
  weight: 4,
}`}</code>
              </pre>
            </div>

            <div className="card p-5">
              <p className="text-sm font-bold">2. Or point Local news at your town</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Local feeds are resolved per region at crawl time. Use the picker on{" "}
                <Link href="/category/local" className="font-semibold underline underline-offset-2">
                  Local news
                </Link>
                , or add permanent endpoints through the environment:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface p-3 text-[11px] leading-relaxed text-ink-soft">
                <code>{`LOCAL_DEFAULT_REGION="Austin, Texas"
LOCAL_FEEDS="https://www.kut.org/rss.xml,\\
https://www.texasmonthly.com/feed/"`}</code>
              </pre>
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                Dynamic sources can also expose a <code className="rounded bg-surface px-1 py-0.5">resolveUrl()</code> function
                instead of a static <code className="rounded bg-surface px-1 py-0.5">url</code> — that is how the Google News
                region feeds work.
              </p>
            </div>
          </div>
        </section>

        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
          <Icon name="shield" className="mr-1.5 inline h-4 w-4 align-text-bottom" />
          NewsSplit stores headlines, standfirsts, thumbnails and links so it can rank and de-duplicate them. All content
          belongs to the publishers; every card links through to the original article and nothing is republished here.
        </p>
      </div>
    </>
  );
}

function SourceRow({ row }: { row: SourceHealth }) {
  const url = row.url ?? "";
  const tone =
    row.state === "ok" ? "var(--ok)" : row.state === "error" ? "var(--warn)" : "var(--faint)";
  const soft = row.state === "ok" ? "var(--ok-soft)" : row.state === "error" ? "var(--warn-soft)" : "var(--surface)";

  return (
    <tr className="transition hover:bg-surface">
      <td className="max-w-[14rem] px-3 py-2.5">
        <p className="truncate font-bold text-ink">{row.name}</p>
        <p className="truncate text-[10.5px] text-faint md:hidden">{shortUrl(url)}</p>
      </td>
      <td className="hidden max-w-[22rem] px-3 py-2.5 md:table-cell">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-mono text-[10.5px] text-muted underline-offset-2 hover:text-ink hover:underline"
            title={url}
          >
            {shortUrl(url)}
          </a>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
          style={{ color: tone, backgroundColor: soft }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
          {row.state}
        </span>
        {row.error && (
          <p className="mt-1 max-w-[16rem] truncate text-[10.5px] text-warn" title={row.error}>
            {row.error}
          </p>
        )}
      </td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums text-muted sm:table-cell">{row.items || "—"}</td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums text-muted sm:table-cell">
        {row.latencyMs ? `${row.latencyMs} ms` : "—"}
      </td>
      <td className="hidden px-3 py-2.5 text-muted lg:table-cell">
        {row.lastOkAt ? <TimeAgo iso={row.lastOkAt} /> : <span className="text-faint">never</span>}
      </td>
    </tr>
  );
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.length > 34 ? `${parsed.pathname.slice(0, 34)}…` : parsed.pathname;
    return `${parsed.host}${path}`;
  } catch {
    return url;
  }
}

