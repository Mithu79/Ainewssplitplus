import type { Metadata, Viewport } from "next";
import { auth } from "@/auth";
import { ModeBanner } from "@/components/ModeBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TranslateProvider } from "@/components/translate/TranslateProvider";
import { config } from "@/lib/config";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { LOCALE_META } from "@/lib/i18n/locales";
import { getI18n } from "@/lib/i18n/server";
import { snapshotCapturedAt } from "@/lib/snapshot";
import { allSources } from "@/lib/sources";
import { getStatus } from "@/lib/store";
import "./globals.css";

/** Every page reads the live news store, so nothing here may be prerendered. */
export const dynamic = "force-dynamic";

const title = `${config.siteName} — automated news aggregation`;
const description =
  "NewsSplit crawls public RSS and Atom feeds every few minutes, then normalises, de-duplicates, clusters and ranks the stories so one responsive front page covers World, Tech, Business, Sports, Science, Health, Entertainment and your Local news.";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: title,
    template: `%s · ${config.siteName}`,
  },
  description,
  applicationName: config.siteName,
  keywords: [
    "news aggregator",
    "RSS reader",
    "world news",
    "technology news",
    "sports news",
    "local news",
    "breaking news",
    "NewsSplit",
  ],
  authors: [{ name: "NewsSplit" }],
  openGraph: {
    type: "website",
    siteName: config.siteName,
    title,
    description,
    url: config.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/api/feed", title: `${config.siteName} — top stories` }],
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
};

/** Applied before first paint so the theme never flashes. */
const themeScript = `(function(){try{var k="newssplit-theme";var s=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",s||(d?"dark":"light"));}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const status = getStatus();
  const [{ locale, dict }, session] = await Promise.all([getI18n(), auth()]);
  const user = session?.user?.email
    ? { name: session.user.name ?? session.user.email, email: session.user.email, image: session.user.image }
    : null;

  return (
    <html lang={LOCALE_META[locale].htmlLang} data-lang={locale} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-bg text-ink">
        <LocaleProvider locale={locale} dict={dict}>
          <TranslateProvider>
          <a
            href="#main"
            className="sr-only z-[80] rounded-lg bg-ink px-4 py-2 text-sm font-bold text-bg focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          >
            {dict.brand.skipToContent}
          </a>

          <SiteHeader status={status} user={user} />
          <ModeBanner status={status} capturedAt={snapshotCapturedAt()} />

          <main id="main" className="flex-1">
            {children}
          </main>

          <SiteFooter sourceCount={allSources().length} articleCount={status.articleCount} dict={dict} />
          </TranslateProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
