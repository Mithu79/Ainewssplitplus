import Link from "next/link";
import { Icon } from "@/components/Icons";
import { CATEGORIES } from "@/lib/categories";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-6 px-4 py-20 text-center sm:px-5">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-muted">
        <Icon name="search" className="h-7 w-7" />
      </span>
      <div>
        <p className="kicker text-faint">Error 404</p>
        <h1 className="display mt-2 text-4xl">That story is off the wire</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          The page or cluster you asked for is not in the index. Feeds rotate constantly, so older clusters are pruned after
          each crawl.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="button button-primary">
          <Icon name="bolt" className="h-4 w-4" />
          Back to the front page
        </Link>
        <Link href="/search" className="button">
          <Icon name="search" className="h-4 w-4" />
          Search stories
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="chip"
            style={{ color: category.accent, borderColor: `color-mix(in oklab, ${category.accent} 30%, var(--line))` }}
          >
            {category.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
