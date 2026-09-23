import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Icon } from "@/components/Icons";
import { PreferencesForm } from "@/components/PreferencesForm";
import { SectionHeading } from "@/components/SectionHeading";
import { config } from "@/lib/config";
import { t } from "@/lib/i18n/dictionaries";
import { LOCALE_META } from "@/lib/i18n/locales";
import { getI18n } from "@/lib/i18n/server";
import { findUserById } from "@/lib/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.dashboard.title, robots: { index: false } };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const [{ dict, locale }, user] = await Promise.all([getI18n(), findUserById(session.user.id)]);
  if (!user) redirect("/login?callbackUrl=%2Fdashboard");

  const prefs = user.preferences;
  const region = prefs.region || config.defaultRegion;
  const memberSince = new Date(user.createdAt).toLocaleDateString(LOCALE_META[locale].htmlLang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="border-b border-line bg-bg-tint">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-5 sm:py-12">
          <p className="kicker text-faint">{dict.dashboard.title}</p>
          <h1 className="display mt-2 text-[2rem] leading-[1.1] md:text-[2.6rem]">
            {t(dict.dashboard.welcome, { name: user.name })}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">{dict.dashboard.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 sm:px-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="preferences">
          <SectionHeading id="preferences" kicker={dict.nav.account} title={dict.dashboard.preferences} icon="sliders" />
          <div className="card p-5 sm:p-6">
            <PreferencesForm initialLocale={prefs.locale} initialRegion={prefs.region} />
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="profile">
            <SectionHeading id="profile" kicker={dict.nav.account} title={dict.dashboard.profile} icon="users" />
            <dl className="card divide-y divide-line text-sm">
              <Row label={dict.dashboard.signedInAs}>
                <span className="font-semibold text-ink">{user.name}</span>
                <span className="block truncate text-muted">{user.email}</span>
              </Row>
              <Row label={dict.dashboard.provider}>
                {user.provider === "google" ? dict.dashboard.providerGoogle : dict.dashboard.providerCredentials}
              </Row>
              <Row label={dict.dashboard.memberSince}>{memberSince}</Row>
            </dl>
          </section>

          <section aria-labelledby="quick-links">
            <SectionHeading id="quick-links" title={dict.dashboard.quickLinks} icon="bolt" />
            <div className="flex flex-col gap-2">
              <Link href={`/category/local?region=${encodeURIComponent(region)}`} className="button justify-between">
                <span className="flex items-center gap-2">
                  <Icon name="pin" className="h-4 w-4" />
                  {dict.dashboard.readLocal}
                </span>
                <span className="text-xs text-muted">{region}</span>
              </Link>
              {prefs.locale !== "en" && (
                <Link href={`/api/news?lang=${prefs.locale}&limit=20`} className="button justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="globe" className="h-4 w-4" />
                    {dict.dashboard.readLanguage}
                  </span>
                  <span className="text-xs text-muted">{LOCALE_META[prefs.locale].label}</span>
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline">
      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</dt>
      <dd className="min-w-0 text-ink-soft">{children}</dd>
    </div>
  );
}
