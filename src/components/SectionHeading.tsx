import Link from "next/link";
import { Icon, type IconName } from "./Icons";
import { cn } from "@/lib/cn";

export function SectionHeading({
  id,
  kicker,
  title,
  icon,
  accent,
  href,
  hrefLabel = "View all",
  count,
  className,
  children,
}: {
  id?: string;
  kicker?: string;
  title: string;
  icon?: IconName;
  accent?: string;
  href?: string;
  hrefLabel?: string;
  count?: number | string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            style={{
              color: accent ?? "var(--ink)",
              backgroundColor: accent ? `color-mix(in oklab, ${accent} 14%, transparent)` : "var(--surface)",
            }}
          >
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          {kicker && <p className="kicker text-faint">{kicker}</p>}
          <h2 id={id} className="display truncate text-xl md:text-[1.45rem]">
            {title}
          </h2>
        </div>
        {children}
      </div>

      <div className="flex items-center gap-3">
        {count !== undefined && <span className="text-xs font-medium text-faint">{count}</span>}
        {href && (
          <Link
            href={href}
            className="group flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted transition hover:border-ink hover:text-ink"
          >
            {hrefLabel}
            <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
