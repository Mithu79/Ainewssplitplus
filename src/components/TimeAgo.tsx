"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";

/** Relative timestamp that keeps itself up to date while the tab is open. */
export function TimeAgo({
  iso,
  className,
  prefix,
  intervalMs = 30_000,
}: {
  iso: string;
  className?: string;
  prefix?: string;
  intervalMs?: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, intervalMs);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  const label = timeAgo(iso, now);
  return (
    <time dateTime={iso} className={className} title={new Date(iso).toLocaleString()} suppressHydrationWarning>
      {prefix ? `${prefix} ` : ""}
      {label}
    </time>
  );
}
