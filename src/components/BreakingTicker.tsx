import { Icon } from "./Icons";
import type { Article } from "@/lib/types";

/**
 * Pure-CSS breaking news ribbon. The list is duplicated so the -50% translate
 * loops seamlessly; hovering (or focusing a link) pauses it, and readers with
 * prefers-reduced-motion get a static, scrollable strip instead.
 */
export function BreakingTicker({ items }: { items: Article[] }) {
  if (items.length === 0) return null;

  const loop = [...items, ...items];
  const duration = Math.max(28, Math.min(120, items.length * 8));

  return (
    <div className="marquee relative flex items-stretch overflow-hidden border-b border-line bg-surface">
      <div className="z-10 flex shrink-0 items-center gap-1.5 bg-accent px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-ink)] sm:px-4">
        <Icon name="bolt" className="h-3.5 w-3.5" strokeWidth={2.2} />
        <span className="hidden sm:inline">Breaking</span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="marquee-track items-center py-2" style={{ ["--marquee-duration" as string]: `${duration}s` }}>
          {loop.map((article, index) => (
            <a
              key={`${article.id}-${index}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-4 text-xs text-muted transition hover:text-ink"
            >
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
              <span className="font-semibold text-ink-soft">{article.title}</span>
              <span className="text-faint">{article.sourceName}</span>
            </a>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--surface)] to-transparent" />
      </div>
    </div>
  );
}
