import Link from "next/link";
import { Icon } from "./Icons";
import { SourceBadge } from "./SourceBadge";
import { TimeAgo } from "./TimeAgo";
import type { Cluster } from "@/lib/types";

/**
 * "Most covered" — the stories several outlets are reporting at once, which is
 * what the clustering pass in src/lib/dedupe.ts produces.
 */
export function MostCovered({ clusters }: { clusters: Cluster[] }) {
  if (clusters.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
        <Icon name="layers" className="h-5 w-5 text-faint" />
        <p className="text-sm font-semibold">No multi-outlet stories right now</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted">
          When two or more publishers file the same story, NewsSplit groups them here so you can compare coverage.
        </p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-line overflow-hidden">
      {clusters.map((cluster, index) => (
        <article key={cluster.id} className="group flex gap-3 p-4 transition hover:bg-surface">
          <span className="display w-5 shrink-0 pt-0.5 text-lg leading-none text-faint">{index + 1}</span>

          <div className="min-w-0 flex-1">
            <a
              href={cluster.lead.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="line-clamp-2 text-[0.95rem] font-bold leading-snug decoration-1 underline-offset-2 group-hover:underline"
            >
              {cluster.title}
            </a>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {cluster.items.slice(0, 4).map((item) => (
                <SourceBadge key={item.id} name={item.sourceName} domain={item.domain} className="text-[11px] text-muted" />
              ))}
              {cluster.sourceCount > 4 && (
                <span className="text-[11px] font-semibold text-faint">+{cluster.sourceCount - 4} more</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            <TimeAgo iso={cluster.latestAt} className="text-[11px] text-faint" />
            <Link
              href={`/story/${cluster.id}`}
              className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-muted transition hover:border-ink hover:text-ink"
            >
              {cluster.sourceCount} outlets
              <Icon name="arrowRight" className="h-3 w-3" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
