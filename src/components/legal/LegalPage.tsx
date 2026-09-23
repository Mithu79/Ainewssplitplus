import Link from "next/link";
import { Icon } from "@/components/Icons";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

/**
 * Long-form document layout used by the privacy / terms / security pages:
 * a quiet header, a sticky table of contents on wide screens and measured
 * prose typography (`.prose-legal`, defined in globals.css).
 */
export function LegalPage({
  kicker,
  title,
  intro,
  updated,
  sections,
  dict,
}: {
  kicker: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  dict: Dictionary;
}) {
  return (
    <>
      <div className="border-b border-line bg-bg-tint">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-5 sm:py-14">
          <p className="kicker text-faint">{kicker}</p>
          <h1 className="display mt-2 max-w-3xl text-[2.2rem] leading-[1.08] md:text-[3rem]">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">{intro}</p>
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-faint">
            <Icon name="calendar" className="h-3.5 w-3.5" />
            {dict.legal.lastUpdated}: <time dateTime={updated}>{updated}</time>
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-10 sm:px-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Contents" className="hidden lg:block">
          <ol className="sticky top-20 flex flex-col gap-1.5 border-l border-line pl-4 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted transition hover:text-ink">
                  <span className="mr-1.5 tabular-nums text-faint">{i + 1}.</span>
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="prose-legal max-w-[68ch]">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`} className="scroll-mt-24">
              <h2 id={`${s.id}-heading`}>
                <span className="mr-2 text-faint">{i + 1}.</span>
                {s.heading}
              </h2>
              {s.body}
            </section>
          ))}

          <footer className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6 text-sm text-muted">
            <span>{dict.legal.contact}</span>
            <a
              href="https://github.com/Mithu79/Ainewssplitplus/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="button h-8 px-3 text-xs"
            >
              <Icon name="external" className="h-3.5 w-3.5" />
              GitHub
            </a>
            <span className="mx-1 text-faint">·</span>
            <Link href="/privacy-policy" className="hover:text-ink">
              {dict.footer.privacy}
            </Link>
            <Link href="/terms-of-service" className="hover:text-ink">
              {dict.footer.terms}
            </Link>
            <Link href="/security-policy" className="hover:text-ink">
              {dict.footer.security}
            </Link>
          </footer>
        </article>
      </div>
    </>
  );
}
