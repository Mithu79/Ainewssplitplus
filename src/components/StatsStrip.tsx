import { Icon } from "./Icons";
import { formatNumber } from "@/lib/format";
import type { StoreStatus } from "@/lib/types";

export function StatsStrip({ status }: { status: StoreStatus }) {
  const healthy = status.sources.filter((source) => source.state === "ok").length;
  const failed = status.sources.filter((source) => source.state === "error").length;

  const stats = [
    { label: "Stories indexed", value: formatNumber(status.articleCount), icon: "newspaper" as const },
    { label: "Feeds registered", value: formatNumber(status.sources.length), icon: "rss" as const },
    {
      label: "Feeds responding",
      value: healthy > 0 ? `${healthy}` : `${status.sources.length - failed}`,
      icon: "activity" as const,
      tone: failed > 0 ? "warn" : "ok",
    },
    { label: "Breaking now", value: formatNumber(status.breakingCount), icon: "bolt" as const, tone: "accent" },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5 bg-bg px-3.5 py-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              style={{
                color: stat.tone === "accent" ? "var(--accent)" : stat.tone === "warn" ? "var(--warn)" : "var(--muted)",
                backgroundColor:
                  stat.tone === "accent"
                    ? "var(--accent-soft)"
                    : stat.tone === "warn"
                      ? "var(--warn-soft)"
                      : "var(--surface)",
              }}
            >
              <Icon name={stat.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="display text-xl leading-none tabular-nums">{stat.value}</p>
              <p className="mt-1 truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[11px] text-faint">
        <span className="flex items-center gap-1.5">
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Crawls every {status.refreshIntervalMinutes} min · {status.refreshCount} run{status.refreshCount === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="layers" className="h-3.5 w-3.5" />
          {formatNumber(status.clusterCount)} clusters
        </span>
      </p>
    </div>
  );
}
