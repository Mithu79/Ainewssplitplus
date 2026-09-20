import Link from "next/link";
import { Icon, LogoMark } from "./Icons";
import { CATEGORIES } from "@/lib/categories";

export function SiteFooter({ sourceCount, articleCount }: { sourceCount: number; articleCount: number }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-bg-tint">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 sm:px-5 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="display text-lg leading-none">
              News<span className="text-accent">Split</span>
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            An automated news aggregator. A crawler reads {sourceCount} public RSS and Atom feeds on a schedule, then
            normalises, de-duplicates, clusters and ranks every story so one front page shows the whole picture — currently{" "}
            {articleCount} stories indexed.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a className="chip hover:text-ink" href="/feed" title="Subscribe to NewsSplit's own RSS output">
              <Icon name="rss" className="h-3.5 w-3.5" />
              RSS output
            </a>
            <a className="chip hover:text-ink" href="/api/news?category=top&limit=10" title="JSON API">
              <Icon name="code" className="h-3.5 w-3.5" />
              JSON API
            </a>
            <a
              className="chip hover:text-ink"
              href="https://github.com/Mithu79/Ainewssplitplus"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="code" className="h-3.5 w-3.5" />
              Source
            </a>
          </div>
        </div>

        <FooterColumn title="Categories">
          {CATEGORIES.map((category) => (
            <FooterLink key={category.id} href={category.href}>
              {category.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Product">
          <FooterLink href="/">Top stories</FooterLink>
          <FooterLink href="/search">Search</FooterLink>
          <FooterLink href="/sources">Sources &amp; health</FooterLink>
          <FooterLink href="/about">How it works</FooterLink>
        </FooterColumn>

        <FooterColumn title="Endpoints">
          <FooterLink href="/api/news">/api/news</FooterLink>
          <FooterLink href="/api/categories">/api/categories</FooterLink>
          <FooterLink href="/api/status">/api/status</FooterLink>
          <FooterLink href="/api/feed">/api/feed</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>
            © {year} NewsSplit. Headlines, summaries and photography remain the property of their publishers — every card
            links through to the original article.
          </p>
          <p className="flex items-center gap-1.5">
            Built with Next.js, Tailwind CSS and a dependency-light RSS pipeline.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="kicker text-faint">{title}</p>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-muted transition hover:text-ink">
      {children}
    </Link>
  );
}
