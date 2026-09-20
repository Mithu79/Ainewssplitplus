"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveDot } from "./Badges";
import { Icon } from "./Icons";
import { describeFreshness } from "@/lib/store-status-client";
import type { StoreStatus } from "@/lib/types";

const POLL_MS = 45_000;

/**
 * Shows crawler state and keeps the page honest about where the data came from.
 * When the server finishes a new crawl the page re-renders itself, so the front
 * page updates without the reader doing anything.
 */
export function LiveStatusPill({ status: initial, compact = false }: { status: StoreStatus; compact?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<StoreStatus>(initial);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const seenRefresh = useRef<string | null>(initial.lastRefreshAt);

  useEffect(() => setStatus(initial), [initial]);

  const poll = useCallback(async () => {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as StoreStatus;
      setStatus(next);
      if (next.lastRefreshAt && next.lastRefreshAt !== seenRefresh.current) {
        seenRefresh.current = next.lastRefreshAt;
        setFlash(true);
        window.setTimeout(() => setFlash(false), 2600);
        if (!document.hidden) router.refresh();
      }
    } catch {
      /* offline — the pill keeps showing the last known state */
    }
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) void poll();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [poll]);

  const refreshNow = async () => {
    setBusy(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
    } catch {
      /* ignore */
    }
    await poll();
    setBusy(false);
    router.refresh();
  };

  const label =
    status.mode === "live" ? "Live" : status.mode === "stale" ? "Stale" : status.mode === "snapshot" ? "Snapshot" : "No data";

  const spinning = busy || status.refreshing;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
        flash ? "border-[color-mix(in_oklab,var(--ok)_55%,var(--line))] bg-ok-soft" : "border-line bg-bg"
      }`}
      title={
        status.mode === "snapshot"
          ? "Live feeds could not be reached, so the bundled snapshot is being served."
          : `Crawled ${describeFreshness(status.lastRefreshAt)} · ${status.articleCount} stories from ${status.sources.filter((s) => s.state === "ok").length} feeds`
      }
    >
      {spinning ? (
        <Icon name="refresh" className="spin h-3.5 w-3.5 text-accent" />
      ) : (
        <LiveDot state={status.mode} />
      )}
      {!compact && (
        <span className="hidden text-muted sm:inline">
          {spinning ? "Updating…" : `${label} · ${describeFreshness(status.lastRefreshAt)}`}
        </span>
      )}
      <span className="sr-only">{`${label}, updated ${describeFreshness(status.lastRefreshAt)}`}</span>
      <button
        type="button"
        onClick={() => void refreshNow()}
        disabled={spinning}
        className="icon-button ml-0.5 h-6 w-6 rounded-full"
        aria-label="Refresh feeds now"
        title="Refresh feeds now"
      >
        <Icon name="refresh" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
