"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icons";
import { EmptyState, StoryCard, StoryGridSkeleton } from "./StoryCard";
import { TranslateBar } from "./translate/TranslateBar";
import type { Article, NewsResult, SortOrder } from "@/lib/types";

const PAGE_SIZE = 24;

const TIME_RANGES = [
  { value: "0", label: "Any time" },
  { value: "6", label: "Past 6 hours" },
  { value: "24", label: "Past 24 hours" },
  { value: "72", label: "Past 3 days" },
  { value: "168", label: "Past week" },
];

export interface NewsFeedProps {
  initial: NewsResult;
  /** Path used to build pagination URLs, e.g. `/category/tech`. */
  basePath: string;
  /** Params preserved on every request (search query, region…). */
  stickyParams?: Record<string, string>;
  showSourceFilter?: boolean;
  defaultView?: "grid" | "list";
  /** clusterId → number of outlets, so cards can show the "N outlets" pill. */
  clusterCounts?: Record<string, number>;
}

/**
 * Client-side feed: filter, sort, paginate and re-fetch from `/api/news`.
 * The server renders `initial` so the first paint is instant and crawlable.
 */
export function NewsFeed({
  initial,
  basePath,
  stickyParams = {},
  showSourceFilter = true,
  defaultView = "grid",
  clusterCounts: clusterCountsProp,
}: NewsFeedProps) {
  const [articles, setArticles] = useState<Article[]>(initial.articles);
  const [total, setTotal] = useState(initial.total);
  const [mode, setMode] = useState(initial.mode);
  const [facets, setFacets] = useState(initial.facets);
  const [sort, setSort] = useState<SortOrder>(initial.query.sort ?? "rank");
  const [hours, setHours] = useState<string>(String(initial.query.hours ?? 0));
  const [source, setSource] = useState<string>(initial.query.source ?? "");
  const [view, setView] = useState<"grid" | "list">(defaultView);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(initial.articles.length);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const buildUrl = useCallback(
    (offset: number, limit = PAGE_SIZE) => {
      const params = new URLSearchParams();
      if (initial.query.category && initial.query.category !== "top") params.set("category", String(initial.query.category));
      for (const [key, value] of Object.entries(stickyParams)) if (value) params.set(key, value);
      if (sort) params.set("sort", sort);
      if (hours !== "0") params.set("hours", hours);
      if (source) params.set("source", source);
      params.set("limit", String(limit));
      if (offset > 0) params.set("offset", String(offset));
      return `/api/news?${params.toString()}`;
    },
    [initial.query.category, stickyParams],
  );

  const load = useCallback(
    async (offset: number, replace: boolean) => {
      try {
        if (replace) setLoading(true);
        else setLoadingMore(true);
        setError(null);
        const response = await fetch(buildUrl(offset), { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as NewsResult;
        setMode(data.mode);
        setFacets(data.facets);
        setTotal(data.total);
        setArticles((previous) => {
          const next = replace ? data.articles : [...previous, ...data.articles];
          const seen = new Set<string>();
          return next.filter((article) => {
            if (seen.has(article.id)) return false;
            seen.add(article.id);
            return true;
          });
        });
        offsetRef.current = offset + data.articles.length;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load more stories");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl],
  );

  // Re-fetch whenever a filter changes (the first paint already has server data).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    void load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, hours, source, basePath, JSON.stringify(stickyParams)]);

  // Infinite scroll.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && !loadingMore && offsetRef.current < total) {
          void load(offsetRef.current, false);
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [load, loading, loadingMore, total]);

  const clusterCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [id, value] of Object.entries(clusterCountsProp ?? {})) counts.set(id, value);
    for (const cluster of initial.clusters ?? []) counts.set(cluster.id, cluster.sourceCount);
    return counts;
  }, [clusterCountsProp, initial.clusters]);

  const hasFilters = hours !== "0" || Boolean(source) || sort !== "rank";

  return (
    <div className="flex flex-col gap-5">
      <div className="card sticky top-[6.6rem] z-30 flex flex-wrap items-center gap-2 p-2.5 lg:top-[3.9rem]">
        <span className="flex items-center gap-1.5 pl-1.5 pr-1 text-xs font-bold text-muted">
          <Icon name="filter" className="h-3.5 w-3.5" />
          {total} {total === 1 ? "story" : "stories"}
        </span>

        <TranslateBar compact className="ml-1" />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {showSourceFilter && facets.sources.length > 1 && (
            <select
              className="input select h-9 w-auto max-w-[13rem] text-xs"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              aria-label="Filter by publisher"
            >
              <option value="">All publishers</option>
              {facets.sources.map((facet) => (
                <option key={facet.id} value={facet.id}>
                  {facet.name} ({facet.count})
                </option>
              ))}
            </select>
          )}

          <select
            className="input select h-9 w-auto text-xs"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            aria-label="Time range"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          <select
            className="input select h-9 w-auto text-xs"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOrder)}
            aria-label="Sort order"
          >
            <option value="rank">Top stories</option>
            <option value="newest">Newest first</option>
          </select>

          <div className="flex overflow-hidden rounded-[10px] border border-line">
            {(["grid", "list"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-label={`${option} view`}
                aria-pressed={view === option}
                className={`grid h-9 w-9 place-items-center transition ${
                  view === option ? "bg-ink text-bg" : "bg-bg text-muted hover:bg-surface"
                }`}
              >
                <Icon name={option} className="h-4 w-4" />
              </button>
            ))}
          </div>

          {(hasFilters || loading) && (
            <button
              type="button"
              className="button h-9 px-2.5 text-xs"
              onClick={() => void load(0, true)}
              disabled={loading}
              title="Re-fetch from the server"
            >
              <Icon name="refresh" className={`h-3.5 w-3.5 ${loading ? "spin" : ""}`} />
              <span className="hidden sm:inline">{loading ? "Loading" : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-[color-mix(in_oklab,var(--warn)_40%,var(--line))] bg-warn-soft px-4 py-2.5 text-xs font-semibold text-warn">
          {error}
        </p>
      )}

      {loading ? (
        <StoryGridSkeleton count={6} variant={view === "list" ? "list" : "feature"} />
      ) : articles.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nothing matches those filters" : "No stories yet"}
          message={
            hasFilters
              ? "Try a wider time range, a different publisher, or reset the filters."
              : "The crawler has not indexed anything for this view yet. It retries automatically every few minutes."
          }
          icon={hasFilters ? "filter" : "inbox"}
          action={
            hasFilters ? (
              <button
                type="button"
                className="button mt-1"
                onClick={() => {
                  setHours("0");
                  setSource("");
                  setSort("rank");
                }}
              >
                <Icon name="refresh" className="h-4 w-4" />
                Reset filters
              </button>
            ) : undefined
          }
        />
      ) : view === "list" ? (
        <div className="flex flex-col gap-3">
          {articles.map((article, index) => (
            <StoryCard
              key={article.id}
              article={article}
              variant="list"
              index={index}
              sourceCount={clusterCounts.get(article.clusterId)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {articles.map((article, index) => (
            <StoryCard
              key={article.id}
              article={article}
              variant="feature"
              index={index % PAGE_SIZE}
              sourceCount={clusterCounts.get(article.clusterId)}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" />

      {loadingMore && (
        <p className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-muted">
          <Icon name="refresh" className="spin h-4 w-4" />
          Loading more stories…
        </p>
      )}

      {!loading && articles.length >= total && articles.length > 0 && (
        <p className="py-4 text-center text-xs text-faint">
          You&rsquo;re all caught up — {articles.length} {articles.length === 1 ? "story" : "stories"} shown
          {mode === "snapshot" ? " from the offline snapshot" : ""}.
        </p>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {loading ? "Loading stories" : `${articles.length} of ${total} stories loaded`}
      </p>
      {/* keeps the base path in the DOM for debugging/seo tooling */}
      <span className="hidden" data-base-path={basePath} />
    </div>
  );
}
