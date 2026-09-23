# One-click translation with Google Cloud Translation

NewsSplit ships a **one-click "Read in" translation feature**: a reader picks
বাংলা / हिन्दी / English and every headline and standfirst on the page swaps to a
machine translation powered by the **Google Cloud Translation API** (v2 REST).
Clicking the language again — or **"as filed"** — restores the publisher's own
words. Nothing is translated until the reader asks: crawlers and no-JS readers
always see the originals.

This document is the step-by-step integration, matching the code in this repo
file for file.

---

## Step 1 — Enable the API and create a server-side key

1. Open the [Google Cloud console](https://console.cloud.google.com/) and
   select (or create) a project.
2. **APIs & Services → Library → "Cloud Translation API" → Enable.**
3. **APIs & Services → Credentials → Create credentials → API key.**
4. Restrict the key: *API restrictions* → **Cloud Translation API** only, and
   add your server's IPs/HTTP referrers if you want defence in depth.
5. (Optional but recommended) Set a **quota policy** on the key so a runaway
   client can never bill you unexpectedly.

> ⚠️ The key is a **server credential**. It lives in `GOOGLE_TRANSLATE_API_KEY`
> and is only read inside a route handler — it is never exposed to the browser
> (there is no `NEXT_PUBLIC_` prefix for a reason).

## Step 2 — Configure the environment

```bash
# .env.local
GOOGLE_TRANSLATE_API_KEY=AIza...        # the key from Step 1
GOOGLE_TRANSLATE_MODEL=nmt              # nmt (neural) or base (phrase-based)
TRANSLATE_MAX_TEXTS=8                   # segments per API request (1–128)
TRANSLATE_MAX_TEXT_LENGTH=2000          # characters per segment
```

(See `.env.example` → *"One-click translation"* for the annotated block.)

`src/lib/config.ts` reads them for you:

```ts
googleTranslateApiKey: str(process.env.GOOGLE_TRANSLATE_API_KEY, ""),
googleTranslateModel: str(process.env.GOOGLE_TRANSLATE_MODEL, "nmt"),
translateMaxTexts: Math.max(1, num(process.env.TRANSLATE_MAX_TEXTS, 8)),
translateMaxTextLength: Math.max(200, num(process.env.TRANSLATE_MAX_TEXT_LENGTH, 2000)),
```

Leaving the key empty disables the endpoint gracefully: `/api/translate`
answers `503 { code: "not-configured" }` and the UI keeps showing originals.

## Step 3 — Server-side client: `src/lib/translate.ts`

The only module that talks to `translation.googleapis.com`. Key behaviours:

- **Batching** — segments already queued for the same target/source ship as one
  `POST /language/translate/v2` call (`q` is an array), so translating a card
  (title + standfirst) costs one request.
- **LRU cache** — repeat headlines never re-bill (2 000 entries, keyed
  `target\0source\0text`).
- **Same-language short-circuit** — an article filed in the target language
  returns untouched without an API call.
- **Typed results** — `{ ok: true, segments } | { ok: false, code, error }`
  so the route can map `not-configured → 503`, `upstream → 502`.

```ts
export async function translateSegments(options: TranslateSegmentsOptions): Promise<TranslateSegmentsResult> {
  // …cache lookup → one batched POST for misses → rebuild caller order…
  response = await fetch("https://translation.googleapis.com/language/translate/v2", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({ q: batch, target, source, format: "text", model: config.googleTranslateModel }),
  });
}
```

The response's `data.translations[].translatedText` is HTML-entity decoded
before caching (`decodeEntities`) so apostrophes never render as `&#39;`.

## Step 4 — Route handler: `src/app/api/translate/route.ts`

`POST /api/translate` is the browser-facing boundary. It validates everything
before anything leaves the box:

```jsonc
// request
{ "texts": ["Headline", "Standfirst…"], "target": "bn", "source": "en" }

// 200 response
{ "ok": true, "target": "bn",
  "segments": [
    { "text": "Headline", "translatedText": "শিরোনাম", "detectedSourceLanguage": "en" }
  ] }
```

- `target` must be one of **bn / en / hi** (`isTranslateTarget` in
  `src/lib/i18n/locales.ts`).
- `texts`: max `TRANSLATE_MAX_TEXTS` entries × `TRANSLATE_MAX_TEXT_LENGTH`
  characters — enforced with the same constants as the Google client.
- `source` is an optional BCP-47 hint (the article's declared language);
  omit it and Google auto-detects (`detectedSourceLanguage` is returned).
- Errors: `400` validation · `503` no API key · `502` upstream failure.

## Step 5 — Client state + request batching: `TranslateProvider.tsx`

`src/components/translate/TranslateProvider.tsx` wraps the app in
`src/app/layout.tsx` and owns three things:

1. **Preferred language** — `bn | en | hi | null`, persisted in
   `localStorage["ns-translate-target"]` so the choice survives navigation.
   `null` (default) means "as filed".
2. **A shared client cache** — one translated string is reused by every card
   showing it.
3. **A micro-batching queue** — when a whole feed swaps at once, pending
   segments are grouped by `(target, source)` and shipped in batches of ≤ 8 in
   a single `POST /api/translate`, instead of one request per headline.

```tsx
// app/layout.tsx
<LocaleProvider locale={locale} dict={dict}>
  <TranslateProvider>
    {/* header, main, footer — every card can now translate itself */}
  </TranslateProvider>
</LocaleProvider>
```

## Step 6 — One-click UI: `TranslateBar.tsx`

The visible control — a labelled chip group:

```
[ READ IN · গ্লোব ] [বাংলা] [हिन्दी] [English] [as filed]
```

One click on a language translates the page; clicking it again (or
**"as filed"**) restores the originals. The labels are i18n'd via
`dict.translate` in `src/lib/i18n/dictionaries.ts`.

```tsx
<TranslateBar />                 // home page, story page
<TranslateBar compact />         // category / search toolbar
```

## Step 7 — Swappable text: `TranslatableText.tsx`

Every headline and standfirst that should react to the control renders through
`<TranslatableText>` (StoryCard titles/summaries, the story page lead, the
coverage list):

```tsx
<h1 className="display text-[1.7rem]">
  <TranslatableText text={lead.title} lang={lead.language} />
</h1>
```

It paints the **original** on the server (crawlable, faithful), then swaps the
node in place when `target` is active — marking the node `lang="bn"` and
`data-translated` so screen readers and CSS can tell. If the API errors, the
publisher's words simply stay on screen.

## Step 8 — Smoke test

```bash
curl -s -X POST http://localhost:3000/api/translate \
  -H 'content-type: application/json' \
  -d '{"texts":["Parliament resumes after the winter break"],"target":"bn","source":"en"}'
# → {"ok":true,"target":"bn","segments":[{"text":"…","translatedText":"শীতকালীন বিরতির পর সংসদ আবার বসছে…"}]}
```

Then open the home page, click **বাংলা** in the "Read in" bar and watch every
headline flip; click **as filed** to flip back.

## Cost, quotas & caching — what keeps this cheap

| Layer | What it saves |
| --- | --- |
| Same-language short-circuit | zero calls for articles already in the target language |
| Server LRU (`translate.ts`) | repeat headlines billed once per instance |
| Client cache + batch queue (`TranslateProvider.tsx`) | one POST per ~8 segments, nothing refetched across cards/pages |
| `Cache-Control: no-store` on the API | only the LRU decides freshness, per existing API conventions |

Cloud Translation v2 bills per **character**; NMT text up to 30k characters/month
is included in the free tier at the time of writing — check
[current pricing](https://cloud.google.com/translate/pricing). For heavy
production traffic consider Translation API **v3** (glossaries, Adaptive
Translation) or a per-user rate limit at the route; the swap-in point is the
single `translateSegments` function.

## Security notes

- The API key is **only** referenced in `src/lib/translate.ts` (server) and the
  route handler; client code speaks to `/api/translate` exclusively.
- `/api/translate` is unauthenticated by design (like `/api/news`) — anyone who
  can read your news can translate it. The text-length/count caps bound the
  abuse surface; add your own rate limiting (e.g. at the edge) if needed.
- Originals always remain the canonical link target: translation changes the
  display text only, never the `href` to the publisher.

## File map

| File | Role |
| --- | --- |
| `src/lib/translate.ts` | Google Cloud Translation v2 REST client + LRU |
| `src/app/api/translate/route.ts` | `POST /api/translate` validation + errors |
| `src/lib/i18n/locales.ts` | `TRANSLATE_TARGETS` (bn·en·hi), `isTranslateTarget` |
| `src/components/translate/TranslateProvider.tsx` | preference, client cache, batch queue |
| `src/components/translate/TranslateBar.tsx` | the one-click control |
| `src/components/translate/TranslatableText.tsx` | swappable headline/standfirst node |
| `src/lib/i18n/dictionaries.ts` | `dict.translate.*` labels in all four locales |
| `src/lib/__tests__/translate.test.ts` | unit tests (mocked fetch, cache, batching) |
