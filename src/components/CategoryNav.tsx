import Link from "next/link";
import { CATEGORY_ICON, Icon } from "./Icons";
import { cn } from "@/lib/cn";
import { CATEGORIES } from "@/lib/categories";

export function CategoryNav({
  activeId,
  className,
  showIcons = false,
}: {
  activeId?: string;
  className?: string;
  showIcons?: boolean;
}) {
  return (
    <nav aria-label="News categories" className={cn("no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1", className)}>
      <NavLink href="/" label="Top stories" active={activeId === "top"} icon="bolt" showIcon={showIcons} />
      {CATEGORIES.map((category) => (
        <NavLink
          key={category.id}
          href={category.href}
          label={category.short}
          active={activeId === category.id}
          accent={category.accent}
          icon={CATEGORY_ICON[category.icon] ?? "newspaper"}
          showIcon={showIcons}
        />
      ))}
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  accent,
  icon,
  showIcon,
}: {
  href: string;
  label: string;
  active?: boolean;
  accent?: string;
  icon: string;
  showIcon?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
        active ? "bg-ink text-bg" : "text-muted hover:bg-surface hover:text-ink",
      )}
    >
      {showIcon && <Icon name={icon as never} className="h-3.5 w-3.5" style={active ? undefined : { color: accent }} />}
      {label}
      {active && accent && <span className="absolute -bottom-[7px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: accent }} />}
    </Link>
  );
}
