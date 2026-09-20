"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

export function SearchBox({
  initialValue = "",
  placeholder = "Search stories, topics, publishers…",
  size = "md",
  shortcutHint = true,
  autoFocusOnSlash = true,
}: {
  initialValue?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  shortcutHint?: boolean;
  autoFocusOnSlash?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    if (!autoFocusOnSlash) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocusOnSlash]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const height = size === "lg" ? "h-12 text-base" : size === "sm" ? "h-9 text-sm" : "h-10 text-sm";

  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
        <Icon name="search" className={size === "lg" ? "h-[18px] w-[18px]" : "h-4 w-4"} />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search news"
        className={`input ${height} pl-9 ${shortcutHint && size !== "lg" ? "pr-10" : "pr-8"}`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint transition hover:text-ink"
          aria-label="Clear search"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      ) : (
        shortcutHint &&
        size !== "lg" && (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] font-semibold text-faint sm:block">
            /
          </kbd>
        )
      )}
    </form>
  );
}
