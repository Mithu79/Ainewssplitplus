import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATEGORY_ICON, Icon } from "@/components/Icons";
import { NewsFeed } from "@/components/NewsFeed";
import { RegionPicker } from "@/components/RegionPicker";
import { getCategory } from "@/lib/categories";
import { config } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { sourcesForCategory } from "@/lib/sources";
import { clusterSourceCounts, queryNews } from "@/lib/store";
import type { SortOrder } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Category pages read the live store, so they are always server-rendered. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.label} news`,
    description: `${category.tagline} Aggregated automatically from ${sourcesForCategory(category.id).length} public RSS and Atom feeds by ${config.siteName}.`,
    alternates: { canonical: category.href },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const rawRegion = typeof sp.region === "string" ? sp.region.trim().slice(0, 80) : "";
  const region = rawRegion || config.defaultRegion;
  const sort: SortOrder = sp.sort === "newest" ? "newest" : "rank";
  const hours = Number.isFinite(Number(sp.hours)) ? Math.max(0, Number(sp.hours)) : 0;
  const source = typeof sp.source === "string" ? sp.source.slice(0, 60) : undefined;

  const [result, counts] = await Promise.all([
    queryNews({ category: category.id, region, sort, hours, source, limit: 24 }),
    Promise.resolve(clusterSourceCounts()),
  ]);

  const feeds = sourcesForCategory(category.id);
  const publishers = [...new Set(feeds.map((feed) => feed.name))];

  return (
    <>
      <div className="border-b border-line bg-bg-tint">
        <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-5 sm:py-8">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold text-faint">
            <Link href="/" className="transition hover:text-ink">
              Home
            </Link>
            <Icon name="chevronRight" className="h-3 w-3" />
            <span className="text-muted">Categories</span>
            <Icon name="chevronRight" className="h-3 w-3" />
            <span aria-current="page" style={{ color: category.accent }}>
              {category.label}
            </span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
              style={{
                color: category.accent,
                backgroundColor: `color-mix(in oklab, ${category.accent} 14%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${category.accent} 24%, transparent)`,
              }}
            >
              <Icon name={CATEGORY_ICON[category.icon] ?? "newspaper"} className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="display text-[2rem] leading-tight md:text-[2.6rem]">{category.label}</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted md:text-[0.95rem]">{category.tagline}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-faint">
                <span>
                  <b className="display text-base text-ink">{formatNumber(result.total)}</b> stories
                </span>
                <span>
                  <b className="display text-base text-ink">{feeds.length}</b> feeds watched
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {publishers.slice(0, 5).map((publisher) => (
                    <span key={publisher} className="chip !px-2 !py-0.5 text-[10px]">
                      {publisher}
                    </span>
                  ))}
                  {publishers.length > 5 && <span className="text-[11px]">+{publishers.length - 5} more</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-6 sm:px-5">
        {category.id === "local" && (
          <>
            <Suspense fallback={<div className="skeleton h-32 w-full rounded-[14px]" />}>
              <RegionPicker region={region} defaultRegion={config.defaultRegion} />
            </Suspense>
            <p className="flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
              <Icon name="info" className="mt-px h-4 w-4 shrink-0 text-faint" />
              The Local desk reads only popular Bengali publishers — আনন্দবাজার পত্রিকা, প্রথম আলো, এই সময়, বর্তমান and
              friends — through Google News <code className="rounded bg-bg px-1 py-0.5 text-[11px]">site:</code> feeds,
              cached for {Math.round(config.staleAfterMs / 60_000)} minutes like every other category. Extra feeds you
              list in <code className="rounded bg-bg px-1 py-0.5 text-[11px]">LOCAL_FEEDS</code> are merged in; the region
              picker labels and caches on-demand coverage for a place.
            </p>
          </>
        )}

        <NewsFeed
          key={`${category.id}-${region}-${sort}-${hours}-${source ?? "all"}`}
          initial={result}
          basePath={category.href}
          stickyParams={category.id === "local" ? { region } : {}}
          clusterCounts={Object.fromEntries(counts)}
        />
      </div>
    </>
  );
}
