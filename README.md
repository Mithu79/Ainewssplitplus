# NewsSplit

**Automated news aggregation — every side of the story in one place.**

NewsSplit crawls 78 public RSS/Atom feed endpoints (BBC, The Guardian, Al Jazeera, The Verge, Ars Technica, ESPN, STAT, Google News in English · বাংলা · हिन्दी · தমি঴், the biggest Bengali publishers and more), normalises and ranks the items, clusters cross-publisher coverage of the same event, and serves the result as a fast, modern, responsive Next.js app — with zero required API keys and no manual editorial step.

![CI](https://github.com/Mithu79/Ainewssplitplus/actions/workflows/ci.yml/badge.svg)

---

## What you get

- **Front page** — breaking ticker, a lead-story hero, eight horizontally scrollable category rails, a “Most covered right now” cluster section, a live “Latest updates” panel and a stats strip. “Top stories” deliberately **mixes Bengali, English and Hindi** coverage (interleaved en → bn → hi) so the home page reads multilingual.
- **Eight categories** — World, Tech, Business, Sports, Science, Health, Entertainment and **Local** (popular Bengali publishers — আনন্দবাজার পত্রিকা, প্রথম আলো, এই সময়, বর্তমান and friends). Every non-local category mixes en + bn + hi sources.
- **Story clustering** — headlines from different publishers about the same event are merged into one story with an “N outlets” pill and a dedicated `/story/[id]` page listing every angle side by side.
- **Search** — ranked full-text search over titles, summaries, tags and publishers.
- **Automatic freshness** — a background crawler re-fetches every feed on an interval (default 10 min); stale data also triggers an on-demand refresh when a visitor arrives.
- **Health & transparency** — `/sources` shows every registered feed with its last state, latency, item count and error, plus `/api/status` for machines.
- **Your own RSS** — NewsSplit re-emits its aggregated output as RSS 2.0 at `/api/feed` (alias `/feed`), per category if you like.
- **Multilingual UI (i18n)** — English, **বাংলা**, **हिन्दी** and **தமிழ்** with a navbar language switcher, a cookie-backed locale (`ns-locale`) and a native-language coverage rail fed by Bengali, Hindi and Tamil RSS sources. Headlines render exactly as the publisher filed them by default.
- **One-click translation** — a “Read in” control (বাংলा · हिन्दी · English) that machine-translates every headline and standfirst in place via **Google Cloud Translation**, server-keyed and cached. Step-by-step: [`docs/translation.md`](docs/translation.md).
- **Accounts (optional)** — Auth.js (NextAuth v5) with **Google sign-in** and **email/password**, bcrypt-hashed passwords, a `/dashboard` profile page where signed-in readers save their preferred language and local-news region, and middleware that keeps `/dashboard` private.
- **Legal pages** — typography-focused `/privacy-policy`, `/terms-of-service` and `/security-policy`, linked from a responsive footer with social icons.
- **Responsive footer** — categories, product links, API endpoints, legal links, social icons and dynamic copyright, all translated.
- **Dark / light theme**, keyboard-friendly, responsive from 320 px to ultrawide; no third-party JS, no analytics.
- **Offline resilience** — when outbound network is unavailable the app serves a bundled real-headline snapshot (`live` → `stale` → `snapshot` modes) and always banners which mode you are in, so nobody mistakes cached data for live coverage.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

That is it — the crawler starts automatically via Next.js instrumentation. No database, no API keys.

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Turbopack dev server on `0.0.0.0:3000` |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Vitest unit suite (parsing, normalising, ranking, clustering, store) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | typecheck + test + build (what CI runs) |
| `npm run refresh` | Ping a deployed instance’s `/api/refresh` (cron helper) |

Demo without any network access:

```bash
NEWS_SPLIT_OFFLINE=always npm run dev   # serves the bundled snapshot
```

## How the pipeline works

```
feed registry (src/lib/sources.ts, 47 feeds)
      │  crawler: timeout + retry, concurrency 6, per-feed caps
      ▼
parse RSS/Atom (fast-xml-parser, with XML repair fallback)
      ▼
normalise  → strip tracking params, split “Title - Publisher” suffixes,
             decode entities, derive images/authors/dates
      ▼
rank       → editorial weight + exponential freshness decay per category,
             image/summary/author bonuses, breaking boost, per-domain
             diversification, low-value & aggregator penalties
      ▼
cluster    → inverted token index over stemmed salient headline tokens;
             merge on Jaccard ≥ 0.5 or containment ≥ 0.75 within ±72 h
      ▼
in-memory store (globalThis singleton) + disk cache (.cache/newssplit.json)
      │
      ├── server components / pages (all force-dynamic)
      ├── JSON API (/api/news, /api/story/[id], …)
      └── RSS output (/api/feed)
```

The store runs in three visible modes:

| Mode | Meaning |
| --- | --- |
| `live` | Last crawl succeeded; data is fresh |
| `stale` | Latest crawl failed but cached data is being served |
| `snapshot` | No outbound network at all — serving the bundled real-headline capture from `src/data/snapshot.json` |

## Categories

Every non-local category carries its English mastheads **plus Bengali and Hindi
Google News topics**, so category listings mix all three languages the same way
the front page does.

| Category | Feeds |
| --- | --- |
| World | BBC News, The Guardian, Al Jazeera, The New York Times, NPR, DW, France 24 + Google News, Google News বাংলা/हिन्दी/தমি঴், NDTV India, आज तक, दैनिक जागरण, தினத்தந்தி |
| Tech | The Verge, Ars Technica, TechCrunch, WIRED, Engadget, MIT Technology Review, The Register, Hacker News + Google News (en · bn · hi) |
| Business | BBC Business, The Guardian, The New York Times, CNBC, MarketWatch + Google News (en · bn · hi) |
| Sports | BBC Sport, ESPN, CBS Sports, Sky Sports, The Guardian, The New York Times + Google News (en · bn · hi) |
| Science | BBC Science, Nature, New Scientist, ScienceDaily, Phys.org, NASA + Google News (en · bn · hi) |
| Health | STAT News, Medical News Today, WHO, The Guardian + Google News (en · bn · hi) |
| Entertainment | BBC Entertainment, Variety, The Hollywood Reporter, The Guardian + Google News (en · bn · hi) |
| Local | **Popular Bengali publishers only** — আনন্দবাজার পত্রিকা, প্রথম আলো, এই সময়, সংবাদ প্রতিদিন, বর্তমান, আজকাল, এবেলা, দৈনিক যুগান্তর, সমকাল, কালের কণ্ঠ, ABP আনন্দ, জি২৪ ঘণ্টা — each via a Google News `site:` query (their own `/rss` paths 404), plus any extra feeds in `LOCAL_FEEDS` |

Add/remove feeds in one place: `src/lib/sources.ts`.

### Indian-language feeds

Every non-English entry declares a `language` field (`"bn" | "hi" | "ta"`),
which the normaliser copies onto each article. The query API filters on it
(`/api/news?lang=bn`), the “In Indian languages” rail groups by it, and the
front-page mix (`MIX_LANGUAGES` in `src/lib/types.ts`) uses it to interleave
English, Bengali and Hindi on every ranked listing. Tamil stays opt-in
(`lang=ta` + the rail) so the default mix keeps the requested three languages.

| Source | Language | Endpoint |
| --- | --- | --- |
| Google News বাংলা / हिन्दी / தமிழ் | bn / hi / ta | `https://news.google.com/rss?hl=<lang>&gl=IN&ceid=IN:<lang>` |
| Per-category Google News topics | bn / hi | `…/rss/headlines/section/topic/<TOPIC>?hl=bn\|hi&gl=IN&ceid=IN:bn\|hi` |
| NDTV India | Hindi (hi) | `https://feeds.feedburner.com/ndtvkhabar-latest` (direct RSS) |
| आज तक, दैनिक जागरण | Hindi (hi) | `site:aajtak.in` / `site:jagran.com` via Google News |
| தினத்தந்தி | Tamil (ta) | `site:dailythanthi.com when:2d` via Google News (their own `/rss` path returns 404) |
| আনন্দবাজার পত্রিকা … জি২৪ ঘণ্টা | Bengali (bn) | `site:<publisher> when:2d` via Google News — the Local desk |

Headlines always render as filed by default; readers can machine-translate any
headline on request via the “Read in” control (see
[`docs/translation.md`](docs/translation.md)). To add another language, add
feeds with a new `language` code and a dictionary in
`src/lib/i18n/dictionaries.ts`.

## Configuration

Every value is optional — see `.env.example` for the full annotated list.

| Variable | Default | Purpose |
| --- | --- | --- |
| `REFRESH_INTERVAL_MINUTES` | `10` | Background re-crawl cadence (also the staleness threshold) |
| `FETCH_TIMEOUT_SECONDS` / `FETCH_RETRIES` / `FETCH_CONCURRENCY` | `10` / `1` / `6` | Crawler HTTP behaviour |
| `MAX_ITEMS_PER_SOURCE` / `MAX_CACHE_ITEMS` | `40` / `1500` | Store caps |
| `CACHE_FILE` | `.cache/newssplit.json` | Disk persistence across restarts |
| `NEWS_SPLIT_OFFLINE` | `auto` | `auto` (fall back to snapshot only if all feeds fail), `always` (never touch the network), `never` (no fallback) |
| `REFRESH_TOKEN` | *(empty)* | Shared secret for `POST /api/refresh` — **empty means unauthenticated**; always set one on public deployments |
| `LOCAL_DEFAULT_REGION` | `West Bengal` | Default region label for the Local category |
| `GOOGLE_NEWS_HL` / `GOOGLE_NEWS_GL` / `GOOGLE_NEWS_CEID` | `en-US` / `US` / `US:en` | Google News locale for locale-aware topics |
| `LOCAL_FEEDS` | *(empty)* | Comma-separated extra local RSS feeds, merged into the Local desk |
| `GOOGLE_TRANSLATE_API_KEY` | *(empty)* | Google Cloud Translation key for the “Read in” feature — **empty disables translation** (503 from `/api/translate`); see [`docs/translation.md`](docs/translation.md) |
| `GOOGLE_TRANSLATE_MODEL` | `nmt` | Translation model (`nmt` or `base`) |
| `TRANSLATE_MAX_TEXTS` / `TRANSLATE_MAX_TEXT_LENGTH` | `8` / `2000` | Per-request caps enforced by `POST /api/translate` |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_SITE_NAME` | `http://localhost:3000` / `NewsSplit` | Metadata, canonical URLs, RSS `<link>` |

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/news?category=&q=&source=&hours=&sort=&limit=&offset=&region=&clustered=&lang=` | The one feed endpoint: ranked articles or clusters, with facets (`lang=bn|hi|ta` for native-language feeds) |
| `GET /api/story/[id]` | A single cluster: lead story, every outlet’s version, related stories |
| `GET /api/categories` | Category metadata + counts |
| `GET /api/status` | Store mode, counts, per-feed health, last error |
| `POST /api/refresh` | Force an immediate crawl (requires `REFRESH_TOKEN` via `?token=` or `Authorization: Bearer`) |
| `GET /api/feed?category=&limit=` (alias `/feed`) | NewsSplit’s own RSS 2.0 output |
| `POST /api/locale` | Sets the `ns-locale` UI-language cookie |
| `POST /api/auth/signup` · `GET/PUT /api/prefs` · `/api/auth/*` | Account creation, saved preferences, Auth.js handlers |

### Accounts & languages

| Variable | Default | What it does |
| --- | --- | --- |
| `AUTH_SECRET` | – | **Set this in production.** Signs session cookies (Auth.js). Missing ⇒ a development-only key is used and a warning is logged. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | – | Google OAuth credentials. Leave empty to ship only email/password. Authorised redirect URI: `https://<domain>/api/auth/callback/google`. |
| `AUTH_URL` | request host | Override the callback base URL behind a proxy. |
| `USERS_FILE` | `.cache/newssplit-users.json` | Where accounts are stored. Passwords are bcrypt hashes; swap `src/lib/users.ts` for a real database when you outgrow a JSON file. |

Languages ship with the code — no environment variables required. Visitors switch language from the navbar (stored in the `ns-locale` cookie for a year); the switcher, dashboard dropdown and every server-rendered page/API read the same locale.

## Keeping a deployment fresh

- **Built-in loop** — the Node server refreshes itself every `REFRESH_INTERVAL_MINUTES` (started from `src/instrumentation.ts`, Node runtime only).
- **External cron** — GitHub Actions workflow `.github/workflows/refresh.yml` POSTs to `/api/refresh` every 15 minutes. Set the repo variable `NEWS_SPLIT_URL` and the secret `REFRESH_TOKEN`. Self-hosted alternative: `npm run refresh` (exit `0` ok, `1` unreachable/auth error, `2` no feed responded).
- **Serverless hosts** — the in-memory store works per-instance and rehydrates from the bundled snapshot when the filesystem is ephemeral; pair it with the external cron so cold starts get poked regularly.

## Project structure

```
src/
├── app/                  # App Router pages, layouts and API routes
│   ├── page.tsx          # front page (hero, rails, clusters, latest)
│   ├── category/[slug]/  # per-category feed pages
│   ├── (auth)/login/     # sign-in page (Google + email/password)
│   ├── (auth)/signup/    # registration
│   ├── dashboard/        # profile: preferred language + local region
│   ├── privacy-policy/ terms-of-service/ security-policy/
│   ├── search/ sources/ about/ story/[id]/
│   └── api/              # news, story, categories, status, refresh, feed, locale, prefs, auth/[...nextauth]
├── components/           # StoryCard, rails, ticker, region picker, …
├── lib/                  # the engine
│   ├── sources.ts        # feed registry (edit this to add feeds)
│   ├── fetcher.ts        # timeout/retry/concurrency crawler
│   ├── parse-feed.ts     # RSS/Atom parsing (+ repair)
│   ├── normalize.ts      # canonical items out of any feed dialect
│   ├── rank.ts           # scoring & diversification
│   ├── dedupe.ts         # URL dedupe + headline clustering
│   ├── store.ts          # singleton store, refresh loop, disk cache
│   ├── users.ts          # JSON-backed accounts (bcrypt hashes, prefs)
│   ├── i18n/             # locales, dictionaries, cookie switching
│   └── snapshot.ts       # bundled offline capture
├── auth.ts               # Auth.js (Node runtime): providers + callbacks
├── auth.config.ts        # edge-safe Auth.js config
├── middleware.ts         # keeps /dashboard behind a session cookie
├── data/snapshot.json    # real headlines for offline/demo mode
└── instrumentation.ts    # starts the crawl loop (Node runtime)
scripts/refresh.mjs       # cron helper for deployed instances
.github/workflows/        # ci.yml (verify + smoke) and refresh.yml (cron)
```

## Tech stack

Next.js 15 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 (CSS-first theme tokens) · fast-xml-parser · Vitest. No database, no tracking, no third-party runtime JS beyond the app itself.

## Tests & CI

`npm run verify` runs typecheck, the Vitest suite (feed parsing, normalising, clustering, ranking, store, the fetcher's body cap, the i18n dictionaries and the account store — 99 tests) and a production build. GitHub Actions additionally boots the built app and smoke-tests `/`, `/api/status`, `/api/news`, `/api/feed`, the three legal pages, `/login` and `/signup`, asserts `/dashboard` redirects signed-out visitors to `/login`, and checks that the `ns-locale=bn` cookie renders the Bengali UI (all in `NEWS_SPLIT_OFFLINE=always` mode so CI never depends on the public feeds being up).

## Licence

MIT — see `package.json`. Headlines, summaries and images belong to their respective publishers; NewsSplit links every item back to the original article and stores nothing about its visitors.
