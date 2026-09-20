"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icons";

/** Triggers an immediate crawl of every registered feed. */
export function RefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  const onClick = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const status = data.status ?? {};
        const okFeeds = (status.sources ?? []).filter((source: { state: string }) => source.state === "ok").length;
        setMessage({
          tone: okFeeds > 0 ? "ok" : "warn",
          text:
            okFeeds > 0
              ? `Crawl finished — ${status.articleCount ?? 0} stories indexed from ${okFeeds} feeds.`
              : `Crawl finished but no feed responded (${status.mode ?? "unknown"} state). Showing the cached snapshot instead.`,
        });
      } else {
        setMessage({ tone: "warn", text: data.error ?? `Refresh failed (HTTP ${response.status}).` });
      }
    } catch {
      setMessage({ tone: "warn", text: "Could not reach the refresh endpoint." });
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  return (
    <div className={`flex flex-col items-start gap-2 ${className ?? ""}`}>
      <button type="button" onClick={() => void onClick()} disabled={busy} className="button button-primary">
        <Icon name="refresh" className={busy ? "spin h-4 w-4" : "h-4 w-4"} />
        {busy ? "Crawling every feed…" : "Force a refresh now"}
      </button>
      {message && (
        <p
          className="max-w-md rounded-lg px-3 py-2 text-xs font-semibold leading-relaxed"
          style={{
            color: message.tone === "ok" ? "var(--ok)" : "var(--warn)",
            backgroundColor: message.tone === "ok" ? "var(--ok-soft)" : "var(--warn-soft)",
          }}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
