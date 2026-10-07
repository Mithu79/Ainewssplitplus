# Live RSS news on Vercel

## 1. Disable the bundled snapshot

In the **Vercel dashboard**:

1. Open the NewsSplit project.
2. Go to **Settings → Environment Variables**.
3. Add (or edit) the variable with **Key** `NEWS_SPLIT_OFFLINE` and **Value** `never`.
   Enter just `never`, without quotes, not the whole `NEWS_SPLIT_OFFLINE=never` assignment.
4. Select **Production**. Also select **Preview** if you want live feeds in preview deployments; check for any branch-specific override still set to `always` or `auto`.
5. Save the variable.
6. Open **Deployments**, find the deployment for the intended environment, and choose **Redeploy** from its menu. Environment changes apply to new deployments, not functions already deployed.
7. Once it is ready, open the new deployment's URL or your production domain.

This is a **server-side** variable: do not prefix it with `NEXT_PUBLIC_`. Changing `.env.example` in Git does not change Vercel's environment settings.

### What the setting means

- `always`: normally serves only bundled headlines; useful for demos and tests.
- `auto` (default): attempts live crawling but may display the bundled snapshot during startup or when feeds fail.
- `never`: does not hydrate from the bundled snapshot. A fresh instance starts empty until a crawl completes. If all feeds fail, it remains empty; previously crawled stories may still be served as `stale`.

`never` prevents old demo headlines from masking a failed crawl. It does **not** fix network access, publisher errors, or function timeouts. News freshness depends on publisher updates and the crawl interval, not an instantaneous push stream.

## 2. Check crawler settings

Feeds are already registered in `src/lib/sources.ts`; no RSS API key is required. The fetcher follows redirects, requests RSS/Atom/XML, and explicitly uses `cache: "no-store"`.

Relevant settings:

| Variable | Value / guidance |
| --- | --- |
| `NEWS_SPLIT_OFFLINE` | `never` |
| `REFRESH_INTERVAL_MINUTES` | `10` by default; this is a target interval while the process is running, not a Vercel schedule |
| `FETCH_TIMEOUT_SECONDS` | `10` per feed attempt by default |
| `FETCH_RETRIES` | `1` retry by default |
| `FETCH_CONCURRENCY` | `6` feeds in parallel by default |
| `CACHE_FILE` | On Vercel, use `/tmp/newssplit.json` rather than the default project-relative `.cache/newssplit.json`, since the deployment filesystem is read-only outside temporary storage |
| `REFRESH_TOKEN` | Set a strong random secret before exposing the refresh endpoint publicly; without it, anyone can trigger a crawl |

`/tmp` is only a disposable, instance-local cache, **not shared or durable storage**. Do not use it as a production account database.

**Function duration:** `src/app/api/refresh/route.ts` currently exports `maxDuration = 60`. With many feeds and retries, a full crawl can exceed 60 seconds. If logs show function timeouts, tune the timeout/retry/concurrency values or increase the route's `maxDuration` within your Vercel plan's supported limit. For a conservative starting point under the current limit, try `FETCH_TIMEOUT_SECONDS=5`, `FETCH_RETRIES=0`, and `FETCH_CONCURRENCY=12`, then check actual timings. This reduces the network wait budget but is not a guarantee of completion, and shorter timeouts may exclude slow publishers. Redeploy after changes.

## 3. Verify the deployment

Open `https://YOUR-DOMAIN/api/status`. Confirm:

- `offlineMode` and `config.offlineMode` are both `"never"`.
- After a successful crawl, `mode` is `"live"`, `articleCount` is greater than zero, and `lastSuccessfulRefreshAt` is recent.
- At least some entries in `sources` have `state: "ok"` and `items > 0`.

On cold start, `mode: "empty"` and `refreshing: true` can be temporary. If the environment still reports `auto` or `always`, check the deployment URL, selected environment, branch overrides, and redeployment.

To explicitly await a crawl, send a **POST**, not a browser GET, to `/api/refresh`. From a trusted terminal, using your own domain and a locally set `REFRESH_TOKEN`:

```sh
curl --fail-with-body --max-time 150 \
  -X POST 'https://YOUR-DOMAIN/api/refresh' \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

Keep the token private; prefer the header over a query parameter that may appear in logs. The curl timeout does not override Vercel's function duration limit.

Inspect **`feedsResponding`** and **`status.mode`** in the POST response. Its top-level `ok: true` means the handler completed, not that a feed succeeded. Look for `feedsResponding > 0`, `status.mode: "live"`, and a recent `status.lastSuccessfulRefreshAt`.

If feeds fail, inspect `sources[].error`, `sources[].httpStatus`, `sources[].latencyMs`, and `lastError`, plus the deployment's **Logs**:

- HTTP 403/429: publisher blocking or rate limiting.
- Timeout/network error: feed reachability or latency.
- Parse error / no usable items: an endpoint may return HTML or an unsupported/broken feed.
- Cache write failed: check `CACHE_FILE` points under `/tmp`.
- Function timeout: adjust the crawl budget as described above.

## 4. Understand article images

Open `/api/news?limit=20` and inspect `articles[].image`. The pipeline extracts images from RSS media elements, image enclosures, and embedded HTML. `ArticleImage` displays these URLs directly; it does not require a Next.js image-domain allowlist.

Category artwork is intentional when an article has no image URL or the image fails to load. Google News and some other feeds often omit pictures. The crawler does not visit every article page to scrape Open Graph images. Live mode therefore enables publisher images **where supplied and accessible**, not a photo for every story.

If `image` exists but the card still shows artwork, open the image URL and inspect the browser's Network/Console tabs for a broken URL, hotlink blocking, or HTTPS mixed-content errors.

## 5. Serverless scheduling limitation

The built-in refresh loop uses an in-process timer. Vercel may suspend or replace instances, so that timer is not a reliable scheduler. Request-triggered background work is also not guaranteed to finish after the response.

The repository includes `.github/workflows/refresh.yml`, which POSTs to `/api/refresh` every 15 minutes when the repository variable `NEWS_SPLIT_URL` is configured (and the repository secret `REFRESH_TOKEN` matches the deployment). This can trigger a crawl, but **it does not warm every Vercel instance**: the current store is in memory with an optional local file. A later page/API request can reach a different instance with an empty store.

For dependable freshness across serverless instances, use a shared persistent news store and a scheduled ingestion job that writes to it, with pages reading that shared store. Alternatively, run the existing crawler on a long-lived Node host. Setting `NEWS_SPLIT_OFFLINE=never` is the snapshot switch, not a replacement for that architecture.
