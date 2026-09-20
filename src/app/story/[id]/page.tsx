import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleImage } from "@/components/ArticleImage";
import { BreakingPill, CategoryChip, MetaRow } from "@/components/Badges";
import { CATEGORY_ICON, Icon } from "@/components/Icons";
import { SectionHeading } from "@/components/SectionHeading";
import { SourceBadge } from "@/components/SourceBadge";
import { StoryGrid } from "@/components/StoryCard";
import { TimeAgo } from "@/components/TimeAgo";
import { categoryAccent, getCategory } from "@/lib/categories";
import { config } from "@/lib/config";
import { formatFullDate } from "@/lib/format";
import { getCluster, getRelated } from "@/lib/store";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const cluster = getCluster(id);
  if (!cluster) return { title: "Story not found" };
  return {
    title: cluster.title,
    description: `${cluster.sourceCount} outlets covering this story, aggregated by ${config.siteName}.`,
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const cluster = getCluster(id);
  if (!cluster) notFound();

  const lead = cluster.lead;
  const others = cluster.items.filter((item) => item.id !== lead.id);
  const related = getRelated(lead, 6);
  const meta = getCategory(lead.primaryCategory);
  const accent = categoryAccent(lead.primaryCategory);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-5">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-faint">
        <Link href="/" className="transition hover:text-ink">
          Home
        </Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        {meta && (
          <>
            <Link href={meta.href} className="transition hover:text-ink" style={{ color: accent }}>
              {meta.label}
            </Link>
            <Icon name="chevronRight" className="h-3 w-3" />
          </>
        )}
        <span className="truncate text-muted">Coverage</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <article className="card fade-up overflow-hidden">
          <ArticleImage
            src={lead.image}
            alt=""
            accent={accent}
            iconKey={meta?.icon}
            sourceName={lead.sourceName}
            ratio="aspect-[16/9]"
            priority
          >
            <div className="absolute inset-x-3 top-3 z-[2] flex flex-wrap items-center gap-2">
              {lead.breaking && <BreakingPill />}
              <CategoryChip category={lead.primaryCategory} size="xs" tone="light" />
            </div>
          </ArticleImage>

          <div className="flex flex-col gap-4 p-5 md:p-7">
            <h1 className="display text-[1.7rem] leading-[1.15] md:text-[2.3rem]">{lead.title}</h1>

            {lead.summary && <p className="text-[0.95rem] leading-relaxed text-muted md:text-base">{lead.summary}</p>}

            <MetaRow article={lead} className="text-xs" />

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <a href={lead.link} target="_blank" rel="noopener noreferrer nofollow" className="button button-primary">
                Read on {lead.sourceName}
                <Icon name="external" className="h-4 w-4" />
              </a>
              {lead.site && (
                <a href={lead.site} target="_blank" rel="noopener noreferrer" className="button">
                  <Icon name="globe" className="h-4 w-4" />
                  Publisher site
                </a>
              )}
              {lead.author && (
                <span className="chip">
                  <Icon name="users" className="h-3.5 w-3.5" />
                  {lead.author}
                </span>
              )}
            </div>

            {lead.wordCount ? (
              <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">
                The feed shipped {lead.wordCount} words of body copy (~{lead.readingMinutes} min read). NewsSplit links out to
                the original article rather than republishing it.
              </p>
            ) : null}
          </div>
        </article>

        <aside className="flex flex-col gap-5">
          <div className="card overflow-hidden">
            <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
              <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em]">
                <Icon name="layers" className="h-3.5 w-3.5" />
                All coverage
              </h2>
              <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-bold text-muted">{cluster.items.length}</span>
            </header>

            <ul className="divide-y divide-line">
              {cluster.items.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-3">
                  <span className="mt-0.5 shrink-0">
                    <SourceBadge name={item.sourceName} domain={item.domain} showName={false} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="line-clamp-2 text-[0.85rem] font-semibold leading-snug decoration-1 underline-offset-2 hover:underline"
                    >
                      {item.title}
                    </a>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-faint">
                      <span className="font-semibold text-muted">{item.sourceName}</span>
                      <span aria-hidden="true">•</span>
                      <TimeAgo iso={item.publishedAt} />
                      {item.id === lead.id && (
                        <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-bg">
                          Lead
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-faint">About this cluster</h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-xs">
              <Row label="Outlets" value={`${cluster.sourceCount} distinct publisher${cluster.sourceCount === 1 ? "" : "s"}`} />
              <Row label="Categories" value={cluster.categories.map((c) => getCategory(c)?.label ?? c).join(", ")} />
              <Row label="First filed" value={formatFullDate(cluster.earliestAt)} />
              <Row label="Latest update" value={formatFullDate(cluster.latestAt)} />
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
              Clusters are built by comparing salient headline tokens (Jaccard similarity plus containment) inside a 72-hour
              window — no third-party API, no embedding calls.
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related">
          <SectionHeading id="related" kicker="Keep reading" title="Related stories" icon="sparkles" />
          <StoryGrid articles={related} columns={3} />
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 font-semibold text-faint">{label}</dt>
      <dd className="text-right font-medium text-ink-soft">{value}</dd>
    </div>
  );
}
