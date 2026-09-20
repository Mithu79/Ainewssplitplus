import { ArticleImage } from "./ArticleImage";
import { BreakingPill, CategoryChip, ClusterPill, MetaRow, VideoPill } from "./Badges";
import { CATEGORY_ICON, Icon, type IconName } from "./Icons";
import { TimeAgo } from "./TimeAgo";
import { cn } from "@/lib/cn";
import { categoryAccent, getCategory } from "@/lib/categories";
import { truncate } from "@/lib/text";
import type { Article } from "@/lib/types";

export type CardVariant = "hero" | "feature" | "rail" | "list" | "compact";

export interface StoryCardProps {
  article: Article;
  variant?: CardVariant;
  /** Number of distinct outlets covering the same story (enables the cluster pill). */
  sourceCount?: number;
  priority?: boolean;
  index?: number;
  className?: string;
  showCategory?: boolean;
}

export function StoryCard({
  article,
  variant = "feature",
  sourceCount,
  priority = false,
  index = 0,
  className,
  showCategory = true,
}: StoryCardProps) {
  const meta = getCategory(article.primaryCategory);
  const accent = categoryAccent(article.primaryCategory);
  const delay = { animationDelay: `${Math.min(index, 10) * 35}ms` } as const;

  const title = (
    <a
      className="card-link"
      href={article.link}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`${article.title} — opens on ${article.sourceName}`}
    >
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
        {article.title}
      </span>
    </a>
  );

  const overlayBadges = (
    <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-[2] flex items-start justify-between gap-2">
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
        {article.breaking && <BreakingPill />}
        {showCategory && <CategoryChip category={article.primaryCategory} size="xs" tone="light" />}
      </div>
      {article.isVideo && <VideoPill />}
    </div>
  );

  const cluster = sourceCount && sourceCount > 1 ? (
    <ClusterPill clusterId={article.clusterId} sourceCount={sourceCount} />
  ) : null;

  /* ── hero ───────────────────────────────────────────────────────────── */
  if (variant === "hero") {
    return (
      <article className={cn("card group stretched-link fade-up overflow-hidden", className)} style={delay}>
        <ArticleImage
          src={article.image}
          alt=""
          accent={accent}
          iconKey={meta?.icon}
          sourceName={article.sourceName}
          ratio="aspect-[16/9] md:aspect-[21/9]"
        >
          {overlayBadges}
        </ArticleImage>
        <div className="flex flex-col gap-3 p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            {showCategory && <CategoryChip category={article.primaryCategory} className="md:hidden" />}
            <span className="kicker text-faint">{meta?.label ?? "News"}</span>
            {cluster}
          </div>
          <h2 className="display text-[1.75rem] leading-[1.12] tracking-tight md:text-[2.6rem]">{title}</h2>
          {article.summary && (
            <p className="max-w-3xl text-[0.95rem] leading-relaxed text-muted md:text-base">{truncate(article.summary, 260)}</p>
          )}
          <MetaRow article={article} className="mt-1 text-xs" />
        </div>
      </article>
    );
  }

  /* ── compact (latest list) ──────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <article className={cn("group stretched-link flex gap-3 border-b border-line py-3 last:border-0", className)}>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9rem] font-semibold leading-snug text-ink">{title}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-faint">
            <span className="font-semibold" style={{ color: accent }}>
              {meta?.short}
            </span>
            <span aria-hidden="true">•</span>
            <span className="truncate">{article.sourceName}</span>
            <span aria-hidden="true">•</span>
            <MetaClock article={article} />
          </div>
        </div>
        {article.image && (
          <ArticleImage src={article.image} alt="" accent={accent} iconKey={meta?.icon} ratio="aspect-square" className="h-16 w-16 shrink-0 rounded-lg" />
        )}
      </article>
    );
  }

  /* ── list row ───────────────────────────────────────────────────────── */
  if (variant === "list") {
    return (
      <article className={cn("card group stretched-link fade-up flex gap-4 overflow-hidden p-4", className)} style={delay}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {article.breaking && <BreakingPill />}
            {showCategory && <CategoryChip category={article.primaryCategory} size="xs" />}
            {cluster}
          </div>
          <h3 className="display text-lg leading-snug md:text-xl">{title}</h3>
          {article.summary && <p className="line-clamp-2 text-sm leading-relaxed text-muted">{truncate(article.summary, 200)}</p>}
          <MetaRow article={article} className="mt-auto pt-1" showCategory={false} />
        </div>
        <ArticleImage
          src={article.image}
          alt=""
          accent={accent}
          iconKey={meta?.icon}
          sourceName={article.sourceName}
          ratio="aspect-[4/3]"
          className="hidden w-40 shrink-0 rounded-xl sm:block md:w-52"
        />
      </article>
    );
  }

  /* ── rail card ──────────────────────────────────────────────────────── */
  if (variant === "rail") {
    return (
      <article className={cn("card group stretched-link flex w-[17.5rem] shrink-0 flex-col overflow-hidden", className)}>
        <ArticleImage src={article.image} alt="" accent={accent} iconKey={meta?.icon} sourceName={article.sourceName} ratio="aspect-[16/10]">
          {overlayBadges}
        </ArticleImage>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="display line-clamp-3 text-[1.02rem] leading-snug">{title}</h3>
          <MetaRow article={article} className="mt-auto" showCategory={false} />
        </div>
      </article>
    );
  }

  /* ── feature (default) ──────────────────────────────────────────────── */
  return (
    <article className={cn("card group stretched-link fade-up flex flex-col overflow-hidden", className)} style={delay}>
      <ArticleImage src={article.image} alt="" accent={accent} iconKey={meta?.icon} sourceName={article.sourceName} priority={priority}>
        {overlayBadges}
      </ArticleImage>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="display line-clamp-3 text-[1.075rem] leading-snug">{title}</h3>
        {article.summary && <p className="line-clamp-2 text-[0.84rem] leading-relaxed text-muted">{truncate(article.summary, 170)}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <MetaRow article={article} showCategory={showCategory} showReading={false} className="min-w-0" />
          {cluster}
        </div>
      </div>
    </article>
  );
}

function MetaClock({ article }: { article: Article }) {
  return <TimeAgo iso={article.publishedAt} className="tabular-nums" />;
}

/** Responsive card grid used by category, search and section blocks. */
export function StoryGrid({
  articles,
  variant = "feature",
  clusterCounts,
  className,
  columns = 3,
}: {
  articles: Article[];
  variant?: CardVariant;
  clusterCounts?: Map<string, number>;
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  if (variant === "list") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {articles.map((article, index) => (
          <StoryCard key={article.id} article={article} variant="list" index={index} sourceCount={clusterCounts?.get(article.clusterId)} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 md:gap-5", gridClass, className)}>
      {articles.map((article, index) => (
        <StoryCard
          key={article.id}
          article={article}
          variant={variant}
          index={index}
          priority={index < 3}
          sourceCount={clusterCounts?.get(article.clusterId)}
        />
      ))}
    </div>
  );
}

export function StoryCardSkeleton({ variant = "feature" }: { variant?: CardVariant }) {
  if (variant === "list") {
    return (
      <div className="card flex gap-4 p-4">
        <div className="flex-1 space-y-3">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-5 w-full rounded" />
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton h-3 w-40 rounded" />
        </div>
        <div className="skeleton hidden w-40 shrink-0 rounded-xl sm:block" />
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/9] w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function StoryGridSkeleton({ count = 6, variant = "feature" }: { count?: number; variant?: CardVariant }) {
  return (
    <div className={cn("grid grid-cols-1 gap-5", variant === "list" ? "" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {Array.from({ length: count }).map((_, index) => (
        <StoryCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "No stories yet",
  message = "Nothing matched those filters. Try widening the time range or clearing the search.",
  icon = "inbox",
  action,
}: {
  title?: string;
  message?: string;
  icon?: IconName;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-muted">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h3 className="display text-xl">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted">{message}</p>
      {action}
    </div>
  );
}
