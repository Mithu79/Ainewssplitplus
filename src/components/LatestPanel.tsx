import { LiveDot } from "./Badges";
import { StoryCard } from "./StoryCard";
import { TimeAgo } from "./TimeAgo";
import type { Article } from "@/lib/types";

/** Right-hand "wire" column: the newest items across every feed. */
export function LatestPanel({
  articles,
  updatedAt,
  mode,
}: {
  articles: Article[];
  updatedAt: string | null;
  mode: "live" | "stale" | "snapshot" | "empty";
}) {
  return (
    <aside className="card overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <LiveDot state={mode} />
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">Latest updates</h2>
        </div>
        {updatedAt && <TimeAgo iso={updatedAt} className="text-[11px] font-medium text-faint" prefix="Updated" />}
      </header>

      <div className="px-4 py-1">
        {articles.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Nothing indexed yet.</p>
        ) : (
          articles.map((article) => <StoryCard key={article.id} article={article} variant="compact" />)
        )}
      </div>
    </aside>
  );
}
