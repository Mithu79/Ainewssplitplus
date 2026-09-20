"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CategoryNav } from "./CategoryNav";
import { HeaderShell } from "./HeaderShell";
import { Icon, LogoMark } from "./Icons";
import { LiveStatusPill } from "./LiveStatusPill";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { CATEGORIES } from "@/lib/categories";
import type { StoreStatus } from "@/lib/types";

export function SiteHeader({ status }: { status: StoreStatus }) {
  const pathname = usePathname() ?? "/";
  const activeCategory = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : pathname === "/"
      ? "top"
      : undefined;

  return (
    <HeaderShell>
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="NewsSplit home">
          <LogoMark className="h-8 w-8 transition-transform duration-300 group-hover:-rotate-3" />
          <span className="display text-[1.15rem] leading-none tracking-tight">
            News<span className="text-accent">Split</span>
          </span>
          <span className="hidden border-l border-line pl-2.5 text-[11px] font-medium leading-tight text-faint xl:block">
            Every story,
            <br />
            every source.
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 lg:block">
          <CategoryNav activeId={activeCategory} />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <div className="hidden w-52 xl:block xl:w-64">
            <SearchBox size="sm" />
          </div>
          <Link href="/search" className="icon-button xl:hidden" aria-label="Search stories">
            <Icon name="search" className="h-[18px] w-[18px]" />
          </Link>
          <LiveStatusPill status={status} />
          <ThemeToggle className="hidden sm:inline-flex" />
          <MobileNav categories={CATEGORIES} />
        </div>
      </div>

      <div className="border-t border-line lg:hidden">
        <div className="mx-auto max-w-[1240px] px-2 py-1.5 sm:px-4">
          <CategoryNav activeId={activeCategory} showIcons />
        </div>
      </div>
    </HeaderShell>
  );
}
