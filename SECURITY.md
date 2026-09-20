# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

Security fixes land on the default branch and ship with the next release/tag.

## Reporting a Vulnerability

Please report vulnerabilities **privately** via
[GitHub Security Advisories](https://github.com/Mithu79/Ainewssplitplus/security/advisories/new)
(“Report a vulnerability”) — or, if that is not available to you, open a private
channel with the maintainers. Please do **not** file a public issue for
security reports.

Include:

- a description of the issue and its impact,
- step-by-step reproduction instructions (or a proof of concept),
- the affected version/commit, and
- any suggested remediation you already have in mind.

We aim to acknowledge reports within **72 hours** and to provide an initial
assessment within a week. When a fix is ready we will coordinate disclosure
with you and credit reporters who request it.

## Scope notes

NewsSplit is a read-only news aggregator; the following areas are the most
security-relevant:

- **`POST /api/refresh`** — protected by the `REFRESH_TOKEN` shared secret
  (query param or `Authorization: Bearer`). An **empty token disables
  authentication entirely** — fine for local development, but any publicly
  reachable deployment must set a strong token, otherwise anyone can trigger
  crawls on demand.
- **Outbound fetching** — the crawler only requests URLs from the static feed
  registry (`src/lib/sources.ts`) and operator-supplied `LOCAL_FEEDS`;
  user-supplied URLs are never fetched. Timeouts, retries, an 8 MiB response
  body cap and per-feed item caps bound resource usage.
- **XML parsing** — RSS/Atom parsing uses `fast-xml-parser` with entity
  decoding; malformed feeds are rejected rather than repaired destructively,
  and oversized payloads are cut off before parsing (see the body cap above).
- **No user data** — the app stores no accounts, no cookies and no analytics;
  the only persisted state is the aggregated article cache
  (`CACHE_FILE`, default `.cache/newssplit.json`).

Vulnerabilities in third-party feeds themselves (e.g. a publisher’s site) are
out of scope — please report those to the publisher.
