"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

/** Horizontal card rail with edge fades and keyboard/pointer scroll buttons. */
export function RailScroller({ children, step = 320 }: { children: React.ReactNode; step?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setEdges({
      start: scrollLeft <= 4,
      end: scrollLeft + clientWidth >= scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    measure();
    const node = ref.current;
    if (!node) return;
    node.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      node.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollBy = (delta: number) => {
    ref.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative -mx-4 px-4 sm:-mx-5 sm:px-5">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
        onScroll={measure}
      >
        {children}
      </div>

      {!edges.start && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--bg)] to-transparent" />
          <button
            type="button"
            onClick={() => scrollBy(-step)}
            className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg text-muted shadow-[var(--shadow-md)] transition hover:text-ink md:grid"
            aria-label="Scroll left"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
          </button>
        </>
      )}

      {!edges.end && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--bg)] to-transparent" />
          <button
            type="button"
            onClick={() => scrollBy(step)}
            className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg text-muted shadow-[var(--shadow-md)] transition hover:text-ink md:grid"
            aria-label="Scroll right"
          >
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
