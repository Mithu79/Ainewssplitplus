import Link from "next/link";
import { CATEGORY_ICON, Icon } from "./Icons";
import { SourceBadge } from "./SourceBadge";
import { TimeAgo } from "./TimeAgo";
import { cn } from "@/lib/cn";
import { categoryAccent, getCategory } from "@/lib/categories";
import { readingLabel } from "@/lib/format";
import type { Article, CategoryId } from "@/lib/types";

export function CategoryChip({
  category,
  className,
  size = "sm",
  tone = "accent",
  style,
}: {
  category: CategoryId;
  className?: string;
  size?: "xs" | "sm";
  /** `light` renders white-on-glass, for use over photography. */
  tone?: "accent" | "light";
  style?: React.CSSProperties;
}) {
  const meta = getCategory(category);
  if (!meta) return null;
  const accent = categoryAccent(category);

  const toneStyle: React.CSSProperties =
    tone === "light"
      ? {
          color: "#ffffff",
          backgroundColor: "rgba(8,8,12,0.62)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
        }
      : {
          color: accent,
          backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 26%, transparent)`,
        };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-[0.08em] backdrop-blur-[2px]",
        size === "xs" ? "px-2 py-[3px] text-[9px]" : "px-2.5 py-1 text-[10px]",
        className,
      )}
      style={{ ...toneStyle, ...style }}
    >
      <Icon name={CATEGORY_ICON[meta.icon] ?? "newspaper"} className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} strokeWidth={2} />
      {meta.short}
    </span>
  );
}

export function BreakingPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-ink)]",
        className,
      )}
    >
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-current" style={{ ["--pulse-color" as string]: "rgba(255,255,255,.6)" }} />
      Breaking
    </span>
  );
}

export function VideoPill({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm", className)}>
      <Icon name="film" className="h-3 w-3" strokeWidth={2} />
      Video
    </span>
  );
}

export function ClusterPill({
  clusterId,
  sourceCount,
  className,
}: {
  clusterId: string;
  sourceCount: number;
  className?: string;
}) {
  if (sourceCount < 2) return null;
  return (
    <Link
      href={`/story/${clusterId}`}
      className={cn(
        "relative z-[2] inline-flex items-center gap-1 rounded-full border border-line bg-bg px-2 py-[3px] text-[10px] font-bold text-muted transition hover:border-ink hover:text-ink",
        className,
      )}
      title={`See all ${sourceCount} outlets covering this story`}
    >
      <Icon name="layers" className="h-3 w-3" strokeWidth={2} />
      {sourceCount} outlets
    </Link>
  );
}

/** Publisher · timestamp · reading time — the standard card footer. */
export function MetaRow({
  article,
  className,
  showReading = true,
  showCategory = false,
}: {
  article: Article;
  className?: string;
  showReading?: boolean;
  showCategory?: boolean;
}) {
  const reading = readingLabel(article.readingMinutes, article.wordCount);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint", className)}>
      {showCategory && <CategoryChip category={article.primaryCategory} size="xs" />}
      <SourceBadge name={article.sourceName} domain={article.domain} className="max-w-[11rem] text-muted" />
      <span aria-hidden="true" className="text-line-strong">
        •
      </span>
      <TimeAgo iso={article.publishedAt} className="tabular-nums" />
      {showReading && reading && (
        <>
          <span aria-hidden="true" className="text-line-strong">
            •
          </span>
          <span>{reading}</span>
        </>
      )}
    </div>
  );
}

export function LiveDot({ state, className }: { state: "live" | "stale" | "snapshot" | "empty"; className?: string }) {
  const color =
    state === "live" ? "var(--ok)" : state === "stale" ? "var(--warn)" : state === "snapshot" ? "var(--info)" : "var(--faint)";
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 rounded-full", state === "live" && "pulse-dot", className)}
      style={{ backgroundColor: color, ["--pulse-color" as string]: `color-mix(in oklab, ${color} 55%, transparent)` }}
    />
  );
}
