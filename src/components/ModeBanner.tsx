import Link from "next/link";
import { Icon } from "./Icons";
import { formatFullDate } from "@/lib/format";
import { MODE_LABEL } from "@/lib/store-status-client";
import type { StoreStatus } from "@/lib/types";

/**
 * Transparency strip: tells the reader exactly what they are looking at when
 * the crawler could not reach the live feeds.
 */
export function ModeBanner({ status, capturedAt }: { status: StoreStatus; capturedAt?: string }) {
  if (status.mode === "live") return null;

  const snapshot = status.mode === "snapshot";
  const tone = snapshot ? "info" : "warn";
  const icon = snapshot ? "info" : "alert";

  return (
    <div
      className="flex flex-col gap-2 border-b px-4 py-2.5 text-[12.5px] sm:flex-row sm:items-center sm:gap-3 sm:px-5"
      style={{
        backgroundColor: `var(--${tone}-soft)`,
        borderColor: `color-mix(in oklab, var(--${tone}) 30%, var(--line))`,
      }}
    >
      <span className="flex items-center gap-2 font-bold" style={{ color: `var(--${tone})` }}>
        <Icon name={icon as "info"} className="h-4 w-4 shrink-0" />
        {MODE_LABEL[status.mode] ?? status.mode}
      </span>
      <p className="leading-relaxed text-ink-soft">
        {snapshot ? (
          <>
            This environment cannot reach the publishers&rsquo; RSS endpoints, so NewsSplit is serving its bundled snapshot
            {capturedAt ? ` captured ${formatFullDate(capturedAt)}` : ""} — the real headlines, links and timestamps from{" "}
            {status.sources.length} registered feeds. Give the server outbound HTTPS access (or set{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[11px]">NEWS_SPLIT_OFFLINE=never</code>) and it crawls live
            every {status.refreshIntervalMinutes} minutes.
          </>
        ) : (
          <>
            The last crawl did not reach any feed, so cached stories are being shown.{" "}
            {status.lastError ? <span className="text-muted">Last error: {status.lastError}. </span> : null}
            Retrying automatically every {status.refreshIntervalMinutes} minutes.
          </>
        )}
      </p>
      <Link href="/sources" className="shrink-0 font-bold underline underline-offset-2 hover:no-underline" style={{ color: `var(--${tone})` }}>
        Feed health →
      </Link>
    </div>
  );
}
