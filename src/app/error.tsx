"use client";

import { useEffect } from "react";
import { Icon } from "@/components/Icons";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[newssplit] render error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-5 px-4 py-20 text-center sm:px-5">
      <span className="grid h-16 w-16 place-items-center rounded-2xl" style={{ color: "var(--warn)", backgroundColor: "var(--warn-soft)" }}>
        <Icon name="alert" className="h-7 w-7" />
      </span>
      <div>
        <h1 className="display text-3xl">Something broke while rendering this page</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          The crawler keeps running in the background, so a retry usually fixes it. If it does not, check the feed health page
          for endpoints that stopped responding.
        </p>
        {error.digest && <p className="mt-2 font-mono text-[11px] text-faint">digest: {error.digest}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="button button-primary">
          <Icon name="refresh" className="h-4 w-4" />
          Try again
        </button>
        <a href="/sources" className="button">
          <Icon name="activity" className="h-4 w-4" />
          Feed health
        </a>
      </div>
    </div>
  );
}
