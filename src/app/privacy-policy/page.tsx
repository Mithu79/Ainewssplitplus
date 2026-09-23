import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
const UPDATED = "2026-09-23";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.legal.privacyTitle,
    description: "What NewsSplit stores (almost nothing), the cookies it sets and how account data is handled.",
    alternates: { canonical: "/privacy-policy" },
  };
}

export default async function PrivacyPolicyPage() {
  const { dict } = await getI18n();
  return (
    <LegalPage
      dict={dict}
      kicker="Legal"
      title={dict.legal.privacyTitle}
      intro="NewsSplit is a news aggregator that runs without analytics, advertising or tracking. This page explains the small amount of data the service handles, why, and how to get rid of it."
      updated={UPDATED}
      sections={[
        {
          id: "summary",
          heading: "The short version",
          body: (
            <>
              <ul>
                <li>Reading NewsSplit signed-out stores <strong>nothing</strong> about you on our side.</li>
                <li>Two functional cookies exist: your theme preference (kept in <code>localStorage</code>) and your UI language (<code>ns-locale</code>).</li>
                <li>If you create an account we store your email, display name, a bcrypt hash of your password (or your Google profile id) and two preferences: language and local-news region.</li>
                <li>There are no third-party scripts, pixels, ad networks or analytics of any kind.</li>
              </ul>
            </>
          ),
        },
        {
          id: "what-we-collect",
          heading: "What we collect",
          body: (
            <>
              <h3>Anonymous visitors</h3>
              <p>
                Pages are rendered on the server from an in-memory news store. The server does not write access logs
                that identify individuals, and no client-side telemetry is sent. Your browser will request article images
                directly from the publisher's CDN when you view a card; those requests are governed by the publisher's
                privacy policy, not ours.
              </p>
              <h3>Account holders</h3>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Why</th>
                    <th>Where</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Email address</td>
                    <td>Your sign-in identifier</td>
                    <td><code>USERS_FILE</code> on the server</td>
                  </tr>
                  <tr>
                    <td>Display name &amp; avatar URL</td>
                    <td>Shown in the navbar and dashboard</td>
                    <td><code>USERS_FILE</code></td>
                  </tr>
                  <tr>
                    <td>Password hash (bcrypt)</td>
                    <td>Email/password sign-in — the plaintext is never stored</td>
                    <td><code>USERS_FILE</code></td>
                  </tr>
                  <tr>
                    <td>Preferred language &amp; local region</td>
                    <td>Applied on every device you sign in from</td>
                    <td><code>USERS_FILE</code></td>
                  </tr>
                  <tr>
                    <td>Session token (JWT)</td>
                    <td>Keeps you signed in for up to 30 days</td>
                    <td>An <code>HttpOnly</code> cookie in your browser</td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
        },
        {
          id: "cookies",
          heading: "Cookies & local storage",
          body: (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Purpose</th>
                    <th>Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>ns-locale</code></td>
                    <td>Remembers the interface language you picked</td>
                    <td>1 year</td>
                  </tr>
                  <tr>
                    <td><code>authjs.session-token</code></td>
                    <td>Signed session for account holders</td>
                    <td>30 days</td>
                  </tr>
                  <tr>
                    <td><code>authjs.csrf-token</code>, <code>authjs.callback-url</code></td>
                    <td>Protect the sign-in flow against forgery</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td><code>newssplit-theme</code> (localStorage)</td>
                    <td>Light / dark preference</td>
                    <td>Until cleared</td>
                  </tr>
                </tbody>
              </table>
              <p>All of these are strictly functional. There is no consent banner because there is nothing to consent to.</p>
            </>
          ),
        },
        {
          id: "google",
          heading: "Signing in with Google",
          body: (
            <p>
              When a deployment enables Google sign-in, Google tells us your email address, display name and profile
              picture once you approve the consent screen. We do not receive your Google password and we request no other
              scopes. You can revoke access at any time from your Google account's third-party apps page; your NewsSplit
              account keeps working with the same email if you later set a password.
            </p>
          ),
        },
        {
          id: "publishers",
          heading: "Headlines belong to publishers",
          body: (
            <p>
              NewsSplit stores headlines, standfirsts, publication times and image URLs from public RSS/Atom feeds for
              the purpose of linking readers back to the original article. It does not store article bodies, does not
              rewrite or translate headlines, and honours removals — if you publish one of these feeds and want to be
              excluded, open an issue and the source will be removed from <code>src/lib/sources.ts</code>.
            </p>
          ),
        },
        {
          id: "retention",
          heading: "Retention & deletion",
          body: (
            <>
              <p>
                News data is rolling: each crawl replaces the previous one and nothing older than the store cap is kept.
                Account records persist until you ask for deletion. To delete your account, open an issue from the email
                address on the account or contact the operator of the deployment you use; the record is removed from
                <code>USERS_FILE</code> and your session cookie stops validating immediately.
              </p>
              <p>Self-hosters: the entire account store is a single JSON file — deleting it deletes every account.</p>
            </>
          ),
        },
        {
          id: "changes",
          heading: "Changes to this policy",
          body: (
            <p>
              Material changes are recorded in the repository history and the “last updated” date above. Because there
              is no mailing list, we cannot notify you individually — please check back occasionally.
            </p>
          ),
        },
      ]}
    />
  );
}
