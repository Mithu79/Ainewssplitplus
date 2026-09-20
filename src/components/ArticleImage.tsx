"use client";

import { useState } from "react";
import { CATEGORY_ICON, Icon } from "./Icons";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

/**
 * News thumbnail with three states: loading skeleton, the image itself, and a
 * generated editorial art block when a feed ships no picture (or the publisher
 * blocks hotlinking).
 */
export function ArticleImage({
  src,
  alt,
  accent,
  iconKey,
  sourceName,
  ratio = "aspect-[16/9]",
  className,
  priority = false,
  children,
}: {
  src?: string;
  alt: string;
  accent: string;
  iconKey?: string;
  sourceName?: string;
  ratio?: string;
  className?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");
  const showArt = !src || state === "error";
  const iconName = CATEGORY_ICON[iconKey ?? ""] ?? "newspaper";

  return (
    <div className={cn("relative isolate overflow-hidden bg-surface", ratio, className)}>
      {!showArt && (
        <>
          {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
            className={cn(
              "image-zoom h-full w-full object-cover transition-opacity duration-500",
              state === "loaded" ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      )}

      {showArt && (
        <div
          className="gradient-art absolute inset-0"
          style={
            {
              "--art-from": `color-mix(in oklab, ${accent} 78%, #111118)`,
              "--art-to": `color-mix(in oklab, ${accent} 26%, #08080c)`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <div className="hairline-grid absolute inset-0 opacity-[0.18]" />
          <div className="absolute inset-0 grid place-items-center">
            <Icon name={iconName} className="h-10 w-10 text-white/45" strokeWidth={1.2} />
          </div>
          {sourceName && (
            <span className="absolute bottom-2 right-2.5 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/80 backdrop-blur-sm">
              {initials(sourceName)}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
