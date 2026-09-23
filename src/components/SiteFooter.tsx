import Link from "next/link";
import { Icon, LogoMark } from "./Icons";
import { SocialIcon, type SocialNetwork } from "./SocialIcons";
import { CATEGORIES } from "@/lib/categories";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/dictionaries";

const SOCIALS: { id: SocialNetwork; label: string; href: string }[] = [
  { id: "github", label: "GitHub", href: "https://github.com/Mithu79/Ainewssplitplus" },
  { id: "x", label: "X (Twitter)", href: "https://x.com/intent/follow?screen_name=newssplit" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fgithub.com%2FMithu79%2FAinewssplitplus" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fgithub.com%2FMithu79%2FAinewssplitplus" },
  { id: "rss", label: "RSS", href: "/feed" },
];

export function SiteFooter({
  sourceCount,
  articleCount,
  dict,
}: {
  sourceCount: number;
  articleCount: number;
  dict: Dictionary;
}) {
  const year = new Date().getFullYear();
  const navLabel = (id: string) => (dict.nav as Record<string, string>)[id];

  return (
    <footer className="mt-16 border-t border-line bg-bg-tint">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 sm:px-5 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="display text-lg leading-none">
              News<span className="text-accent">Split</span>
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t(dict.footer.description, { sources: sourceCount, articles: articleCount })}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a className="chip hover:text-ink" href="/feed" title={dict.footer.rssOutput}>
              <Icon name="rss" className="h-3.5 w-3.5" />
              {dict.footer.rssOutput}
            </a>
            <a className="chip hover:text-ink" href="/api/news?category=top&limit=10" title={dict.footer.jsonApi}>
              <Icon name="code" className="h-3.5 w-3.5" />
              {dict.footer.jsonApi}
            </a>
            <a
              className="chip hover:text-ink"
              href="https://github.com/Mithu79/Ainewssplitplus"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="code" className="h-3.5 w-3.5" />
              {dict.footer.source}
            </a>
          </div>
          <div className="pt-2">
            <p className="kicker mb-2 text-faint">{dict.footer.follow}</p>
            <ul className="flex flex-wrap gap-2" aria-label={dict.footer.follow}>
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    title={s.label}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="icon-button"
                  >
                    <SocialIcon name={s.id} className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <FooterColumn title={dict.footer.categories}>
          {CATEGORIES.map((category) => (
            <FooterLink key={category.id} href={category.href}>
              {navLabel(category.id) ?? category.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={dict.footer.product}>
          <FooterLink href="/">{dict.nav.top}</FooterLink>
          <FooterLink href="/search">{dict.nav.search}</FooterLink>
          <FooterLink href="/sources">{dict.nav.sources}</FooterLink>
          <FooterLink href="/about">{dict.nav.about}</FooterLink>
          <FooterLink href="/dashboard">{dict.nav.dashboard}</FooterLink>
        </FooterColumn>

        <FooterColumn title={dict.footer.endpoints}>
          <FooterLink href="/api/news">/api/news</FooterLink>
          <FooterLink href="/api/categories">/api/categories</FooterLink>
          <FooterLink href="/api/status">/api/status</FooterLink>
          <FooterLink href="/api/feed">/api/feed</FooterLink>
        </FooterColumn>

        <FooterColumn title={dict.footer.legal}>
          <FooterLink href="/privacy-policy">{dict.footer.privacy}</FooterLink>
          <FooterLink href="/terms-of-service">{dict.footer.terms}</FooterLink>
          <FooterLink href="/security-policy">{dict.footer.security}</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>{t(dict.footer.copyright, { year })}</p>
          <p className="flex items-center gap-1.5">{dict.footer.builtWith}</p>
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
