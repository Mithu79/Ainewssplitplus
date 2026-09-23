import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
const UPDATED = "2026-09-23";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.legal.securityTitle,
    description: "How to report a vulnerability in NewsSplit and how the application protects accounts and data.",
    alternates: { canonical: "/security-policy" },
  };
}

export default async function SecurityPolicyPage() {
  const { dict } = await getI18n();
  return (
    <LegalPage
      dict={dict}
      kicker="Legal"
      title={dict.legal.securityTitle}
      intro="We take reports seriously and fix quickly. This page covers how to reach us, what is in scope, and the safeguards already built into the application."
      updated={UPDATED}
      sections={[
        {
          id: "reporting",
          heading: "Reporting a vulnerability",
          body: (
            <>
              <p>
                Please report security issues privately using{" "}
                <a href="https://github.com/Mithu79/Ainewssplitplus/security/advisories/new" target="_blank" rel="noopener noreferrer">
                  GitHub's private vulnerability reporting
                </a>{" "}
                for the repository. Do not open a public issue for anything that could be exploited before it is fixed.
              </p>
              <p>Include what you found, steps to reproduce, the impact you believe it has and, if you like, a suggested fix.</p>
              <ul>
                <li><strong>Acknowledgement:</strong> within 3 working days.</li>
                <li><strong>Triage &amp; initial assessment:</strong> within 7 days.</li>
                <li><strong>Fix or mitigation:</strong> targeted within 30 days for high severity issues.</li>
              </ul>
            </>
          ),
        },
        {
          id: "scope",
          heading: "Scope",
          body: (
            <>
              <p>In scope: the application code in this repository — pages, API routes, the crawler, the parser, authentication and the account store.</p>
              <p>Out of scope:</p>
              <ul>
                <li>Content or availability of the third-party feeds we aggregate.</li>
                <li>Denial-of-service by volume.</li>
                <li>Issues that require a compromised operator machine or environment variables.</li>
                <li>Reports from automated scanners with no demonstrated impact.</li>
              </ul>
            </>
          ),
        },
        {
          id: "safe-harbour",
          heading: "Safe harbour",
          body: (
            <p>
              Good-faith research that respects this policy — no data exfiltration beyond a proof of concept, no
              disruption of other users, no social engineering — will not lead to legal action from the maintainers. If
              in doubt, ask first.
            </p>
          ),
        },
        {
          id: "safeguards",
          heading: "How the application protects data",
          body: (
            <>
              <h3>Accounts &amp; sessions</h3>
              <ul>
                <li>Passwords are hashed with bcrypt (cost 10) and never logged or returned by any API.</li>
                <li>Sessions are signed JWTs in <code>HttpOnly</code>, <code>SameSite=Lax</code> cookies, valid for 30 days.</li>
                <li>Sign-in and sign-up flows are protected by Auth.js CSRF tokens; login errors do not reveal whether an email exists.</li>
                <li><code>/dashboard</code> is guarded by middleware; API routes re-check the session server-side.</li>
                <li>Post-login redirects are restricted to same-origin relative paths.</li>
              </ul>
              <h3>Crawler &amp; parser</h3>
              <ul>
                <li>Every feed download has a timeout, a retry cap and a response-body size cap.</li>
                <li>Feed XML is parsed with entity expansion disabled and HTML in summaries is stripped before rendering.</li>
                <li>Only the fixed registry of public feed URLs is fetched — user input never becomes a crawl target.</li>
              </ul>
              <h3>Platform</h3>
              <ul>
                <li>No third-party JavaScript; API responses are <code>no-store</code> with <code>X-Content-Type-Options: nosniff</code>.</li>
                <li><code>POST /api/refresh</code> requires the <code>REFRESH_TOKEN</code> shared secret.</li>
                <li>Dependencies are pinned through <code>package-lock.json</code> and CI runs typecheck, tests and a build on every change.</li>
              </ul>
            </>
          ),
        },
        {
          id: "operators",
          heading: "Guidance for self-hosters",
          body: (
            <ul>
              <li>Always set a long random <code>AUTH_SECRET</code> and <code>REFRESH_TOKEN</code> in production.</li>
              <li>Keep <code>USERS_FILE</code> outside the web root and back it up like any credential store.</li>
              <li>Terminate TLS in front of the Node server so session cookies are only ever sent over HTTPS.</li>
              <li>Run <code>npm audit</code> and update regularly; watch the repository for security advisories.</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
