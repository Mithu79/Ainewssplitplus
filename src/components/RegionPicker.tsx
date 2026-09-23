"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";

const STORAGE_KEY = "newssplit-region";

export const REGION_PRESETS = [
  "West Bengal",
  "Kolkata",
  "Howrah",
  "Darjeeling",
  "Bangladesh",
  "Dhaka",
  "Chattogram",
  "Tripura",
  "Assam",
  "New Delhi",
  "Mumbai",
  "Bengaluru",
];

/**
 * The Local desk reads popular Bengali publishers. The region choice is stored
 * on the device, pushed into the URL (so it is shareable) and used server-side
 * to label and cache on-demand coverage for a place plus any feeds configured
 * through LOCAL_FEEDS.
 */
export function RegionPicker({ region, defaultRegion }: { region: string; defaultRegion: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(region);
  const [pending, setPending] = useState(false);

  // Restore the reader's saved region the first time they open Local news.
  useEffect(() => {
    if (searchParams.get("region")) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved && saved !== region) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("region", saved);
      setValue(saved);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, region, router, searchParams]);

  const apply = (next: string) => {
    const trimmed = next.trim();
    if (!trimmed || trimmed === region) return;
    setValue(trimmed);
    setPending(true);
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("region", trimmed);
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
    window.setTimeout(() => setPending(false), 900);
  };

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_oklab,#06b6d4_15%,transparent)] text-[#0891b2]">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold">Your region</p>
            <p className="text-xs text-muted">
              Showing local coverage for <span className="font-semibold text-ink">{region}</span>
              {region === defaultRegion && <span className="text-faint"> (default)</span>}
            </p>
          </div>
        </div>
        {pending && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Icon name="refresh" className="spin h-3.5 w-3.5" />
            Re-crawling local feeds…
          </span>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply(value);
        }}
        className="flex gap-2"
      >
        <input
          className="input h-10"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="City, region or country — e.g. Austin, Texas"
          aria-label="Local news region"
        />
        <button type="submit" className="button button-primary h-10 shrink-0 px-4" disabled={pending}>
          Update
        </button>
      </form>

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {REGION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => apply(preset)}
            className={`chip shrink-0 ${preset === region ? "border-ink bg-ink text-bg" : ""}`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
