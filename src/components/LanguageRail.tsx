import Link from "next/link";
import { Icon } from "./Icons";
import { RailScroller } from "./RailScroller";
import { SectionHeading } from "./SectionHeading";
import { StoryCard } from "./StoryCard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { LOCALE_META, type Locale } from "@/lib/i18n/locales";
import type { Article, ArticleLanguage } from "@/lib/types";

const RAIL_LANGS: ArticleLanguage[] = ["bn", "hi", "ta"];

/**
 * "In Indian languages" — native-script headlines from Bengali, Hindi and
 * Tamil feeds. The visitor's own UI language is listed first; headlines are
 * shown exactly as filed by the publisher.
 */
export function LanguageRail({
  articlesByLang,
  locale,
  dict,
}: {
  articlesByLang: Partial<Record<ArticleLanguage, Article[]>>;
  locale: Locale;
  dict: Dictionary;
}) {
  const order = [...RAIL_LANGS].sort((a, b) => Number(b === locale) - Number(a === locale));
  const groups = order
    .map((lang) => ({ lang, articles: articlesByLang[lang] ?? [] }))
    .filter((g) => g.articles.length > 0);
  if (groups.length === 0) return null;

  const total = groups.reduce((n, g) => n + g.articles.length, 0);

  return (
    <section aria-labelledby="language-rail" data-testid="language-rail">
      <SectionHeading
        id="language-rail"
        kicker={dict.home.languageRailKicker}
        title={dict.home.languageRailTitle}
        icon="globe"
        accent="#f59e0b"
        count={`${total}`}
      >
        <div className="flex flex-wrap gap-1.5">
          {groups.map(({ lang, articles }) => (
            <Link
              key={lang}
              href={`/api/news?lang=${lang}&limit=20`}
              className={`chip hover:text-ink ${lang === locale ? "border-line-strong text-ink" : ""}`}
              lang={LOCALE_META[lang as Locale].htmlLang}
            >
              {LOCALE_META[lang as Locale].label}
              <span className="text-faint">{articles.length}</span>
            </Link>
          ))}
        </div>
      </SectionHeading>
      <p className="-mt-1 mb-4 flex items-start gap-2 text-xs text-muted">
        <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
        {dict.home.languageRailDescription}
      </p>
      <RailScroller>
        {groups.flatMap(({ lang, articles }) =>
          articles.slice(0, 6).map((article, index) => (
            <div key={article.id} lang={LOCALE_META[lang as Locale].htmlLang} className="contents">
              <StoryCard article={article} variant="rail" index={index} className="snap-start" />
            </div>
          )),
        )}
      </RailScroller>
    </section>
  );
}
