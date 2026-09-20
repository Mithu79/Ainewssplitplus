"use client";

import { useState } from "react";
import { faviconCandidates, initials } from "@/lib/format";

/**
 * Publisher favicon with a graceful fallback chain:
 * DuckDuckGo → Google s2 → monogram tile. Offline sandboxes and blocked
 * trackers therefore never leave a broken image in the layout.
 */
export function SourceBadge({
  name,
  domain,
  size = 16,
  className = "",
  showFavicon = true,
  showName = true,
}: {
  name: string;
  domain: string;
  size?: number;
  className?: string;
  showFavicon?: boolean;
  showName?: boolean;
}) {
  const candidates = showFavicon ? faviconCandidates(domain) : [];
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = candidates[index];

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      {showFavicon &&
        (src && !failed ? (
          <img
            src={src}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-4 w-4 shrink-0 rounded-[4px] object-contain"
            onError={() => {
              if (index + 1 < candidates.length) setIndex(index + 1);
              else setFailed(true);
            }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] bg-surface-2 text-[8px] font-bold tracking-tight text-muted"
            style={{ fontSize: Math.max(7, size / 2) }}
          >
            {initials(name)}
          </span>
        ))}
      {showName && <span className="truncate font-medium">{name}</span>}
    </span>
  );
}
