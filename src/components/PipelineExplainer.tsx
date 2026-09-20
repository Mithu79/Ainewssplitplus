import { Icon, type IconName } from "./Icons";
import { config } from "@/lib/config";

const PIPELINE: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Crawl",
    body: `${config.concurrency}-way parallel fetch of every registered RSS and Atom endpoint, with per-feed timeouts and one retry.`,
    icon: "rss",
  },
  {
    title: "Normalise",
    body: "CDATA, entities, media:content, enclosures, Atom hrefs and four date formats collapse into one Article shape.",
    icon: "sliders",
  },
  {
    title: "De-duplicate",
    body: "Canonical URLs merge the same syndicated item and union every category it appeared in.",
    icon: "check",
  },
  {
    title: "Cluster",
    body: "Salient-token similarity groups different outlets that are reporting the same event.",
    icon: "layers",
  },
  {
    title: "Rank & serve",
    body: `Source trust, a per-category recency half-life and completeness set the order — then the loop repeats every ${Math.round(
      config.refreshIntervalMs / 60_000,
    )} minutes.`,
    icon: "trending",
  },
];

export function PipelineExplainer({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={`grid gap-px bg-line ${compact ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
      {PIPELINE.map((step, index) => (
        <li key={step.title} className="flex gap-3 bg-bg px-4 py-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-muted">
            <Icon name={step.icon} className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-faint">Step {index + 1}</p>
            <p className="mt-0.5 text-sm font-bold">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
