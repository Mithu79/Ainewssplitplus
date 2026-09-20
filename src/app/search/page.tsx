import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_ICON, Icon } from "@/components/Icons";
import { NewsFeed } from "@/components/NewsFeed";
import { SearchBox } from "@/components/SearchBox";
import { SectionHeading } from "@/components/SectionHeading";
import { StoryGrid } from "@/components/StoryCard";
import { CATEGORIES } from "@/lib/categories";
import { clusterSourceCounts, getTopStories, queryNews } from "@/lib/store";
import type { SortOrder } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every story NewsSplit has indexed, across titles, standfirsts, tags and publishers.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 140) : "";
  const sort: SortOrder = sp.sort === "newest" ? "newest" : "rank";
  const hours = Number.isFinite(Number(sp.hours)) ? Math.max(0, Number(sp.hours)) : 0;

  const [result, counts, topStories] = await Promise.all([
    queryNews({ q: q || undefined, sort, hours, limit: 24 }),
    Promise.resolve(clusterSourceCounts()),
    Promise.resolve(getTopStories(9)),
  ]);

  return (
    <>
      <div className="border-b border-line bg-bg-tint">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-8 sm:px-5 sm:py-10">
          <div>
            <p className="kicker text-faint">Full-text search</p>
            <h1 className="display mt-1 text-[2rem] leading-tight md:text-[2.5rem]">
              {q ? (
                <>
                  Results for <span className="text-accent">&ldquo;{q}&rdquo;</span>
                </>
              ) : (
                "Search the wire"
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {q
                ? `${result.total} ${result.total === 1 ? "story" : "stories"} matched across titles, standfirsts, tags and publishers.`
                : "Match every indexed story by headline, standfirst, tag or publisher. Press / anywhere to jump here."}
            </p>
          </div>

          <div className="max-w-2xl">
            <SearchBox initialValue={q} size="lg" placeholder="Try “AI”, “Davis Cup”, “interest rates”, “The Verge”…" shortcutHint={false} autoFocusOnSlash={false} />
          </div>

          {!q && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-faint">Popular:</span>
              {result.facets.sources.slice(0, 6).map((facet) => (
                <Link key={facet.id} href={`/search?q=${encodeURIComponent(facet.name)}`} className="chip">
                  <Icon name="users" className="h-3 w-3" />
                  {facet.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-5">
        {q ? (
          <NewsFeed
            key={`search-${q}-${sort}-${hours}`}
            initial={result}
            basePath="/search"
            stickyParams={{ q }}
            clusterCounts={Object.fromEntries(counts)}
            showSourceFilter={false}
          />
        ) : (
          <div className="flex flex-col gap-10">
            <section aria-labelledby="trending">
              <SectionHeading id="trending" kicker="Right now" title="Trending across every feed" icon="trending" count={`${topStories.length} leads`} />
              <StoryGrid articles={topStories} clusterCounts={counts} columns={3} />
            </section>

            <section aria-labelledby="browse">
              <SectionHeading id="browse" kicker="Or jump straight in" title="Browse by category" icon="grid" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {CATEGORIES.map((category) => (
                  <Link
                    key={category.id}
                    href={category.href}
                    className="card group flex flex-col gap-2 p-4"
                    style={{ borderColor: `color-mix(in oklab, ${category.accent} 22%, var(--line))` }}
                  >
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                      style={{
                        color: category.accent,
                        backgroundColor: `color-mix(in oklab, ${category.accent} 14%, transparent)`,
                      }}
                    >
                      <Icon name={CATEGORY_ICON[category.icon] ?? "newspaper"} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="display text-lg leading-tight">{category.label}</span>
                    <span className="line-clamp-2 text-xs leading-relaxed text-muted">{category.tagline}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
