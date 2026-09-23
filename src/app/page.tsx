import Link from "next/link";
import { BreakingTicker } from "@/components/BreakingTicker";
import { CategoryRail } from "@/components/CategoryRail";
import { Icon } from "@/components/Icons";
import { LanguageRail } from "@/components/LanguageRail";
import { LatestPanel } from "@/components/LatestPanel";
import { MostCovered } from "@/components/MostCovered";
import { PipelineExplainer } from "@/components/PipelineExplainer";
import { SectionHeading } from "@/components/SectionHeading";
import { StatsStrip } from "@/components/StatsStrip";
import { EmptyState, StoryCard, StoryGrid } from "@/components/StoryCard";
import { CATEGORIES } from "@/lib/categories";
import { config } from "@/lib/config";
import { getI18n } from "@/lib/i18n/server";
import {
  clusterSourceCounts,
  getBreaking,
  getDeepReads,
  getLanguageArticles,
  getLatest,
  getStatus,
  getTopClusters,
  getTopStories,
  queryNews,
} from "@/lib/store";

export default async function HomePage() {
  const status = getStatus();
  const counts = clusterSourceCounts();

  const top = getTopStories(9);
  const latest = getLatest(10);
  const breaking = getBreaking(12);
  const clusters = getTopClusters(5);
  const deepReads = getDeepReads(3);
  const { locale, dict } = await getI18n();
  const languageArticles = {
    bn: getLanguageArticles("bn", 6),
    hi: getLanguageArticles("hi", 6),
    ta: getLanguageArticles("ta", 6),
  };

  const rails = await Promise.all(
    CATEGORIES.map(async (category) => ({
      category,
      result: await queryNews({ category: category.id, limit: 8 }),
    })),
  );

  const [lead, ...rest] = top;
  const secondary = rest.slice(0, 2);
  const moreTop = rest.slice(2);
  const tickerItems = breaking.length > 0 ? breaking : latest.slice(0, 8);

  if (top.length === 0) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-5">
        <EmptyState
          title="No stories indexed yet"
          message="The crawler has not returned anything yet. Check the feed health page to see which endpoints responded, then trigger a refresh."
          icon="alert"
          action={
            <Link href="/sources" className="button button-primary mt-1">
              <Icon name="activity" className="h-4 w-4" />
              Open feed health
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <BreakingTicker items={tickerItems} />

      <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-5 sm:py-7">
        {/* ── front page ─────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="sr-only">{config.siteName} — top stories</h1>
              <p className="kicker flex items-center gap-2 text-faint">
                <Icon name="bolt" className="h-3.5 w-3.5 text-accent" />
                Front page · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <Link href="/category/world" className="text-xs font-bold text-muted transition hover:text-ink">
                World desk →
              </Link>
            </div>

            {lead && <StoryCard article={lead} variant="hero" priority sourceCount={counts.get(lead.clusterId)} />}

            {secondary.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
                {secondary.map((article, index) => (
                  <StoryCard
                    key={article.id}
                    article={article}
                    variant="feature"
                    index={index + 1}
                    sourceCount={counts.get(article.clusterId)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <StatsStrip status={status} />
            <LatestPanel articles={latest} updatedAt={status.lastRefreshAt} mode={status.mode} />
          </aside>
        </div>

        {moreTop.length > 0 && (
          <section className="mt-10" aria-labelledby="top-stories">
            <SectionHeading
              id="top-stories"
              kicker="Ranked by source trust, freshness and completeness"
              title="Top stories"
              icon="trending"
              href="/search"
              hrefLabel="Browse everything"
              count={`${status.articleCount} indexed`}
            />
            <StoryGrid articles={moreTop} clusterCounts={counts} columns={3} />
          </section>
        )}

        {/* ── Indian-language rail ───────────────────────────────────── */}
        <div className="mt-12">
          <LanguageRail articlesByLang={languageArticles} locale={locale} dict={dict} />
        </div>

        {/* ── category rails ─────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-10">
          {rails.map(({ category, result }) => (
            <CategoryRail key={category.id} category={category} articles={result.articles} clusterCounts={counts} />
          ))}
        </div>

        {/* ── multi-outlet coverage + deep reads ─────────────────────── */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <section aria-labelledby="most-covered">
            <SectionHeading
              id="most-covered"
              kicker="Clustered by headline similarity"
              title="Most covered right now"
              icon="layers"
              href="/sources"
              hrefLabel="How clustering works"
            />
            <MostCovered clusters={clusters} />
          </section>

          <section aria-labelledby="deep-reads">
            <SectionHeading id="deep-reads" kicker="Feeds that shipped the full body" title="Deep reads" icon="bookmark" />
            {deepReads.length === 0 ? (
              <p className="card px-4 py-6 text-sm text-muted">
                No long-form items in this crawl. Feeds that only publish headlines will still show up in the rails above.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {deepReads.map((article, index) => (
                  <StoryCard key={article.id} article={article} variant="list" index={index} sourceCount={counts.get(article.clusterId)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── automation band ────────────────────────────────────────── */}
        <section className="card mt-12 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="kicker text-faint">Fully automated</p>
              <h2 className="display text-xl">How this page keeps itself up to date</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/about" className="button">
                <Icon name="sparkles" className="h-4 w-4" />
                How it works
              </Link>
              <Link href="/sources" className="button">
                <Icon name="activity" className="h-4 w-4" />
                Feed health
              </Link>
              <Link href="/api/news?category=top&limit=10" className="button">
                <Icon name="code" className="h-4 w-4" />
                JSON API
              </Link>
            </div>
          </div>

          <PipelineExplainer compact />
        </section>
      </div>
    </>
  );
}
