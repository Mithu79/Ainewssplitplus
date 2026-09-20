"use client";

import { useEffect, useState } from "react";

/** Sticky header that gains a blur + rule once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? "border-b border-line bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] shadow-[var(--shadow-sm)] backdrop-blur-xl"
          : "border-b border-transparent bg-bg"
      }`}
    >
      {children}
    </header>
  );
}
