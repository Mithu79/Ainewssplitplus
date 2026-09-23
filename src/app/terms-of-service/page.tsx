import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
const UPDATED = "2026-09-23";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.legal.termsTitle,
    description: "The terms under which NewsSplit, its API and RSS output are provided.",
    alternates: { canonical: "/terms-of-service" },
  };
}

export default async function TermsPage() {
  const { dict } = await getI18n();
  return (
    <LegalPage
      dict={dict}
      kicker="Legal"
      title={dict.legal.termsTitle}
      intro="NewsSplit is open-source software provided free of charge. These terms are short because the service is simple: it links you to other people's journalism."
      updated={UPDATED}
      sections={[
        {
          id: "acceptance",
          heading: "Using the service",
          body: (
            <p>
              By loading NewsSplit, its JSON API or its RSS output you agree to these terms. If you operate your own
              instance from the source code, these terms describe the defaults your visitors see; you are free to replace
              them, subject to the MIT licence.
            </p>
          ),
        },
        {
          id: "content",
          heading: "Third-party content",
          body: (
            <>
              <p>
                Every headline, summary and image on NewsSplit is produced by, and remains the property of, the publisher
                it links to. NewsSplit displays the excerpt a publisher chose to put in its public feed and always links
                through to the original article. NewsSplit does not endorse, verify or take editorial responsibility for
                that content.
              </p>
              <blockquote>
                Ranking and clustering are automatic. A story appearing first, or being merged with another outlet's
                coverage, is the output of a transparent scoring function (see <a href="/about">How it works</a>), not a
                human judgement about importance or accuracy.
              </blockquote>
            </>
          ),
        },
        {
          id: "accounts",
          heading: "Accounts",
          body: (
            <ul>
              <li>You must provide a working email address and keep your password to yourself.</li>
              <li>One person, one account. Automated account creation is not permitted.</li>
              <li>You are responsible for activity under your account until you sign out or tell us it was compromised.</li>
              <li>We may delete inactive or abusive accounts; you may delete yours at any time (see the privacy policy).</li>
            </ul>
          ),
        },
        {
          id: "api",
          heading: "API & RSS output",
          body: (
            <>
              <p>
                <code>/api/news</code>, <code>/api/story</code>, <code>/api/status</code> and <code>/api/feed</code> are
                public and unauthenticated. Please be a good neighbour:
              </p>
              <ul>
                <li>Cache responses and respect the <code>Cache-Control</code> headers.</li>
                <li>Do not exceed roughly one request per second per client without asking first.</li>
                <li>Attribute the underlying publishers when you redistribute anything you fetched.</li>
                <li>Do not use the output to build a service that strips publisher attribution or links.</li>
              </ul>
              <p>
                <code>POST /api/refresh</code> is reserved for the operator and protected by <code>REFRESH_TOKEN</code>.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          heading: "Acceptable use",
          body: (
            <p>
              Do not attempt to overload the service, probe it for vulnerabilities outside the process described in the{" "}
              <a href="/security-policy">security policy</a>, scrape account data, or use NewsSplit to harass, defame or
              deceive. We may block clients that do.
            </p>
          ),
        },
        {
          id: "warranty",
          heading: "No warranty",
          body: (
            <p>
              The software is licensed under the MIT licence and the hosted service is provided “as is”, without warranty
              of any kind. Feeds go down, publishers change URLs and the crawler will sometimes serve a cached or bundled
              snapshot — the banner at the top of every page tells you which. To the fullest extent permitted by law, the
              operators are not liable for any loss arising from your use of the service or reliance on its content.
            </p>
          ),
        },
        {
          id: "termination",
          heading: "Changes & termination",
          body: (
            <p>
              We may change or discontinue the service, or these terms, at any time. Continued use after a change means
              you accept the new terms. The “last updated” date above and the repository history record every revision.
            </p>
          ),
        },
        {
          id: "law",
          heading: "Governing law",
          body: (
            <p>
              Unless the operator of a specific deployment states otherwise, these terms are governed by the laws of
              India, and disputes are subject to the courts of Kolkata, West Bengal.
            </p>
          ),
        },
      ]}
    />
  );
}
